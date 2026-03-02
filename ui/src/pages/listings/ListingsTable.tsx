import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import type { SearchResult } from '@/hooks/useSearchResults'

interface ListingsTableProps {
  results: SearchResult[]
  onListingClick: (result: SearchResult) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const columns: GridColDef<any>[] = [
  {
    field: 'address',
    headerName: 'Address',
    flex: 2,
    minWidth: 180,
    valueGetter: (_value, row) => (row as SearchResult).listingData.address,
  },
  {
    field: 'price',
    headerName: 'Price',
    flex: 1,
    minWidth: 100,
    type: 'number',
    valueGetter: (_value, row) => (row as SearchResult).listingData.price,
    valueFormatter: (value: number) => `$${value.toLocaleString()}`,
  },
  {
    field: 'bedrooms',
    headerName: 'Beds',
    width: 70,
    type: 'number',
    valueGetter: (_value, row) => (row as SearchResult).listingData.bedrooms,
  },
  {
    field: 'bathrooms',
    headerName: 'Baths',
    width: 70,
    type: 'number',
    valueGetter: (_value, row) => (row as SearchResult).listingData.bathrooms,
  },
  {
    field: 'sqft',
    headerName: 'Sqft',
    width: 90,
    type: 'number',
    valueGetter: (_value, row) => (row as SearchResult).listingData.sqft ?? null,
    valueFormatter: (value: number | null) =>
      value != null ? value.toLocaleString() : '—',
  },
  {
    field: 'matchedAt',
    headerName: 'Matched',
    width: 110,
    valueGetter: (_value, row) => (row as SearchResult).matchedAt,
    valueFormatter: (value: string) =>
      value ? new Date(value).toLocaleDateString() : '',
  },
]

export default function ListingsTable({ results, onListingClick }: ListingsTableProps) {
  const rows = results.map((r) => ({ id: r.profileIdListingId, ...r }))

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      pageSizeOptions={[25, 50, 100]}
      initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
      onRowClick={(params) => onListingClick(params.row as SearchResult)}
      sx={{ cursor: 'pointer', border: 'none' }}
      disableRowSelectionOnClick
    />
  )
}
