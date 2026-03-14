import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import type { UserProfile } from '../types'

const dynamo = new DynamoDBClient({})

export const definition = {
  name: 'delete_search_profile',
  description: 'Permanently delete a saved search profile by profileId. Use this when the user asks to remove, delete, or cancel a saved search.',
  input_schema: {
    type: 'object',
    properties: {
      profileId: {
        type: 'string',
        description: 'UUID of the search profile to delete.',
      },
    },
    required: ['profileId'],
  },
}

interface DeleteInput {
  profileId: string
}

export async function execute(userId: string, input: DeleteInput): Promise<{ message: string } | { error: string }> {
  const result = await dynamo.send(
    new GetItemCommand({
      TableName: process.env.USER_PROFILE_TABLE!,
      Key: { userId: { S: userId } },
    }),
  )

  if (!result.Item) return { error: 'User profile not found.' }

  const userProfile = unmarshall(result.Item) as UserProfile
  const before = userProfile.searchProfiles.length
  userProfile.searchProfiles = userProfile.searchProfiles.filter((p) => p.profileId !== input.profileId)

  if (userProfile.searchProfiles.length === before) {
    return { error: `Search profile ${input.profileId} not found.` }
  }

  userProfile.updatedAt = new Date().toISOString()

  await dynamo.send(
    new PutItemCommand({
      TableName: process.env.USER_PROFILE_TABLE!,
      Item: marshall(userProfile, { removeUndefinedValues: true }),
    }),
  )

  return { message: 'Search profile deleted successfully.' }
}
