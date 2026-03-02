export interface ListingCriteria {
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  propertyType?: string
  city?: string
  state?: string
  zipCodes?: string[]
}

export interface Listing {
  listingId: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft?: number
  agentEmail?: string
  agentName?: string
  listingUrl?: string
  latitude?: number
  longitude?: number
  rawData: unknown
}

export interface MlsProvider {
  searchListings(criteria: ListingCriteria): Promise<Listing[]>
}
