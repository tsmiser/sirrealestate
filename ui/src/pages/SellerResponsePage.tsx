import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Button, CircularProgress, LinearProgress, Typography } from '@mui/material'

const API_URL = import.meta.env.VITE_API_URL

interface OfferInfo {
  listingAddress: string
  propertyState: string
  disclosuresAlreadyUploaded: number
}

interface UploadedFile {
  fileName: string
  documentId: string
}

type PageState = 'loading' | 'ready' | 'uploading' | 'done' | 'error'

export default function SellerResponsePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [pageState, setPageState] = useState<PageState>('loading')
  const [offerInfo, setOfferInfo] = useState<OfferInfo | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) {
      setErrorMessage('This link is invalid. Please use the link from your email.')
      setPageState('error')
      return
    }

    fetch(`${API_URL}/seller-response?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<OfferInfo>
      })
      .then((info) => {
        setOfferInfo(info)
        setPageState('ready')
      })
      .catch(() => {
        setErrorMessage('This link is invalid or has expired. Please contact the buyer for a new link.')
        setPageState('error')
      })
  }, [token])

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile> => {
    // Step 1: get presigned URL
    const urlRes = await fetch(
      `${API_URL}/seller-response/upload-url?token=${encodeURIComponent(token)}&fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type || 'application/octet-stream')}`,
    )
    if (!urlRes.ok) throw new Error('Failed to get upload URL')
    const { uploadUrl, documentId, s3Key } = await urlRes.json() as {
      uploadUrl: string
      documentId: string
      s3Key: string
    }

    // Step 2: upload to S3
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    })
    if (!putRes.ok) throw new Error('Failed to upload file')

    // Step 3: confirm
    const confirmRes = await fetch(`${API_URL}/seller-response/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        documentId,
        s3Key,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      }),
    })
    if (!confirmRes.ok) throw new Error('Failed to confirm upload')

    return { fileName: file.name, documentId }
  }, [token])

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    setPageState('uploading')
    setUploadProgress(0)

    const results: UploadedFile[] = []
    for (let i = 0; i < fileArray.length; i++) {
      try {
        const uploaded = await uploadFile(fileArray[i])
        results.push(uploaded)
      } catch {
        setErrorMessage(`Failed to upload "${fileArray[i].name}". Please try again.`)
        setPageState('ready')
        return
      }
      setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100))
    }

    setUploadedFiles((prev) => [...prev, ...results])
    setPageState('done')
  }, [uploadFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleFiles(e.target.files)
      e.target.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        bgcolor: '#f0f7fb',
      }}
    >
      <Box sx={{ maxWidth: 520, width: '100%' }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" fontWeight={700} color="#1a2233" gutterBottom>
            SirRealtor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Seller Disclosure Upload
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 3,
            p: 4,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}
        >
          {/* Loading */}
          {pageState === 'loading' && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={36} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading offer details…
              </Typography>
            </Box>
          )}

          {/* Error */}
          {pageState === 'error' && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Something went wrong
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {errorMessage}
              </Typography>
            </Box>
          )}

          {/* Ready to upload */}
          {(pageState === 'ready' || pageState === 'uploading') && offerInfo && (
            <>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Upload Seller's Disclosure
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Property
              </Typography>
              <Typography variant="body1" fontWeight={600} sx={{ mb: 3 }}>
                {offerInfo.listingAddress}
              </Typography>

              {offerInfo.disclosuresAlreadyUploaded > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {offerInfo.disclosuresAlreadyUploaded} document
                  {offerInfo.disclosuresAlreadyUploaded === 1 ? '' : 's'} already uploaded.
                  You can upload additional documents below.
                </Typography>
              )}

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please upload the completed Seller's Property Disclosure form and any addenda.
                The buyer will be notified when documents are received.
              </Typography>

              {pageState === 'uploading' ? (
                <Box sx={{ py: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Uploading…
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <Box
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      mb: 2,
                      '&:hover': { borderColor: '#00BFEB', bgcolor: '#f0f7fb' },
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Drag and drop files here, or{' '}
                      <Box component="span" sx={{ color: '#00BFEB', fontWeight: 600 }}>
                        browse
                      </Box>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      PDF, DOC, DOCX accepted
                    </Typography>
                  </Box>

                  {errorMessage && (
                    <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                      {errorMessage}
                    </Typography>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ bgcolor: '#00BFEB', '&:hover': { bgcolor: '#0097BD' } }}
                  >
                    Select Files to Upload
                  </Button>
                </>
              )}
            </>
          )}

          {/* Success */}
          {pageState === 'done' && offerInfo && (
            <>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Documents Received
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The following document{uploadedFiles.length === 1 ? '' : 's'} have been uploaded
                for <strong>{offerInfo.listingAddress}</strong> and the buyer has been notified.
              </Typography>
              <Box sx={{ mb: 3 }}>
                {uploadedFiles.map((f) => (
                  <Typography key={f.documentId} variant="body2" sx={{ py: 0.5 }}>
                    ✓ {f.fileName}
                  </Typography>
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Need to upload additional documents?
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setErrorMessage('')
                  setPageState('ready')
                }}
              >
                Upload More Documents
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}
