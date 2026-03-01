export function buildListingUrl(
  address: string,
  preference?: 'zillow' | 'redfin' | 'realtor',
): string {
  switch (preference) {
    case 'redfin':
      return `https://www.redfin.com/search?location=${encodeURIComponent(address)}`
    case 'realtor':
      return `https://www.realtor.com/realestateandhomes-search/search?query=${encodeURIComponent(address)}`
    default:
      return `https://www.zillow.com/homes/${address.replace(/ /g, '-')}_rb/`
  }
}
