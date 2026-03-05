import { Box } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import type { SearchResult } from '@/hooks/useSearchResults'
import { streetViewUrl } from '@/lib/streetview'

interface ListingsTableProps {
  results: SearchResult[]
  onListingClick: (result: SearchResult) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const columns: GridColDef<any>[] = [
  {
    field: 'photo',
    headerName: '',
    width: 96,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: (params) => {
      const result = params.row as SearchResult
      const { latitude, longitude } = result.listingData
      const url = latitude != null && longitude != null
        ? streetViewUrl(latitude, longitude, 160, 100)
        : null
      return (
        <Box sx={{ width: 80, height: 54, borderRadius: 1, overflow: 'hidden', bgcolor: 'grey.100', flexShrink: 0 }}>
          {url && (
            <img
              src={url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          )}
        </Box>
      )
    },
  },
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
      rowHeight={66}
      pageSizeOptions={[25, 50, 100]}
      initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
      onRowClick={(params) => onListingClick(params.row as SearchResult)}
      sx={{ cursor: 'pointer', border: 'none' }}
      disableRowSelectionOnClick
    />
  )
}
