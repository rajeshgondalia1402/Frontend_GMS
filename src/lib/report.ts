import { datedFileName, downloadExcel } from '@/lib/excel'
import type { ExportColumn, ReportInfo } from '@/lib/excel'
import { datedPdfName, downloadPdfReport } from '@/lib/pdfReport'
import type { PdfReportExtras, ReportOwner } from '@/lib/pdfReport'

export type ReportFormat = 'excel' | 'pdf'
export type { PdfReportExtras, ReportOwner }

/**
 * Downloads a list as Excel or as the branded PDF — same title, filters,
 * columns and rows either way, so the two files always agree.
 */
export async function downloadReport<T>(
  format: ReportFormat,
  baseName: string,
  info: ReportInfo,
  columns: ExportColumn<T>[],
  rows: T[],
  owner: ReportOwner | null = null,
  /** PDF only: headline boxes, a breakdown and a total row. */
  extras: PdfReportExtras = {},
): Promise<void> {
  if (format === 'pdf') {
    await downloadPdfReport(datedPdfName(baseName), info, columns, rows, owner, extras)
    return
  }
  downloadExcel(datedFileName(baseName), info, columns, rows)
}
