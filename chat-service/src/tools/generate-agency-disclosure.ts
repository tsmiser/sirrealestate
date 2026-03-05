import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import type { Offer, UserDocument } from '../types'
import { generateAgencyDisclosure, type BrokerageRelationshipType } from '../forms/templates/agency-disclosure'
import { DropboxSignProvider } from '../forms/signing-provider'

const dynamo = new DynamoDBClient({})
const s3 = new S3Client({})
const signer = new DropboxSignProvider()

export const definition = {
  name: 'generate_agency_disclosure',
  description:
    'Generate a brokerage relationship disclosure (equivalent to Colorado CB100) and send it ' +
    'to the buyer(s) — and optionally the agent — for e-signature via Dropbox Sign. ' +
    'In Colorado this must be signed before an offer can be submitted. ' +
    'Ask the buyer for the brokerage name and agent name if not already known. ' +
    'The relationship type defaults to Transaction Broker (Colorado default).',
  input_schema: {
    type: 'object',
    properties: {
      offerId: {
        type: 'string',
        description: 'The offer ID to generate the agency disclosure for.',
      },
      brokerageName: {
        type: 'string',
        description: 'Full name of the brokerage representing the buyer (e.g. "SirRealtor Inc.").',
      },
      agentName: {
        type: 'string',
        description: 'Full name of the licensed agent or AI-assisted representative.',
      },
      agentEmail: {
        type: 'string',
        description: 'Email address of the agent. If provided, the agent is added as a co-signer in Dropbox Sign.',
      },
      relationshipType: {
        type: 'string',
        enum: ['transaction_broker', 'buyer_agent'],
        description: 'Brokerage relationship type. Defaults to "transaction_broker" (Colorado statutory default).',
      },
    },
    required: ['offerId', 'brokerageName', 'agentName'],
  },
}

export async function execute(
  userId: string,
  input: {
    offerId: string
    brokerageName: string
    agentName: string
    agentEmail?: string
    relationshipType?: BrokerageRelationshipType
  },
): Promise<{ documentId?: string; message: string }> {
  // Fetch offer
  const result = await dynamo.send(
    new GetItemCommand({
      TableName: process.env.OFFERS_TABLE!,
      Key: marshall({ userId, offerId: input.offerId }),
    }),
  )
  if (!result.Item) return { message: `Offer ${input.offerId} not found.` }
  const offer = unmarshall(result.Item) as Offer

  // Validate required fields
  const missing: string[] = []
  if (!offer.buyers?.length)                       missing.push('buyers')
  if (offer.buyers?.some((b) => !b.fullLegalName)) missing.push('buyer full legal name(s)')
  if (missing.length) {
    return { message: `Cannot generate agency disclosure. Missing: ${missing.join(', ')}. Use update_offer to complete these fields first.` }
  }

  // Build template data
  const data = {
    generatedDate: new Date().toISOString().split('T')[0],
    buyers: offer.buyers.map((b) => ({
      fullLegalName: b.fullLegalName,
      isPrimaryBuyer: b.isPrimaryBuyer,
    })),
    brokerageName: input.brokerageName,
    agentName: input.agentName,
    relationshipType: input.relationshipType ?? 'transaction_broker',
  }

  // Generate PDF
  const pdfBuffer = await generateAgencyDisclosure(data)

  // Upload to S3 and create Documents table entry
  const documentId = randomUUID()
  const fileName = `agency-disclosure-${offer.offerId}.pdf`
  const s3Key = `${userId}/${documentId}`

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.DOCUMENT_BUCKET_NAME!,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    }),
  )

  const now = new Date().toISOString()
  const doc: UserDocument = {
    userId,
    documentId,
    fileName,
    contentType: 'application/pdf',
    sizeBytes: pdfBuffer.length,
    s3Key,
    uploadedAt: now,
    documentType: 'agency_disclosure',
  }
  await dynamo.send(
    new PutItemCommand({
      TableName: process.env.DOCUMENTS_TABLE!,
      Item: marshall(doc),
    }),
  )

  // Build signer list — buyer(s) first, agent second if email provided
  const signers: Array<{ name: string; email: string }> = offer.buyers.map((b) => ({
    name: b.fullLegalName,
    email: b.email,
  }))
  if (input.agentEmail) {
    signers.push({ name: input.agentName, email: input.agentEmail })
  }

  const title = `Brokerage Relationship Disclosure — ${offer.listingAddress}`

  const { signatureRequestId } = await signer.createSignatureRequest({
    pdfBuffer,
    fileName,
    title,
    subject: title,
    message:
      'Please review and sign the brokerage relationship disclosure. ' +
      'This document must be signed before your offer can be submitted.',
    signers,
    metadata: { userId, offerId: offer.offerId, formType: 'agency_disclosure' },
  })

  // Update offer
  const updatedOffer: Offer = {
    ...offer,
    agencyDisclosureDocumentId: documentId,
    signingRequests: { ...offer.signingRequests, agency_disclosure: signatureRequestId },
    updatedAt: now,
  }
  await dynamo.send(
    new PutItemCommand({
      TableName: process.env.OFFERS_TABLE!,
      Item: marshall(updatedOffer, { removeUndefinedValues: true }),
    }),
  )

  const buyerEmails = offer.buyers.map((b) => b.email).join(', ')
  const agentNote = input.agentEmail
    ? ` The agent (${input.agentEmail}) has also been sent a signing request.`
    : ' No agent email was provided — the agent signature line remains blank for manual completion.'

  return {
    documentId,
    message:
      `Brokerage relationship disclosure generated and sent to ${buyerEmails} for signing via Dropbox Sign.` +
      agentNote,
  }
}
