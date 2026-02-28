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
      proposedDateTime: {
        type: 'string',
        description: 'Proposed date and time for the viewing in ISO 8601 format, e.g. "2026-03-15T14:00:00".',
      },
    },
    required: ['listingId', 'profileId'],
  },
}

interface ScheduleViewingInput {
  listingId: string
  profileId: string
  proposedDateTime?: string
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
    proposedDateTime: input.proposedDateTime,
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
  const notificationId = randomUUID()

  // Email the seller's agent if we have their contact
  if (agentEmail) {
    const { subject, html } = viewingRequestToAgentEmail(viewing, userEmail, buyerName)
    await ses.send(
      new SendEmailCommand({
        Source: 'noreply@sirrealtor.com',
        Destination: { ToAddresses: [agentEmail] },
        Message: {
          Subject: { Data: subject },
          Body: { Html: { Data: html } },
        },
      }),
    )
  }

  // Email confirmation to buyer
  const { subject: confirmSubject, html: confirmHtml } = viewingConfirmationToBuyerEmail(viewing, chatUrl)
  await ses.send(
    new SendEmailCommand({
      Source: 'noreply@sirrealtor.com',
      Destination: { ToAddresses: [userEmail] },
      Message: {
        Subject: { Data: confirmSubject },
        Body: { Html: { Data: confirmHtml } },
      },
    }),
  )

  // Record the notification
  const notification: Notification = {
    userId,
    notificationId,
    type: 'viewing_request',
    channel: 'email',
    recipientAddress: userEmail,
    subject: confirmSubject,
    sentAt: now,
    status: 'sent',
  }
  await dynamo.send(
    new PutItemCommand({
      TableName: process.env.NOTIFICATIONS_TABLE!,
      Item: marshall(notification),
    }),
  )

  const agentMsg = agentEmail
    ? ` Request sent to ${agentName ?? 'the agent'} at ${agentEmail}.`
    : ' (No agent contact on file — you may need to reach out directly.)'

  return {
    viewingId,
    message: `Viewing requested for ${listingAddress}.${agentMsg} Confirmation sent to ${userEmail}.`,
  }
}
