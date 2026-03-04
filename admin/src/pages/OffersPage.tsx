import { useEffect, useState } from 'react'
import { Box, Chip, CircularProgress, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { api } from '@/services/api'

type OfferRow = {
  offerId: string
  userId: string
  address?: string
  offerPrice?: number
  status?: string
  financingType?: string
  createdAt?: string
  [key: string]: unknown
}

export default function OffersPage() {
  const [rows, setRows] = useState<OfferRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.offers.list()
      .then((r) => setRows(r.offers as OfferRow[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const statusColor = (status?: string) => {
    switch (status) {
      case 'ready': return 'success'
      case 'draft': return 'warning'
      case 'submitted': return 'info'
      default: return 'default'
    }
  }

  const columns: GridColDef<OfferRow>[] = [
    { field: 'userId', headerName: 'User ID', width: 220 },
    { field: 'address', headerName: 'Address', flex: 2, minWidth: 200 },
    {
      field: 'offerPrice',
      headerName: 'Offer Price',
      width: 130,
      valueFormatter: (v) => v ? `$${Number(v).toLocaleString()}` : '—',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: ({ value }) => value
        ? <Chip label={value as string} size="small" color={statusColor(value as string)} />
        : null,
    },
    { field: 'financingType', headerName: 'Financing', width: 120 },
    {
      field: 'createdAt',
      headerName: 'Created',
      flex: 1,
      minWidth: 160,
      valueFormatter: (v) => v ? new Date(v as string).toLocaleDateString() : '—',
    },
  ]

  if (error) return <Typography color="error">{error}</Typography>

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h5" className="font-heading font-bold">Offers</Typography>
      {loading && <CircularProgress />}
      {!loading && (
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.offerId}
          autoHeight
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick
        />
      )}
    </Box>
  )
}
