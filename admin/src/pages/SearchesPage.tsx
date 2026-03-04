import { useEffect, useState } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { api } from '@/services/api'

type SearchRow = {
  profileIdListingId: string
  userId: string
  address?: string
  price?: number
  beds?: number
  baths?: number
  matchedAt?: string
  [key: string]: unknown
}

export default function SearchesPage() {
  const [rows, setRows] = useState<SearchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.searches.list()
      .then((r) => setRows(r.searches as SearchRow[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const columns: GridColDef<SearchRow>[] = [
    { field: 'userId', headerName: 'User ID', width: 220 },
    { field: 'address', headerName: 'Address', flex: 2, minWidth: 200 },
    { field: 'price', headerName: 'Price', width: 120, valueFormatter: (v) => v ? `$${Number(v).toLocaleString()}` : '—' },
    { field: 'beds', headerName: 'Beds', width: 80 },
    { field: 'baths', headerName: 'Baths', width: 80 },
    {
      field: 'matchedAt',
      headerName: 'Matched',
      flex: 1,
      minWidth: 160,
      valueFormatter: (v) => v ? new Date(v as string).toLocaleDateString() : '—',
    },
  ]

  if (error) return <Typography color="error">{error}</Typography>

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h5" className="font-heading font-bold">Searches</Typography>
      {loading && <CircularProgress />}
      {!loading && (
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.profileIdListingId}
          autoHeight
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick
        />
      )}
    </Box>
  )
}
