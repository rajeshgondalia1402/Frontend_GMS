import { useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { ReportFormat } from '@/lib/report'

interface ExportButtonsProps {
  /** Builds and downloads the file; may return a promise (fetching all rows, loading the logo). */
  onExport: (format: ReportFormat) => void | Promise<void>
  disabled?: boolean
  className?: string
}

/**
 * "Download Excel" and "Download PDF" side by side — green for the
 * spreadsheet, red for the PDF, the colours people know those files by.
 * Each shows its own spinner while its file is being made.
 */
export function ExportButtons({ onExport, disabled, className }: ExportButtonsProps) {
  const [busy, setBusy] = useState<ReportFormat | null>(null)

  const run = async (format: ReportFormat) => {
    setBusy(format)
    try {
      await onExport(format)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={cn('flex shrink-0 gap-2', className)}>
      <Button
        variant="outline"
        className="flex-1 sm:flex-none"
        leftIcon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
        loading={busy === 'excel'}
        disabled={disabled || busy !== null}
        title="Download this list as an Excel sheet"
        onClick={() => void run('excel')}
      >
        <span className="hidden lg:inline">Download Excel</span>
        <span className="lg:hidden">Excel</span>
      </Button>
      <Button
        variant="outline"
        className="flex-1 sm:flex-none"
        leftIcon={<FileText className="h-4 w-4 text-red-600" />}
        loading={busy === 'pdf'}
        disabled={disabled || busy !== null}
        title="Download this list as a PDF, ready to print or share"
        onClick={() => void run('pdf')}
      >
        <span className="hidden lg:inline">Download PDF</span>
        <span className="lg:hidden">PDF</span>
      </Button>
    </div>
  )
}
