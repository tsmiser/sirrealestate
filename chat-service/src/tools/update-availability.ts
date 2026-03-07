import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { randomUUID } from 'crypto'
import type { AvailabilityWindow } from '../types'

const dynamo = new DynamoDBClient({})

export const definition = {
  name: 'update_availability',
  description:
    "Save or replace the user's general viewing availability windows — the date/time ranges when they are available to visit properties. These windows are reused across all viewing requests so the user doesn't need to re-enter them each time. Calling this replaces all previous windows.",
  input_schema: {
    type: 'object',
    properties: {
      windows: {
        type: 'array',
        description: 'List of availability windows. Replaces any previously saved windows.',
        items: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              description: 'Window start as ISO 8601 datetime, e.g. "2026-03-15T10:00:00"',
            },
            end: {
              type: 'string',
              description: 'Window end as ISO 8601 datetime, e.g. "2026-03-15T12:00:00"',
            },
          },
          required: ['start', 'end'],
        },
      },
    },
    required: ['windows'],
  },
}

interface UpdateAvailabilityInput {
  windows: { start: string; end: string }[]
}

export async function execute(
  userId: string,
  input: UpdateAvailabilityInput,
): Promise<{ ok: boolean; windowCount: number }> {
  const windows: AvailabilityWindow[] = input.windows.map((w) => ({
    windowId: randomUUID(),
    start: w.start,
    end: w.end,
  }))

  const now = new Date().toISOString()

  await dynamo.send(
    new UpdateItemCommand({
      TableName: process.env.USER_PROFILE_TABLE!,
      Key: { userId: { S: userId } },
      UpdateExpression: 'SET #availability = :av, updatedAt = :ts',
      ExpressionAttributeNames: { '#availability': 'availability' },
      ExpressionAttributeValues: {
        ':av': marshall({ v: windows }).v,
        ':ts': { S: now },
      },
    }),
  )

  return { ok: true, windowCount: windows.length }
}
