import { DynamoDBClient, GetItemCommand, QueryCommand, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import type { AttributeValue } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
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

async function recordViewingResponse(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { viewingId, slot } = event.queryStringParameters ?? {}
  if (!viewingId || slot === undefined) {
    return json(400, { error: 'Missing viewingId or slot' })
  }

  // Scan for the viewing by viewingId (table is small; no GSI needed)
  const scanResult = await dynamo.send(
    new ScanCommand({
      TableName: process.env.VIEWINGS_TABLE!,
      FilterExpression: 'viewingId = :vid',
      ExpressionAttributeValues: { ':vid': { S: viewingId } },
    }),
  )

  const item = scanResult.Items?.[0]
  if (!item) return json(404, { error: 'Viewing not found' })

  const viewing = unmarshall(item) as Viewing
  const now = new Date().toISOString()

  const isNone = slot === 'none'
  const selectedSlot = isNone ? 'none' : (viewing.availabilitySlots?.[parseInt(slot)] ?? 'none')
  const newStatus = isNone ? 'requested' : 'confirmed'

  const updateExpr = isNone
    ? 'SET agentSelectedSlot = :slot, agentRespondedAt = :now, #s = :status'
    : 'SET agentSelectedSlot = :slot, agentRespondedAt = :now, #s = :status, proposedDateTime = :dt'

  await dynamo.send(
    new UpdateItemCommand({
      TableName: process.env.VIEWINGS_TABLE!,
      Key: marshall({ userId: viewing.userId, viewingId: viewing.viewingId }),
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':slot': { S: selectedSlot },
        ':now': { S: now },
        ':status': { S: newStatus },
        ...(!isNone ? { ':dt': { S: selectedSlot } } : {}),
      },
    }),
  )

  return json(200, { ok: true })
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
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const path = event.rawPath

  try {
    // Unauthenticated routes
    if (path === '/viewing-response') return recordViewingResponse(event)

    // Authenticated routes — extract userId from JWT claims
    const claims = (event.requestContext as unknown as {
      authorizer?: { jwt?: { claims?: Record<string, unknown> } }
    }).authorizer?.jwt?.claims
    const userId = claims?.['sub'] as string | undefined
    if (!userId) return json(401, { error: 'Unauthorized' })

    if (path === '/profile') return getProfile(userId)
    if (path === '/search-results') return getSearchResults(userId)
    if (path === '/viewings') return getViewings(userId)
    return json(404, { error: 'Not found' })
  } catch (err) {
    console.error('Data handler error', err)
    return json(500, { error: 'Internal server error' })
  }
}
