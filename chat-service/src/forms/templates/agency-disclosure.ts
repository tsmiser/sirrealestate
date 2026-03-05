import PDFDocument from 'pdfkit'

export type BrokerageRelationshipType = 'transaction_broker' | 'buyer_agent'

export interface AgencyDisclosureData {
  generatedDate: string
  /** Buyer(s) on the offer. */
  buyers: Array<{
    fullLegalName: string
    isPrimaryBuyer: boolean
  }>
  brokerageName: string
  agentName: string
  /**
   * Colorado default is 'transaction_broker'. Choose 'buyer_agent' when the
   * brokerage has agreed to represent the buyer exclusively.
   */
  relationshipType: BrokerageRelationshipType
}

const BLUE = '#00BFEB'
const DARK = '#1a2233'
const MUTED = '#64748b'
const RULE = '#e2e8f0'

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function rule(doc: PDFKit.PDFDocument, y?: number): void {
  const yPos = y ?? doc.y
  doc.moveTo(50, yPos).lineTo(doc.page.width - 50, yPos).lineWidth(0.5).strokeColor(RULE).stroke()
}

function sectionHeader(doc: PDFKit.PDFDocument, title: string): void {
  doc.moveDown(0.6)
  rule(doc)
  doc.moveDown(0.4)
  doc.fontSize(9).font('Helvetica-Bold').fillColor(BLUE).text(title.toUpperCase())
  doc.moveDown(0.3)
  doc.font('Helvetica').fillColor(DARK)
}

function row(doc: PDFKit.PDFDocument, label: string, value: string): void {
  const labelWidth = 160
  const x = 50
  const y = doc.y
  doc.fontSize(9).font('Helvetica-Bold').fillColor(MUTED).text(label, x, y, { width: labelWidth, lineBreak: false })
  doc.fontSize(9).font('Helvetica').fillColor(DARK).text(value, x + labelWidth, y, { width: doc.page.width - 50 - x - labelWidth })
  doc.moveDown(0.25)
}

function bullet(doc: PDFKit.PDFDocument, text: string): void {
  doc.fontSize(9).font('Helvetica').fillColor(DARK)
    .text(`• ${text}`, 60, doc.y, { width: doc.page.width - 110 })
  doc.moveDown(0.25)
}

const TRANSACTION_BROKER_DUTIES = [
  'Perform the terms of any written or oral agreement made with the buyer.',
  'Present all offers and counteroffers in a timely manner unless directed otherwise.',
  'Disclose to the buyer adverse material facts actually known by the broker.',
  'Advise the buyer to obtain expert advice on matters beyond the broker\'s expertise.',
  'Account for in a timely manner all money and property received.',
  'Assist the buyer to comply with the terms and conditions of any contract.',
  'Disclose to any prospective seller all adverse material facts known by the broker, including the buyer\'s financial ability to perform.',
]

const BUYER_AGENT_DUTIES = [
  'Promote the interests of the buyer with the utmost good faith, loyalty, and fidelity.',
  'Seek a price and terms acceptable to the buyer.',
  'Present all offers and counteroffers in a timely manner unless directed otherwise.',
  'Disclose to the buyer adverse material facts actually known by the broker.',
  'Counsel the buyer as to any known material benefits or risks of the transaction.',
  'Advise the buyer to obtain expert advice on matters beyond the broker\'s expertise.',
  'Account for in a timely manner all money and property received.',
  'Assist the buyer to comply with the terms and conditions of any contract.',
]

export function generateAgencyDisclosure(data: AgencyDisclosureData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 50, info: { Title: 'Definition of Brokerage Relationships' } })
    const buffers: Buffer[] = []
    doc.on('data', (b: Buffer) => buffers.push(b))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    // ── Header ──────────────────────────────────────────────────────────────
    doc.fontSize(14).font('Helvetica-Bold').fillColor(DARK)
      .text('DEFINITION OF BROKERAGE RELATIONSHIPS', { align: 'center' })
    doc.fontSize(10).font('Helvetica').fillColor(MUTED)
      .text('Colorado — Generic Form (Not a CREC-Approved CB100)', { align: 'center' })
    doc.moveDown(0.3)
    doc.fontSize(9).fillColor(MUTED)
      .text(`Generated: ${fmtDate(data.generatedDate)}`, { align: 'right' })

    // ── Parties ───────────────────────────────────────────────────────────────
    sectionHeader(doc, '1. Parties')
    row(doc, 'Brokerage', data.brokerageName)
    row(doc, 'Agent / Licensee', data.agentName)
    for (const buyer of data.buyers) {
      row(doc, buyer.isPrimaryBuyer ? 'Buyer' : 'Co-Buyer', buyer.fullLegalName)
    }

    // ── Relationship Type ──────────────────────────────────────────────────
    sectionHeader(doc, '2. Brokerage Relationship')
    const isTB = data.relationshipType === 'transaction_broker'
    doc.fontSize(9).font('Helvetica').fillColor(DARK)
    doc.text(`${isTB ? '☑' : '☐'}  Transaction Broker`, 60)
    doc.moveDown(0.15)
    doc.text(`${!isTB ? '☑' : '☐'}  Buyer's Agent`, 60)
    doc.moveDown(0.4)

    if (isTB) {
      doc.fontSize(9).font('Helvetica').fillColor(DARK)
        .text(
          'As a Transaction Broker, the brokerage assists the buyer without acting exclusively in the ' +
          'buyer\'s interest. The brokerage owes duties to both parties and shall not advocate for ' +
          'either party to the detriment of the other.',
          50, doc.y, { width: doc.page.width - 100 },
        )
    } else {
      doc.fontSize(9).font('Helvetica').fillColor(DARK)
        .text(
          'As a Buyer\'s Agent, the brokerage represents the buyer exclusively and owes fiduciary ' +
          'duties of loyalty, confidentiality, and full disclosure to the buyer.',
          50, doc.y, { width: doc.page.width - 100 },
        )
    }

    // ── Duties ────────────────────────────────────────────────────────────────
    sectionHeader(doc, '3. Duties of the Brokerage')
    const duties = isTB ? TRANSACTION_BROKER_DUTIES : BUYER_AGENT_DUTIES
    for (const duty of duties) {
      bullet(doc, duty)
    }

    // ── Limitations ────────────────────────────────────────────────────────────
    sectionHeader(doc, '4. Limitations on Duties')
    doc.fontSize(9).font('Helvetica').fillColor(DARK)
      .text(
        'The brokerage shall not disclose: (a) that the buyer is willing to pay more than the ' +
        'offering price; (b) that the seller is willing to accept less than the listing price; ' +
        '(c) the motivating factors of either party; or (d) any information that a party ' +
        'designates as confidential, unless disclosure is required by law.',
        50, doc.y, { width: doc.page.width - 100 },
      )

    // ── Buyer Acknowledgment ──────────────────────────────────────────────────
    sectionHeader(doc, '5. Buyer Acknowledgment')
    doc.moveDown(0.3)
    doc.fontSize(9).font('Helvetica').fillColor(DARK)
      .text(
        'The buyer acknowledges receipt of this disclosure and understands the nature of the ' +
        'brokerage relationship described herein.',
        50, doc.y, { width: doc.page.width - 100 },
      )
    doc.moveDown(0.8)

    for (const buyer of data.buyers) {
      const y = doc.y
      doc.moveTo(60, y + 30).lineTo(280, y + 30).lineWidth(0.5).strokeColor(DARK).stroke()
      doc.moveTo(310, y + 30).lineTo(530, y + 30).lineWidth(0.5).strokeColor(DARK).stroke()
      doc.moveDown(0.2)
      doc.fontSize(8).fillColor(MUTED)
        .text(buyer.fullLegalName, 60, doc.y, { width: 220, lineBreak: false })
      doc.text('Date', 310, doc.y, { width: 220 })
      doc.moveDown(1)
    }

    // ── Agent / Brokerage Acknowledgment ─────────────────────────────────────
    sectionHeader(doc, '6. Agent / Brokerage Acknowledgment')
    doc.moveDown(0.3)
    doc.fontSize(9).font('Helvetica').fillColor(DARK)
      .text(
        'The agent acknowledges that this disclosure was provided to the buyer before any offer ' +
        'was prepared or presented.',
        50, doc.y, { width: doc.page.width - 100 },
      )
    doc.moveDown(0.8)

    const agentY = doc.y
    doc.moveTo(60, agentY + 30).lineTo(280, agentY + 30).lineWidth(0.5).strokeColor(DARK).stroke()
    doc.moveTo(310, agentY + 30).lineTo(530, agentY + 30).lineWidth(0.5).strokeColor(DARK).stroke()
    doc.moveDown(0.2)
    doc.fontSize(8).fillColor(MUTED)
      .text(`${data.agentName} — ${data.brokerageName}`, 60, doc.y, { width: 220, lineBreak: false })
    doc.text('Date', 310, doc.y, { width: 220 })
    doc.moveDown(1)

    // ── Disclaimer ────────────────────────────────────────────────────────────
    doc.moveDown(1)
    rule(doc)
    doc.moveDown(0.4)
    doc.fontSize(7).fillColor(MUTED)
      .text(
        'IMPORTANT: This is a generic brokerage relationship disclosure generated for informational ' +
        'purposes only. It is not a CREC-approved form (CB100). For binding real estate transactions ' +
        'in Colorado, parties must use the CREC-approved Definition of Brokerage Relationships (CB100) ' +
        'or equivalent commission-approved form, and seek qualified legal counsel.',
        { lineGap: 2 },
      )

    doc.end()
  })
}
