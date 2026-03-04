import { useEffect, useState } from 'react'
import { Box, Chip, CircularProgress, Typography } from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { api } from '@/services/api'

type DocRow = {
  documentId: string
  userId: string
  fileName?: string
  contentType?: string
  sizeBytes?: number
  documentType?: string
  uploadedAt?: string
  [key: string]: unknown
}

export default function DocumentsPage() {
  const [rows, setRows] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.documents.list()
      .then((r) => setRows(r.documents as DocRow[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const columns: GridColDef<DocRow>[] = [
    { field: 'userId', headerName: 'User ID', width: 220 },
    { field: 'fileName', headerName: 'File Name', flex: 2, minWidth: 200 },
    { field: 'contentType', headerName: 'Type', width: 140 },
    {
      field: 'sizeBytes',
      headerName: 'Size',
      width: 100,
      valueFormatter: (v) => v ? `${Math.round(Number(v) / 1024)} KB` : '—',
    },
    {
      field: 'documentType',
      headerName: 'Doc Type',
      width: 160,
      renderCell: ({ value }) => value
        ? <Chip label={value as string} size="small" variant="outlined" />
        : null,
    },
    {
      field: 'uploadedAt',
      headerName: 'Uploaded',
      flex: 1,
      minWidth: 160,
      valueFormatter: (v) => v ? new Date(v as string).toLocaleDateString() : '—',
    },
  ]

  if (error) return <Typography color="error">{error}</Typography>

  return (
    <Box className="flex flex-col gap-4">
      <Typography variant="h5" className="font-heading font-bold">Documents</Typography>
      {loading && <CircularProgress />}
      {!loading && (
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.documentId}
          autoHeight
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick
        />
      )}
    </Box>
  )
}
