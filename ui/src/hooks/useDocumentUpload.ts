import { useState, useCallback } from 'react'
import { documents as documentsApi } from '@/services/api'
import { useSidebarRefresh } from '@/components/layout/sidebar-refresh-context'

export function useDocumentUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const { invalidateDocuments } = useSidebarRefresh()

  const upload = useCallback(async (file: File): Promise<void> => {
    setIsUploading(true)
    try {
      const { uploadUrl, documentId, s3Key } = await documentsApi.getUploadUrl(file.name, file.type)

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      await documentsApi.confirm({
        documentId,
        s3Key,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      })

      invalidateDocuments()
    } finally {
      setIsUploading(false)
    }
  }, [invalidateDocuments])

  return { upload, isUploading }
}
