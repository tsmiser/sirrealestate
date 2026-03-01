import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { randomUUID } from 'crypto'
import type { UserProfile, SearchProfile, SearchCriteria, NotificationPreferences } from '../types'

const dynamo = new DynamoDBClient({})
const lambdaClient = new LambdaClient({})

export const definition = {
  name: 'upsert_search_profile',
  description:
    'Create or update a search profile for the user. Use this when the user describes what kind of property they\'re looking for, or when they want to update existing criteria. You can also toggle monitoring on/off and notification preferences. If profileId is omitted, a new profile is created.',
  input_schema: {
    type: 'object',
    properties: {
      profileId: {
        type: 'string',
        description: 'UUID of an existing search profile to update. Omit to create a new one.',
      },
      name: {
        type: 'string',
        description: 'A short, descriptive name for this search profile, e.g. "3BR Austin under 500k"',
      },
      criteria: {
        type: 'object',
        description: 'Search criteria for property matching.',
        properties: {
          minPrice: { type: 'number' },
          maxPrice: { type: 'number' },
          bedrooms: { type: 'number' },
          bathrooms: { type: 'number' },
          propertyType: { type: 'string', description: 'e.g. single_family, condo, townhouse' },
          city: { type: 'string' },
          state: { type: 'string', description: '2-letter state code, e.g. TX' },
          zipCodes: { type: 'array', items: { type: 'string' } },
        },
      },
      monitoring: {
        type: 'boolean',
        description: 'Whether to run daily MLS searches for this profile and email results.',
      },
      emailNotifications: {
        type: 'boolean',
        description: 'Whether to send email notifications for new matches.',
      },
      isDefault: {
        type: 'boolean',
        description: 'Set this as the default search profile.',
      },
    },
    required: ['name', 'criteria'],
  },
}

interface UpsertInput {
  profileId?: string
  name: string
  criteria: SearchCriteria
  monitoring?: boolean
  emailNotifications?: boolean
  isDefault?: boolean
}

export async function execute(userId: string, input: UpsertInput, userEmail?: string): Promise<{ profileId: string; message: string }> {
  const now = new Date().toISOString()

  // Load existing profile or create new one
  const existing = await dynamo.send(
    new GetItemCommand({
      TableName: process.env.USER_PROFILE_TABLE!,
      Key: { userId: { S: userId } },
    }),
  )

  const userProfile: UserProfile = existing.Item
    ? (unmarshall(existing.Item) as UserProfile)
    : {
        userId,
        email: userEmail ?? '',
        searchProfiles: [],
        createdAt: now,
        updatedAt: now,
      }

  const profileId = input.profileId ?? randomUUID()
  const existingProfileIdx = userProfile.searchProfiles.findIndex((p) => p.profileId === profileId)
  const wasMonitoring = existingProfileIdx !== -1 ? userProfile.searchProfiles[existingProfileIdx].monitoring : false

  const notificationPreferences: NotificationPreferences = {
    email: input.emailNotifications ?? true,
    sms: false,
    push: false,
  }

  const profile: SearchProfile = {
    profileId,
    name: input.name,
    isDefault: input.isDefault ?? (existingProfileIdx === -1 && userProfile.searchProfiles.length === 0),
    criteria: input.criteria,
    monitoring: input.monitoring ?? false,
    notificationPreferences,
    createdAt:
      existingProfileIdx !== -1 ? userProfile.searchProfiles[existingProfileIdx].createdAt : now,
    updatedAt: now,
  }

  if (existingProfileIdx !== -1) {
    userProfile.searchProfiles[existingProfileIdx] = profile
  } else {
    userProfile.searchProfiles.push(profile)
  }

  userProfile.updatedAt = now

  await dynamo.send(
    new PutItemCommand({
      TableName: process.env.USER_PROFILE_TABLE!,
      Item: marshall(userProfile, { removeUndefinedValues: true }),
    }),
  )

  // Trigger an immediate search when monitoring is newly enabled
  const monitoringJustEnabled = profile.monitoring && !wasMonitoring
  if (monitoringJustEnabled && process.env.SEARCH_WORKER_FUNCTION_NAME) {
    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: process.env.SEARCH_WORKER_FUNCTION_NAME,
        InvocationType: 'Event', // async fire-and-forget
        Payload: Buffer.from(JSON.stringify({ userId, profileId })),
      }),
    )
    console.log(`Triggered immediate search for user=${userId} profile=${profileId}`)
  }

  const action = existingProfileIdx !== -1 ? 'updated' : 'created'
  return {
    profileId,
    message: `Search profile "${profile.name}" ${action} successfully. Monitoring: ${profile.monitoring ? 'enabled' : 'disabled'}.`,
  }
}
