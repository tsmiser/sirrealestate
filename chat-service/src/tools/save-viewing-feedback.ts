import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import type { ViewingFeedback } from '../types'

const dynamo = new DynamoDBClient({})

export const definition = {
  name: 'save_viewing_feedback',
  description:
    'Save feedback from the user about a property viewing. Call this after the user shares their thoughts on a viewing — their rating, any notes, and whether they\'d consider making an offer.',
  inputSchema: {
    json: {
      type: 'object',
      properties: {
        viewingId: {
          type: 'string',
          description: 'The viewing ID to save feedback for.',
        },
        rating: {
          type: 'number',
          description: 'Rating from 1 (poor) to 5 (excellent).',
        },
        notes: {
          type: 'string',
          description: 'The user\'s notes about the property (e.g. what they liked/disliked).',
        },
        wouldMakeOffer: {
          type: 'boolean',
          description: 'Whether the user is interested in making an offer on this property.',
        },
      },
      required: ['viewingId', 'rating', 'notes', 'wouldMakeOffer'],
    },
  },
}

interface SaveFeedbackInput {
  viewingId: string
  rating: number
  notes: string
  wouldMakeOffer: boolean
}

export async function execute(userId: string, input: SaveFeedbackInput): Promise<{ message: string }> {
  const now = new Date().toISOString()

  const feedback: ViewingFeedback = {
    rating: input.rating,
    notes: input.notes,
    wouldMakeOffer: input.wouldMakeOffer,
  }

  await dynamo.send(
    new UpdateItemCommand({
      TableName: process.env.VIEWINGS_TABLE!,
      Key: marshall({ userId, viewingId: input.viewingId }),
      UpdateExpression:
        'SET feedback = :feedback, feedbackCollectedAt = :now, #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':feedback': { M: marshall(feedback) },
        ':now': { S: now },
        ':status': { S: 'completed' },
      },
    }),
  )

  return {
    message: `Feedback saved: ${input.rating}/5 stars. ${input.wouldMakeOffer ? 'Marked as interested in making an offer.' : 'Not pursuing an offer at this time.'}`,
  }
}
