'use client'

import { Button } from '@/components/ui/button'
import { Eye, Download, Loader2 } from 'lucide-react'
import { useState } from 'react'

export type PDFDocumentType = 'invoice' | 'surat-jalan' | 'berita-acara'

interface PDFButtonsProps {
  documentType: PDFDocumentType
  documentId: string
  documentNumber?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'outline' | 'ghost'
  showLabels?: boolean
}

export function PDFButtons({
  documentType,
  documentId,
  documentNumber,
  size = 'sm',
  variant = 'outline',
  showLabels = true,
}: PDFButtonsProps) {
  const [isViewing, setIsViewing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const getPDFUrl = (download: boolean) => {
    const baseUrl = `/api/pdf/${documentType}/${documentId}`
    return download ? `${baseUrl}?download=true` : baseUrl
  }

  const handleView = () => {
    setIsViewing(true)
    window.open(getPDFUrl(false), '_blank')
    // Reset loading state after a short delay
    setTimeout(() => setIsViewing(false), 1000)
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(getPDFUrl(true))
      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = documentNumber ? `${documentNumber}.pdf` : `${documentType}-${documentId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant={variant}
        size={size}
        onClick={handleView}
        disabled={isViewing}
      >
        {isViewing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
        {showLabels && <span className="ml-2">View PDF</span>}
      </Button>
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {showLabels && <span className="ml-2">Download</span>}
      </Button>
    </div>
  )
}

// Compact version for table rows
interface PDFIconButtonsProps {
  documentType: PDFDocumentType
  documentId: string
  documentNumber?: string
}

export function PDFIconButtons({
  documentType,
  documentId,
  documentNumber,
}: PDFIconButtonsProps) {
  return (
    <PDFButtons
      documentType={documentType}
      documentId={documentId}
      documentNumber={documentNumber}
      size="icon"
      variant="ghost"
      showLabels={false}
    />
  )
}
