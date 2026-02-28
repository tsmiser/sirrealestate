import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import type { SearchResult } from '../types'

const dynamo = new DynamoDBClient({})

export const definition = {
  name: 'get_search_results',
  description:
    'Retrieve recent property matches for the user from automated daily searches. Use this when the user asks about listings found for them, or to show what properties match their saved search profiles.',
  input_schema: {
    type: 'object',
    properties: {
      profileId: {
        type: 'string',
        description: 'Filter results to a specific search profile. Omit to get results across all profiles.',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default 10, max 50).',
      },
    },
    required: [],
  },
}

interface GetSearchResultsInput {
  profileId?: string
  limit?: number
}

export async function execute(
  userId: string,
  input: GetSearchResultsInput,
): Promise<{ results: SearchResult[]; count: number }> {
  const limit = Math.min(input.limit ?? 10, 50)

  const result = await dynamo.send(
    new QueryCommand({
      TableName: process.env.SEARCH_RESULTS_TABLE!,
      IndexName: 'userId-matchedAt-index',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': { S: userId } },
      ScanIndexForward: false,  // descending by matchedAt
      Limit: limit,
    }),
  )

  let results = (result.Items ?? []).map((item: Record<string, AttributeValue>) => unmarshall(item) as SearchResult)

  if (input.profileId) {
    results = results.filter((r: SearchResult) => r.profileId === input.profileId)
  }

  return { results, count: results.length }
}
