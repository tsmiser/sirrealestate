import type { Listing, Viewing } from './types'

export function newListingMatchEmail(listing: Listing, chatUrl: string): { subject: string; html: string } {
  const subject = `New match: ${listing.address} — $${listing.price.toLocaleString()}`
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#1a56db">New Property Match Found</h2>
  <p>SirRealtor found a new listing that matches your search criteria:</p>
  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0">
    <h3 style="margin-top:0">${listing.address}</h3>
    <p><strong>Price:</strong> $${listing.price.toLocaleString()}</p>
    <p><strong>Bedrooms:</strong> ${listing.bedrooms} &nbsp; <strong>Bathrooms:</strong> ${listing.bathrooms}</p>
    ${listing.sqft ? `<p><strong>Size:</strong> ${listing.sqft.toLocaleString()} sqft</p>` : ''}
    ${listing.listingUrl ? `<p><a href="${listing.listingUrl}" style="color:#1a56db">View Listing →</a></p>` : ''}
  </div>
  <a href="${chatUrl}" style="background:#1a56db;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
    Chat with SirRealtor →
  </a>
  <p style="color:#6b7280;font-size:12px;margin-top:24px">You're receiving this because you enabled monitoring for this search. Reply to opt out.</p>
</body>
</html>`
  return { subject, html }
}

export function viewingRequestToAgentEmail(
  viewing: Viewing,
  buyerEmail: string,
  buyerName: string,
  availabilitySlots: string[],
): { subject: string; html: string } {
  const baseUrl = 'https://app.sirrealtor.com/viewing-response'

  const slotButtons = availabilitySlots
    .map((slot, i) => {
      const url = `${baseUrl}?viewingId=${encodeURIComponent(viewing.viewingId)}&slot=${i}`
      const label = new Date(slot).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
      })
      return `<a href="${url}" style="display:block;background:#1a56db;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;margin-bottom:10px;font-size:15px">${label}</a>`
    })
    .join('\n  ')

  const noneUrl = `${baseUrl}?viewingId=${encodeURIComponent(viewing.viewingId)}&slot=none`

  const subject = `Viewing Request: ${viewing.listingAddress}`
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2>Viewing Request via SirRealtor</h2>
  <p>A buyer has requested to view your listing. Please select a time that works:</p>
  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0">
    <p><strong>Property:</strong> ${viewing.listingAddress}</p>
    <p><strong>Buyer:</strong> ${buyerName} &lt;${buyerEmail}&gt;</p>
  </div>
  <p><strong>Available times — click to confirm:</strong></p>
  ${slotButtons}
  <a href="${noneUrl}" style="display:block;background:#f3f4f6;color:#374151;padding:12px 20px;border-radius:6px;text-decoration:none;margin-bottom:10px;font-size:15px;border:1px solid #d1d5db">None of these times work</a>
  <p style="color:#6b7280;font-size:12px;margin-top:24px">Sent via SirRealtor (sirrealtor.com). Clicking a time confirms it directly — no login required.</p>
</body>
</html>`
  return { subject, html }
}

export function viewingConfirmationToBuyerEmail(
  viewing: Viewing,
  chatUrl: string,
): { subject: string; html: string } {
  const subject = `Viewing Requested: ${viewing.listingAddress}`
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#1a56db">Viewing Request Sent</h2>
  <p>Your viewing request has been sent to the seller's agent!</p>
  <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0">
    <p><strong>Property:</strong> ${viewing.listingAddress}</p>
    ${viewing.proposedDateTime ? `<p><strong>Proposed Time:</strong> ${viewing.proposedDateTime}</p>` : ''}
    ${viewing.agentName ? `<p><strong>Agent:</strong> ${viewing.agentName}</p>` : ''}
    <p><strong>Status:</strong> Awaiting confirmation</p>
  </div>
  <p>We'll follow up once the agent responds. You can also check your viewing status in chat.</p>
  <a href="${chatUrl}" style="background:#1a56db;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
    Open Chat →
  </a>
  <p style="color:#6b7280;font-size:12px;margin-top:24px">Sent via SirRealtor (sirrealtor.com)</p>
</body>
</html>`
  return { subject, html }
}

export function viewingFeedbackRequestEmail(
  viewing: Viewing,
  chatUrl: string,
): { subject: string; html: string } {
  const subject = `How was your viewing at ${viewing.listingAddress}?`
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#1a56db">How did the viewing go?</h2>
  <p>You recently viewed <strong>${viewing.listingAddress}</strong>. We'd love to know what you thought!</p>
  <p>Click below to share your feedback with SirRealtor and continue your search.</p>
  <a href="${chatUrl}" style="background:#1a56db;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
    Share Feedback →
  </a>
  <p style="color:#6b7280;font-size:12px;margin-top:24px">Sent via SirRealtor (sirrealtor.com)</p>
</body>
</html>`
  return { subject, html }
}
