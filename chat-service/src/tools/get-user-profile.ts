import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import type { UserProfile } from '../types'

const dynamo = new DynamoDBClient({})

export const definition = {
  name: 'get_user_profile',
  description:
    'Retrieve the current user\'s profile including all search profiles, criteria, and monitoring settings. Call this at the start of a conversation to understand what the user has already set up.',
  inputSchema: {
    json: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
}

export async function execute(userId: string): Promise<UserProfile | null> {
  const result = await dynamo.send(
    new GetItemCommand({
      TableName: process.env.USER_PROFILE_TABLE!,
      Key: { userId: { S: userId } },
    }),
  )
  if (!result.Item) return null
  return unmarshall(result.Item) as UserProfile
}
