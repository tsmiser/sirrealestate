import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import type { UserProfile } from '../types'

const dynamo = new DynamoDBClient({})

export const definition = {
  name: 'update_user_details',
  description:
    "Update the user's personal details such as name, phone number, buyer status, or pre-approval information. Call this when the user shares their name, phone, or buying situation. Do not ask for the user's email — it is already known.",
  input_schema: {
    type: 'object',
    properties: {
      firstName: {
        type: 'string',
        description: "The user's first name.",
      },
      lastName: {
        type: 'string',
        description: "The user's last name.",
      },
      phone: {
        type: 'string',
        description: "The user's phone number.",
      },
      buyerStatus: {
        type: 'string',
        enum: ['browsing', 'actively_looking', 'ready_to_offer'],
        description: 'How actively the user is looking to buy.',
      },
      preApproved: {
        type: 'boolean',
        description: 'Whether the user has mortgage pre-approval.',
      },
      preApprovalAmount: {
        type: 'number',
        description: 'The pre-approved mortgage amount in dollars.',
      },
      preferredContactMethod: {
        type: 'string',
        enum: ['email', 'phone'],
        description: "The user's preferred contact method.",
      },
      firstTimeHomeBuyer: {
        type: 'boolean',
        description: 'Whether the user is a first-time home buyer.',
      },
      currentCity: {
        type: 'string',
        description: "The city where the user currently lives.",
      },
      currentState: {
        type: 'string',
        description: "The state where the user currently lives (2-letter abbreviation).",
      },
      desiredCity: {
        type: 'string',
        description: "The city where the user wants to buy.",
      },
      desiredState: {
        type: 'string',
        description: "The state where the user wants to buy (2-letter abbreviation).",
      },
      listingViewingPreference: {
        type: 'string',
        enum: ['zillow', 'redfin', 'realtor'],
        description: "The user's preferred platform for viewing listings online.",
      },
    },
    required: [],
  },
}

type UpdateInput = Pick<
  UserProfile,
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'buyerStatus'
  | 'preApproved'
  | 'preApprovalAmount'
  | 'preferredContactMethod'
  | 'firstTimeHomeBuyer'
  | 'currentCity'
  | 'currentState'
  | 'desiredCity'
  | 'desiredState'
  | 'listingViewingPreference'
>

export async function execute(userId: string, input: UpdateInput): Promise<{ message: string }> {
  const now = new Date().toISOString()

  const updateFields: Record<string, unknown> = { updatedAt: now }
  if (input.firstName !== undefined) updateFields.firstName = input.firstName
  if (input.lastName !== undefined) updateFields.lastName = input.lastName
  if (input.phone !== undefined) updateFields.phone = input.phone
  if (input.buyerStatus !== undefined) updateFields.buyerStatus = input.buyerStatus
  if (input.preApproved !== undefined) updateFields.preApproved = input.preApproved
  if (input.preApprovalAmount !== undefined) updateFields.preApprovalAmount = input.preApprovalAmount
  if (input.preferredContactMethod !== undefined) updateFields.preferredContactMethod = input.preferredContactMethod
  if (input.firstTimeHomeBuyer !== undefined) updateFields.firstTimeHomeBuyer = input.firstTimeHomeBuyer
  if (input.currentCity !== undefined) updateFields.currentCity = input.currentCity
  if (input.currentState !== undefined) updateFields.currentState = input.currentState
  if (input.desiredCity !== undefined) updateFields.desiredCity = input.desiredCity
  if (input.desiredState !== undefined) updateFields.desiredState = input.desiredState
  if (input.listingViewingPreference !== undefined) updateFields.listingViewingPreference = input.listingViewingPreference

  const setExpressions = Object.keys(updateFields).map((k) => `#${k} = :${k}`)
  const expressionAttributeNames = Object.fromEntries(Object.keys(updateFields).map((k) => [`#${k}`, k]))
  const expressionAttributeValues = Object.fromEntries(
    Object.entries(updateFields).map(([k, v]) => [`:${k}`, marshall({ val: v }).val]),
  )

  await dynamo.send(
    new UpdateItemCommand({
      TableName: process.env.USER_PROFILE_TABLE!,
      Key: { userId: { S: userId } },
      UpdateExpression: `SET ${setExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    }),
  )

  const updated = Object.keys(input).filter((k) => input[k as keyof UpdateInput] !== undefined)
  return { message: `User details updated: ${updated.join(', ')}.` }
}
