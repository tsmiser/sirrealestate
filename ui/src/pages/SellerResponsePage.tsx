import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Button, CircularProgress, Divider, LinearProgress, TextField, Typography } from '@mui/material'

const API_URL = import.meta.env.VITE_API_URL

interface OfferInfo {
  listingAddress: string
  propertyState: string
  disclosuresAlreadyUploaded: number
  purchaseAgreementAvailable: boolean
  sellerDecisionStatus: string | null
}

interface UploadedFile {
  fileName: string
  documentId: string
}

type PageState = 'loading' | 'ready' | 'uploading' | 'done' | 'error'
type DecisionState = 'idle' | 'countering' | 'submitting' | 'submitted'

export default function SellerResponsePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [pageState, setPageState] = useState<PageState>('loading')
  const [offerInfo, setOfferInfo] = useState<OfferInfo | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [decisionState, setDecisionState] = useState<DecisionState>('idle')
  const [counterPrice, setCounterPrice] = useState('')
  const [decisionError, setDecisionError] = useState('')

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

  const handleDownloadPa = async () => {
    const res = await fetch(
      `${API_URL}/seller-response/download-pa?token=${encodeURIComponent(token)}`,
    )
    if (!res.ok) return
    const { downloadUrl } = await res.json() as { downloadUrl: string }
    window.open(downloadUrl, '_blank')
  }

  const handleDecision = async (decision: 'accepted' | 'countered' | 'rejected') => {
    setDecisionError('')
    if (decision === 'countered') {
      const price = parseFloat(counterPrice.replace(/,/g, ''))
      if (!counterPrice || isNaN(price) || price <= 0) {
        setDecisionError('Please enter a valid counter offer price.')
        return
      }
    }
    setDecisionState('submitting')
    try {
      const res = await fetch(`${API_URL}/seller-response/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          decision,
          counterOfferPrice: decision === 'countered' ? parseFloat(counterPrice.replace(/,/g, '')) : undefined,
        }),
      })
      if (!res.ok) throw new Error()
      setDecisionState('submitted')
    } catch {
      setDecisionError('Failed to record decision. Please try again.')
      setDecisionState(decision === 'countered' ? 'countering' : 'idle')
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
            Seller Response Portal
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Property
              </Typography>
              <Typography variant="body1" fontWeight={600} sx={{ mb: 3 }}>
                {offerInfo.listingAddress}
              </Typography>

              {/* Download Purchase Agreement */}
              {offerInfo.purchaseAgreementAvailable && (
                <Box sx={{ mb: 3 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => void handleDownloadPa()}
                  >
                    Download Purchase Agreement
                  </Button>
                </Box>
              )}

              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" fontWeight={700} gutterBottom>
                Upload Seller's Disclosure
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

              {/* Offer Decision */}
              {offerInfo.sellerDecisionStatus && ['accepted', 'countered', 'rejected'].includes(offerInfo.sellerDecisionStatus) ? (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 3 }} />
                  <Typography variant="body2" color="text.secondary">
                    Decision already recorded: <strong>{offerInfo.sellerDecisionStatus}</strong>.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 3 }} />
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Respond to Offer
                  </Typography>
                  {decisionState === 'submitted' ? (
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                      Your response has been recorded. The buyer has been notified.
                    </Typography>
                  ) : decisionState === 'countering' ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter your counter offer price:
                      </Typography>
                      <TextField
                        fullWidth
                        label="Counter Offer Price ($)"
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                        size="small"
                        sx={{ mb: 2 }}
                        placeholder="e.g. 525000"
                      />
                      {decisionError && (
                        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                          {decisionError}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          sx={{ bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' } }}
                          onClick={() => void handleDecision('countered')}
                        >
                          Submit Counter
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => { setDecisionState('idle'); setDecisionError('') }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {decisionError && (
                        <Typography variant="body2" color="error">
                          {decisionError}
                        </Typography>
                      )}
                      <Button
                        variant="contained"
                        sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                        onClick={() => void handleDecision('accepted')}
                        disabled={decisionState === 'submitting'}
                      >
                        Accept Offer
                      </Button>
                      <Button
                        variant="outlined"
                        sx={{ borderColor: '#d97706', color: '#d97706', '&:hover': { borderColor: '#b45309', bgcolor: '#fef3c7' } }}
                        onClick={() => setDecisionState('countering')}
                      >
                        Make Counter Offer
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => void handleDecision('rejected')}
                        disabled={decisionState === 'submitting'}
                      >
                        Decline Offer
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}

          {/* Success */}
          {pageState === 'done' && offerInfo && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Property
              </Typography>
              <Typography variant="body1" fontWeight={600} sx={{ mb: 3 }}>
                {offerInfo.listingAddress}
              </Typography>

              {offerInfo.purchaseAgreementAvailable && (
                <Box sx={{ mb: 3 }}>
                  <Button variant="outlined" fullWidth onClick={() => void handleDownloadPa()}>
                    Download Purchase Agreement
                  </Button>
                </Box>
              )}

              <Divider sx={{ mb: 3 }} />

              <Typography variant="h6" fontWeight={700} gutterBottom>
                Documents Received
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The following document{uploadedFiles.length === 1 ? '' : 's'} have been uploaded
                and the buyer has been notified.
              </Typography>
              <Box sx={{ mb: 3 }}>
                {uploadedFiles.map((f) => (
                  <Typography key={f.documentId} variant="body2" sx={{ py: 0.5 }}>
                    ✓ {f.fileName}
                  </Typography>
                ))}
              </Box>
              <Button
                variant="outlined"
                fullWidth
                sx={{ mb: 3 }}
                onClick={() => {
                  setErrorMessage('')
                  setPageState('ready')
                }}
              >
                Upload More Documents
              </Button>

              {/* Offer Decision */}
              {offerInfo.sellerDecisionStatus && ['accepted', 'countered', 'rejected'].includes(offerInfo.sellerDecisionStatus) ? (
                <Box>
                  <Divider sx={{ mb: 3 }} />
                  <Typography variant="body2" color="text.secondary">
                    Decision already recorded: <strong>{offerInfo.sellerDecisionStatus}</strong>.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Divider sx={{ mb: 3 }} />
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Respond to Offer
                  </Typography>
                  {decisionState === 'submitted' ? (
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                      Your response has been recorded. The buyer has been notified.
                    </Typography>
                  ) : decisionState === 'countering' ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter your counter offer price:
                      </Typography>
                      <TextField
                        fullWidth
                        label="Counter Offer Price ($)"
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                        size="small"
                        sx={{ mb: 2 }}
                        placeholder="e.g. 525000"
                      />
                      {decisionError && (
                        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                          {decisionError}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          sx={{ bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' } }}
                          onClick={() => void handleDecision('countered')}
                        >
                          Submit Counter
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => { setDecisionState('idle'); setDecisionError('') }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {decisionError && (
                        <Typography variant="body2" color="error">
                          {decisionError}
                        </Typography>
                      )}
                      <Button
                        variant="contained"
                        sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
                        onClick={() => void handleDecision('accepted')}
                        disabled={decisionState === 'submitting'}
                      >
                        Accept Offer
                      </Button>
                      <Button
                        variant="outlined"
                        sx={{ borderColor: '#d97706', color: '#d97706', '&:hover': { borderColor: '#b45309', bgcolor: '#fef3c7' } }}
                        onClick={() => setDecisionState('countering')}
                      >
                        Make Counter Offer
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => void handleDecision('rejected')}
                        disabled={decisionState === 'submitting'}
                      >
                        Decline Offer
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}
