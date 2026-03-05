import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { randomUUID } from 'crypto'
import type { Viewing, SearchResult, UserProfile, Notification } from '../types'
import {
  viewingRequestToAgentEmail,
  viewingConfirmationToBuyerEmail,
} from '../email-templates'

const dynamo = new DynamoDBClient({})
const ses = new SESClient({})

export const definition = {
  name: 'schedule_viewing',
  description:
    'Schedule a property viewing by sending a request email to the seller\'s agent and a confirmation to the buyer. Use this when the user wants to arrange a visit to a property they\'ve found.',
  input_schema: {
    type: 'object',
    properties: {
      listingId: {
        type: 'string',
        description: 'The listing ID from search results.',
      },
      profileId: {
        type: 'string',
        description: 'The search profile ID that found this listing.',
      },
      availabilitySlots: {
        type: 'array',
        items: { type: 'string' },
        description: 'Two or more date/time options the buyer is available, in ISO 8601 format, e.g. ["2026-03-15T14:00:00", "2026-03-16T10:00:00"]. Collect these from the user before calling this tool.',
      },
    },
    required: ['listingId', 'profileId', 'availabilitySlots'],
  },
}

interface ScheduleViewingInput {
  listingId: string
  profileId: string
  availabilitySlots: string[]
}

export async function execute(
  userId: string,
  input: ScheduleViewingInput,
  userEmail: string,
): Promise<{ viewingId: string; message: string }> {
  const now = new Date().toISOString()

  // Look up listing data from SearchResults
  const srResult = await dynamo.send(
    new GetItemCommand({
      TableName: process.env.SEARCH_RESULTS_TABLE!,
      Key: {
        userId: { S: userId },
        profileIdListingId: { S: `${input.profileId}#${input.listingId}` },
      },
    }),
  )

  const searchResult = srResult.Item ? (unmarshall(srResult.Item) as SearchResult) : null
  const listing = searchResult?.listingData

  const listingAddress = listing?.address ?? `Listing ${input.listingId}`
  const agentEmail = listing?.agentEmail
  const agentName = listing?.agentName

  // Get user's name from profile
  const profileResult = await dynamo.send(
    new GetItemCommand({
      TableName: process.env.USER_PROFILE_TABLE!,
      Key: { userId: { S: userId } },
    }),
  )
  const userProfile = profileResult.Item ? (unmarshall(profileResult.Item) as UserProfile) : null
  const buyerName =
    userProfile?.firstName && userProfile?.lastName
      ? `${userProfile.firstName} ${userProfile.lastName}`
      : userEmail

  const viewingId = randomUUID()
  const viewing: Viewing = {
    userId,
    viewingId,
    listingId: input.listingId,
    profileId: input.profileId,
    listingAddress,
    agentEmail,
    agentName,
    requestedAt: now,
    availabilitySlots: input.availabilitySlots,
    status: 'requested',
  }

  // Save viewing record
  await dynamo.send(
    new PutItemCommand({
      TableName: process.env.VIEWINGS_TABLE!,
      Item: marshall(viewing, { removeUndefinedValues: true }),
    }),
  )

  const chatUrl = `https://app.sirrealtor.com/chat`

  // Email the seller's agent and record the notification regardless of send success
  if (agentEmail) {
    const { subject: agentSubject, html: agentHtml } = viewingRequestToAgentEmail(viewing, userEmail, buyerName, input.availabilitySlots)
    let agentStatus: 'sent' | 'failed' = 'failed'
    try {
      await ses.send(new SendEmailCommand({
        Source: 'noreply@sirrealtor.com',
        Destination: { ToAddresses: [agentEmail] },
        Message: { Subject: { Data: agentSubject }, Body: { Html: { Data: agentHtml } } },
      }))
      agentStatus = 'sent'
    } catch (err) {
      console.error('Failed to email agent for viewing request', err)
    }
    const agentNotification: Notification = {
      userId,
      notificationId: randomUUID(),
      type: 'viewing_request',
      channel: 'email',
      direction: 'on_behalf_of_user',
      recipientAddress: agentEmail,
      subject: agentSubject,
      body: agentHtml,
      sentAt: now,
      status: agentStatus,
    }
    await dynamo.send(new PutItemCommand({
      TableName: process.env.NOTIFICATIONS_TABLE!,
      Item: marshall(agentNotification, { removeUndefinedValues: true }),
    }))
  }

  // Email confirmation to buyer and record the notification regardless of send success
  const { subject: confirmSubject, html: confirmHtml } = viewingConfirmationToBuyerEmail(viewing, chatUrl)
  let buyerStatus: 'sent' | 'failed' = 'failed'
  try {
    await ses.send(new SendEmailCommand({
      Source: 'noreply@sirrealtor.com',
      Destination: { ToAddresses: [userEmail] },
      Message: { Subject: { Data: confirmSubject }, Body: { Html: { Data: confirmHtml } } },
    }))
    buyerStatus = 'sent'
  } catch (err) {
    console.error('Failed to send viewing confirmation to buyer', err)
  }
  const buyerNotification: Notification = {
    userId,
    notificationId: randomUUID(),
    type: 'viewing_confirmation',
    channel: 'email',
    direction: 'to_user',
    recipientAddress: userEmail,
    subject: confirmSubject,
    body: confirmHtml,
    sentAt: now,
    status: buyerStatus,
  }
  await dynamo.send(new PutItemCommand({
    TableName: process.env.NOTIFICATIONS_TABLE!,
    Item: marshall(buyerNotification, { removeUndefinedValues: true }),
  }))

  const agentMsg = agentEmail
    ? ` Request sent to ${agentName ?? 'the agent'} at ${agentEmail}.`
    : ' (No agent contact on file — you may need to reach out directly.)'

  return {
    viewingId,
    message: `Viewing requested for ${listingAddress}.${agentMsg} Confirmation sent to ${userEmail}.`,
  }
}
