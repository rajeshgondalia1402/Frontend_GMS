/**
 * A minimal `.xlsx` writer — one sheet laid out as a report: a title block
 * naming the data and when it was taken, then a styled, frozen header row
 * over the rows themselves.
 *
 * The file is a ZIP of a handful of XML parts. Every entry is stored
 * uncompressed, which the ZIP format allows and Excel accepts, so nothing
 * beyond a CRC has to be computed and no dependency is needed for lists of
 * the size this app exports.
 */

export type CellValue = string | number | null | undefined

export type ColumnAlign = 'left' | 'center' | 'right'

export interface ExportColumn<T> {
  header: string
  value: (row: T, index: number) => CellValue
  /** Defaults to right for numbers and left for everything else. */
  align?: ColumnAlign
  /** Wraps long free text — addresses, notes — instead of letting it run on. */
  wrap?: boolean
  /** Width in characters; measured from the content when left off. */
  width?: number
}

/** The block printed above the table, saying what the sheet holds. */
export interface ReportInfo {
  /** The heading, e.g. "Customer List". */
  title: string
  /** A line under the heading, e.g. what the list was filtered by. */
  subtitle?: string
  /** `Label: value` lines. The row count and the date are added to these. */
  meta?: { label: string; value: CellValue }[]
  /** Name for the sheet tab; the title is used when left off. */
  sheetName?: string
  /** Numbers the rows 1..n in a leading column. */
  includeIndex?: boolean
}

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

function escapeXml(value: string): string {
  // Control characters are not legal in XML and would make the file unreadable.
  return value
    .replace(/[&<>"']/g, (char) => XML_ESCAPES[char])
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
}

/** `0 -> A`, `25 -> Z`, `26 -> AA`. */
function columnName(index: number): string {
  let name = ''
  let n = index
  while (n >= 0) {
    name = String.fromCharCode(65 + (n % 26)) + name
    n = Math.floor(n / 26) - 1
  }
  return name
}

function cellXml(value: CellValue, column: number, row: number, style: number): string {
  const ref = `${columnName(column)}${row}`
  const s = style ? ` s="${style}"` : ''
  if (value === null || value === undefined || value === '') return `<c r="${ref}"${s}/>`

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}"${s}><v>${value}</v></c>`
  }

  // Inline strings keep the whole sheet in one part — no shared string table.
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${escapeXml(
    String(value),
  )}</t></is></c>`
}

/* ------------------------------------------------------------------ styles */

/** The fixed `cellXfs` entries; data cells come from `dataStyle` below. */
const STYLE = {
  default: 0,
  title: 1,
  subtitle: 2,
  meta: 3,
  header: 4,
} as const

/** Where the twelve data formats start in `cellXfs`. */
const FIRST_DATA_STYLE = 5
const ALIGNS: ColumnAlign[] = ['left', 'center', 'right']

/** One `cellXfs` index per combination of alignment, wrapping and banding. */
function dataStyle(align: ColumnAlign, wrap: boolean, banded: boolean): number {
  return FIRST_DATA_STYLE + ALIGNS.indexOf(align) + (wrap ? 3 : 0) + (banded ? 6 : 0)
}

/** The twelve entries `dataStyle` indexes, generated in that same order. */
const DATA_XFS = Array.from({ length: 12 }, (_, i) => {
  const align = ALIGNS[i % 3]
  const wrap = i % 6 >= 3
  const banded = i >= 6

  return `<xf numFmtId="0" fontId="0" fillId="${
    banded ? 3 : 0
  }" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="${align}" vertical="center"${
    wrap ? ' wrapText="1"' : ''
  }/></xf>`
}).join('')

const STYLES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="5">' +
  '<font><sz val="11"/><color theme="1"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="16"/><color rgb="FF1E3A8A"/><name val="Calibri"/></font>' +
  '<font><sz val="11"/><color rgb="FF475569"/><name val="Calibri"/></font>' +
  '<font><sz val="10"/><color rgb="FF64748B"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>' +
  '</fonts>' +
  '<fills count="4">' +
  '<fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/><bgColor indexed="64"/></patternFill></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>' +
  '</fills>' +
  '<borders count="2">' +
  '<border><left/><right/><top/><bottom/><diagonal/></border>' +
  '<border>' +
  '<left style="thin"><color rgb="FFCBD5E1"/></left>' +
  '<right style="thin"><color rgb="FFCBD5E1"/></right>' +
  '<top style="thin"><color rgb="FFCBD5E1"/></top>' +
  '<bottom style="thin"><color rgb="FFCBD5E1"/></bottom>' +
  '<diagonal/></border>' +
  '</borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  `<cellXfs count="${FIRST_DATA_STYLE + 12}">` +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>' +
  '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>' +
  '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>' +
  '<xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
  DATA_XFS +
  '</cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  '</styleSheet>'

/* ------------------------------------------------------------------- sheet */

/** Roughly how wide the column has to be for its widest cell to fit. */
function columnWidth<T>(column: ExportColumn<T>, rows: T[]): number {
  if (column.width) return column.width

  let widest = column.header.length
  for (let i = 0; i < rows.length; i++) {
    const value = column.value(rows[i], i)
    if (value === null || value === undefined) continue
    const length = String(value).length
    if (length > widest) widest = length
  }

  // Room for the filter arrow, and a ceiling so a long note cannot swallow
  // the sheet — those columns wrap instead.
  return Math.min(Math.max(widest + 4, 10), 42)
}

/** Numbers sit right, everything else left, unless the column says otherwise. */
function alignOf<T>(column: ExportColumn<T>, rows: T[]): ColumnAlign {
  if (column.align) return column.align

  for (let i = 0; i < rows.length; i++) {
    const value = column.value(rows[i], i)
    if (value === null || value === undefined || value === '') continue
    return typeof value === 'number' ? 'right' : 'left'
  }

  return 'left'
}

/** `27 Aug 2026, 03:15 pm` — the moment the sheet was taken. */
function stamp(date: Date): string {
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function sheetXml<T>(info: ReportInfo, columns: ExportColumn<T>[], rows: T[]): string {
  const lastColumn = columnName(columns.length - 1)
  const merges: string[] = []
  const banner: string[] = []
  let row = 0

  /** A line of the title block, merged across the width of the table. */
  const bannerRow = (text: string, style: number, height: number) => {
    row += 1
    merges.push(`<mergeCell ref="A${row}:${lastColumn}${row}"/>`)
    banner.push(
      `<row r="${row}" ht="${height}" customHeight="1">${cellXml(text, 0, row, style)}</row>`,
    )
  }

  bannerRow(info.title, STYLE.title, 27)
  if (info.subtitle) bannerRow(info.subtitle, STYLE.subtitle, 18)
  for (const item of info.meta ?? []) {
    if (item.value === null || item.value === undefined || item.value === '') continue
    bannerRow(`${item.label}: ${item.value}`, STYLE.meta, 15)
  }

  // A blank row keeps the title block clear of the table.
  row += 2
  const headerRow = row

  const header = `<row r="${headerRow}" ht="24" customHeight="1">${columns
    .map((column, i) => cellXml(column.header, i, headerRow, STYLE.header))
    .join('')}</row>`

  const aligns = columns.map((column) => alignOf(column, rows))

  const body = rows
    .map((item, r) => {
      const number = headerRow + r + 1
      const banded = r % 2 === 1
      const cells = columns
        .map((column, i) =>
          cellXml(
            column.value(item, r),
            i,
            number,
            dataStyle(aligns[i], column.wrap ?? false, banded),
          ),
        )
        .join('')
      return `<row r="${number}">${cells}</row>`
    })
    .join('')

  const lastRow = headerRow + rows.length
  const cols = columns
    .map(
      (column, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${columnWidth(column, rows).toFixed(
          2,
        )}" customWidth="1"/>`,
    )
    .join('')

  // The title block and the header stay put while the rows scroll.
  const pane =
    `<pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/>` +
    `<selection pane="bottomLeft" activeCell="A${headerRow + 1}" sqref="A${headerRow + 1}"/>`

  const filter = rows.length ? `<autoFilter ref="A${headerRow}:${lastColumn}${lastRow}"/>` : ''

  // The children below are in the order the schema requires: cols before
  // sheetData, autoFilter before mergeCells.
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<dimension ref="A1:${lastColumn}${Math.max(lastRow, headerRow)}"/>` +
    `<sheetViews><sheetView showGridLines="0" tabSelected="1" workbookViewId="0">${pane}</sheetView></sheetViews>` +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    `<cols>${cols}</cols>` +
    `<sheetData>${banner.join('')}${header}${body}</sheetData>` +
    filter +
    `<mergeCells count="${merges.length}">${merges.join('')}</mergeCells>` +
    '<pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>' +
    '<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>' +
    '</worksheet>'
  )
}

/* --------------------------------------------------------------- packaging */

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`

/** Excel refuses a sheet name over 31 characters or holding `[]:*?/\`. */
function safeSheetName(name: string): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, ' ').trim()
  return (cleaned || 'Sheet1').slice(0, 31)
}

function workbookXml(sheetName: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(
    safeSheetName(sheetName),
  )}" sheetId="1" r:id="rId1"/></sheets></workbook>`
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let bit = 0; bit < 8; bit++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

interface ZipEntry {
  name: string
  bytes: Uint8Array
  crc: number
  offset: number
}

/** Packs the parts into a ZIP with every entry stored, not deflated. */
function zip(files: { name: string; content: string }[]): Blob {
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  const entries: ZipEntry[] = []
  let offset = 0

  const push = (bytes: Uint8Array) => {
    chunks.push(bytes)
    offset += bytes.length
  }

  for (const file of files) {
    const name = encoder.encode(file.name)
    const bytes = encoder.encode(file.content)
    const crc = crc32(bytes)

    const header = new DataView(new ArrayBuffer(30))
    header.setUint32(0, 0x04034b50, true) // local file header
    header.setUint16(4, 20, true) // version needed
    header.setUint16(6, 0, true) // flags
    header.setUint16(8, 0, true) // stored
    header.setUint16(10, 0, true) // mod time
    header.setUint16(12, 0x0021, true) // mod date — 1 Jan 1980, the ZIP epoch
    header.setUint32(14, crc, true)
    header.setUint32(18, bytes.length, true) // compressed size
    header.setUint32(22, bytes.length, true) // uncompressed size
    header.setUint16(26, name.length, true)
    header.setUint16(28, 0, true) // extra length

    entries.push({ name: file.name, bytes, crc, offset })
    push(new Uint8Array(header.buffer))
    push(name)
    push(bytes)
  }

  const centralStart = offset
  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    const header = new DataView(new ArrayBuffer(46))
    header.setUint32(0, 0x02014b50, true) // central directory header
    header.setUint16(4, 20, true) // version made by
    header.setUint16(6, 20, true) // version needed
    header.setUint16(8, 0, true) // flags
    header.setUint16(10, 0, true) // stored
    header.setUint16(12, 0, true) // mod time
    header.setUint16(14, 0x0021, true) // mod date
    header.setUint32(16, entry.crc, true)
    header.setUint32(20, entry.bytes.length, true)
    header.setUint32(24, entry.bytes.length, true)
    header.setUint16(28, name.length, true)
    header.setUint16(30, 0, true) // extra length
    header.setUint16(32, 0, true) // comment length
    header.setUint16(34, 0, true) // disk number
    header.setUint16(36, 0, true) // internal attributes
    header.setUint32(38, 0, true) // external attributes
    header.setUint32(42, entry.offset, true)

    push(new Uint8Array(header.buffer))
    push(name)
  }

  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true) // end of central directory
  end.setUint16(4, 0, true) // this disk
  end.setUint16(6, 0, true) // disk with the directory
  end.setUint16(8, entries.length, true)
  end.setUint16(10, entries.length, true)
  end.setUint32(12, offset - centralStart, true)
  end.setUint32(16, centralStart, true)
  end.setUint16(20, 0, true) // comment length
  push(new Uint8Array(end.buffer))

  return new Blob(chunks as BlobPart[], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/** The serial number a printed list is expected to open with. */
function indexColumn<T>(): ExportColumn<T> {
  return { header: 'Sr. No.', value: (_row, index) => index + 1, align: 'center', width: 8 }
}

/** The workbook, as the bytes of an `.xlsx` file. */
export function buildWorkbook<T>(
  info: ReportInfo,
  columns: ExportColumn<T>[],
  rows: T[],
  now: Date = new Date(),
): Blob {
  const sheetColumns = info.includeIndex ? [indexColumn<T>(), ...columns] : columns

  // Every sheet says how many rows it holds and when it was taken, after
  // whatever the caller adds.
  const meta = [
    ...(info.meta ?? []),
    { label: 'Total Records', value: rows.length },
    { label: 'Generated On', value: stamp(now) },
  ]

  return zip([
    { name: '[Content_Types].xml', content: CONTENT_TYPES },
    { name: '_rels/.rels', content: ROOT_RELS },
    { name: 'xl/workbook.xml', content: workbookXml(info.sheetName ?? info.title) },
    { name: 'xl/_rels/workbook.xml.rels', content: WORKBOOK_RELS },
    { name: 'xl/styles.xml', content: STYLES },
    { name: 'xl/worksheets/sheet1.xml', content: sheetXml({ ...info, meta }, sheetColumns, rows) },
  ])
}

/** `customers-2026-08-26` — the list plus the day it was taken. */
export function datedFileName(base: string, date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${base}-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.xlsx`
}

/** Builds the workbook and hands it to the browser as a download. */
export function downloadExcel<T>(
  fileName: string,
  info: ReportInfo,
  columns: ExportColumn<T>[],
  rows: T[],
): void {
  const url = URL.createObjectURL(buildWorkbook(info, columns, rows))

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Revoked on the next tick so the click has definitely been handled.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
