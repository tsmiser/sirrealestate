import { DynamoDBClient, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { UserProfile, SearchResult, Viewing } from './types'

const dynamo = new DynamoDBClient({})

function json(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

async function getProfile(userId: string): Promise<APIGatewayProxyResultV2> {
  const result = await dynamo.send(
    new GetItemCommand({
      TableName: process.env.USER_PROFILE_TABLE!,
      Key: { userId: { S: userId } },
    }),
  )
  if (!result.Item) {
    return json(200, { userId, searchProfiles: [], createdAt: null })
  }
  return json(200, unmarshall(result.Item) as UserProfile)
}

async function getSearchResults(userId: string): Promise<APIGatewayProxyResultV2> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: process.env.SEARCH_RESULTS_TABLE!,
      IndexName: 'userId-matchedAt-index',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': { S: userId } },
      ScanIndexForward: false,  // descending by matchedAt
      Limit: 100,
    }),
  )

  const results = (result.Items ?? []).map((item: Record<string, AttributeValue>) => unmarshall(item) as SearchResult)

  // Group by profileId
  const grouped: Record<string, SearchResult[]> = {}
  for (const r of results) {
    if (!grouped[r.profileId]) grouped[r.profileId] = []
    grouped[r.profileId].push(r)
  }

  return json(200, { results, grouped })
}

async function getViewings(userId: string): Promise<APIGatewayProxyResultV2> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: process.env.VIEWINGS_TABLE!,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': { S: userId } },
      ScanIndexForward: false,
    }),
  )

  const viewings = (result.Items ?? []).map((item: Record<string, AttributeValue>) => unmarshall(item) as Viewing)
  viewings.sort((a: Viewing, b: Viewing) => b.requestedAt.localeCompare(a.requestedAt))

  return json(200, { viewings })
}

export async function handler(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> {
  const userId = event.requestContext.authorizer.jwt.claims['sub'] as string
  const path = event.rawPath

  try {
    if (path === '/profile') return getProfile(userId)
    if (path === '/search-results') return getSearchResults(userId)
    if (path === '/viewings') return getViewings(userId)
    return json(404, { error: 'Not found' })
  } catch (err) {
    console.error('Data handler error', err)
    return json(500, { error: 'Internal server error' })
  }
}
