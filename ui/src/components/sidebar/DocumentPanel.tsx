import { useRef } from 'react'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import NiArrowOutUp from '@/icons/nexture/ni-arrow-out-up'
import NiShare from '@/icons/nexture/ni-share'
import { documents as documentsApi } from '@/services/api'
import { useDocumentUpload } from '@/hooks/useDocumentUpload'
import type { UserDocument } from '@/hooks/useDocuments'

interface DocumentPanelProps {
  documentList: UserDocument[]
}

export default function DocumentPanel({ documentList }: DocumentPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { upload, isUploading } = useDocumentUpload()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    await upload(file)
  }

  const handleDownload = async (doc: UserDocument) => {
    try {
      const { downloadUrl } = await documentsApi.getDownloadUrl(doc.documentId)
      window.open(downloadUrl, '_blank', 'noopener,noreferrer')
    } catch {
      // silently ignore
    }
  }

  return (
    <Box className="flex flex-col gap-1">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      <Box className="ms-7 flex items-center justify-between">
        <Typography variant="caption" className="text-text-secondary italic">
          {documentList.length === 0 ? 'No documents yet' : `${documentList.length} document${documentList.length === 1 ? '' : 's'}`}
        </Typography>
        <Tooltip title="Upload document" arrow>
          <span>
            <IconButton
              size="small"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className={isUploading ? 'animate-pulse' : ''}
            >
              <NiArrowOutUp size="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {documentList.length === 0 ? (
        <Typography variant="caption" className="text-text-secondary ms-7 px-2.5 italic">
          Upload one from here or the chat bar
        </Typography>
      ) : (
        documentList.map((doc) => (
          <Box
            key={doc.documentId}
            className="ms-7 flex items-center justify-between gap-2 rounded-lg border border-grey-100 bg-background px-3 py-2"
          >
            <Tooltip title={doc.fileName} arrow>
              <Typography
                variant="body2"
                className="text-text-primary min-w-0 flex-1 truncate font-medium"
              >
                {doc.fileName}
              </Typography>
            </Tooltip>
            <Tooltip title="Download" arrow>
              <IconButton size="small" onClick={() => handleDownload(doc)}>
                <NiShare size="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ))
      )}
    </Box>
  )
}
