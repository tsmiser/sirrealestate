import type { MlsProvider, ListingCriteria, Listing } from './mls-provider'

interface RentcastProperty {
  id: string
  formattedAddress: string
  price: number
  bedrooms: number
  bathrooms: number
  squareFootage?: number
  listingType?: string
  latitude?: number
  longitude?: number
  // Rentcast does not always expose agent contact in the free tier
  [key: string]: unknown
}

export class RentcastProvider implements MlsProvider {
  private readonly apiKey: string
  private readonly baseUrl = 'https://api.rentcast.io/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchListings(criteria: ListingCriteria): Promise<Listing[]> {
    const params = new URLSearchParams()

    if (criteria.city) params.set('city', criteria.city)
    if (criteria.state) params.set('state', criteria.state)
    if (criteria.zipCodes?.length) params.set('zipCode', criteria.zipCodes[0])
    if (criteria.bedrooms != null) params.set('bedrooms', String(criteria.bedrooms))
    if (criteria.bathrooms != null) params.set('bathrooms', String(criteria.bathrooms))
    if (criteria.minPrice != null) params.set('priceMin', String(criteria.minPrice))
    if (criteria.maxPrice != null) params.set('priceMax', String(criteria.maxPrice))
    if (criteria.propertyType) params.set('propertyType', criteria.propertyType)
    params.set('limit', '50')
    params.set('status', 'Active')

    const url = `${this.baseUrl}/listings/sale?${params.toString()}`
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': this.apiKey,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Rentcast API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as RentcastProperty[]

    return data.map((p): Listing => ({
      listingId: p.id,
      address: p.formattedAddress,
      price: p.price,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      sqft: p.squareFootage,
      latitude: typeof p.latitude === 'number' ? p.latitude : undefined,
      longitude: typeof p.longitude === 'number' ? p.longitude : undefined,
      rawData: p,
    }))
  }
}
