import { useEffect, useState } from 'react'
import { Box, Chip, CircularProgress, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { api } from '@/services/api'

type ViewingRow = {
  viewingId: string
  userId: string
  address?: string
  scheduledDate?: string
  status?: string
  agentName?: string
  [key: string]: unknown
}

export default function ViewingsPage() {
  const [rows, setRows] = useState<ViewingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.viewings.list()
      .then((r) => setRows(r.viewings as ViewingRow[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const statusColor = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'success'
      case 'pending': return 'warning'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const columns: GridColDef<ViewingRow>[] = [
    { field: 'userId', headerName: 'User ID', width: 220 },
    { field: 'address', headerName: 'Address', flex: 2, minWidth: 200 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: ({ value }) => value
        ? <Chip label={value as string} size="small" color={statusColor(value as string)} />
        : null,
    },
    { field: 'agentName', headerName: 'Agent', width: 160 },
    {
      field: 'scheduledDate',
      headerName: 'Scheduled',
      flex: 1,
      minWidth: 160,
      valueFormatter: (v) => v ? new Date(v as string).toLocaleDateString() : '—',
    },
  ]

  if (error) return <Typography color="error">{error}</Typography>

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h5" className="font-heading font-bold">Viewings</Typography>
      {loading && <CircularProgress />}
      {!loading && (
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.viewingId}
          autoHeight
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick
        />
      )}
    </Box>
  )
}
