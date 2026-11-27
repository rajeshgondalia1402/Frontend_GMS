/**
 * The branded PDF version of every list the app can download as Excel.
 *
 * It takes the very same columns and report info as `downloadExcel`, so each
 * screen's PDF always holds exactly what its spreadsheet holds — laid out for
 * printing: GaragePilot logo and the garage's own name on top, what the list
 * is and how it was filtered, a ruled table that repeats its header on every
 * page, and "Page 1 of 3" at the foot.
 */
import { PdfDocument, downloadPdf, measureText } from '@/lib/pdf'
import type { PdfImage, Rgb } from '@/lib/pdf'
import type { CellValue, ColumnAlign, ExportColumn, ReportInfo } from '@/lib/excel'

/** Who the report is from, printed top-right under the garage's name. */
export interface ReportOwner {
  garageName?: string | null
  ownerName?: string | null
  mobileNumber?: string | null
  city?: string | null
  email?: string | null
}

/**
 * Extra blocks for reports that are about money (the revenue reports): headline
 * figures in boxes, a small breakdown table, and a bold total row under the list.
 */
export interface PdfReportExtras {
  /** Big figures in a row of boxes, e.g. Total Collected. The first is highlighted. */
  cards?: { label: string; value: string; hint?: string }[]
  /** A small table above the main list, e.g. "By payment method". */
  breakdown?: {
    title: string
    headers: string[]
    rows: string[][]
    /** Per column; defaults to left for the first column, right for the rest. */
    align?: ColumnAlign[]
  }
  /** Heading printed just above the main table, e.g. "Payment details". */
  tableTitle?: string
  /**
   * A bold last row under the main table. Keys are column headers; the label
   * goes in the first column.
   */
  totals?: { label: string; values: Record<string, string> }
}

const rgb = (hex: string): Rgb => ({
  r: parseInt(hex.slice(1, 3), 16) / 255,
  g: parseInt(hex.slice(3, 5), 16) / 255,
  b: parseInt(hex.slice(5, 7), 16) / 255,
})

/** The logo's royal blue and orange, with the app's slate greys. */
const NAVY = rgb('#0a2a60')
const BLUE = rgb('#0b5ed7')
const ORANGE = rgb('#f97316')
const INK = rgb('#0f172a')
const BODY = rgb('#334155')
const MUTED = rgb('#64748b')
const RULE = rgb('#e2e8f0')
const BAND = rgb('#f1f5f9')
const ZEBRA = rgb('#f8fafc')
const WHITE = rgb('#ffffff')

const MARGIN = 32
const CELL_PAD = 5
const FONT = 8.5
const HEAD_FONT = 8.5
const LINE = 11

/* ------------------------------------------------------------------ */
/* Logo                                                               */
/* ------------------------------------------------------------------ */

let logoPromise: Promise<PdfImage | null> | null = null

/**
 * The GaragePilot logo as a JPEG (PDF takes JPEG as-is), on white since JPEG
 * has no transparency. Loaded once per visit; a failure just leaves it off.
 */
function loadLogo(): Promise<PdfImage | null> {
  logoPromise ??= new Promise<PdfImage | null>((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        const base64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1] ?? ''
        resolve({ data: atob(base64), width: canvas.width, height: canvas.height })
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = '/brand/garagepilot-logo.png'
  })
  return logoPromise
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function cellText(value: CellValue): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

/** `26-Nov-2026, 5:21 pm` */
function stamp(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const h = date.getHours()
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}, ${h % 12 || 12}:${m} ${h < 12 ? 'am' : 'pm'}`
}

/** Shortens one line to fit, ending in "...". */
function fit(text: string, width: number, size: number, bold = false): string {
  const weight = bold ? 'bold' : 'normal'
  if (measureText(text, size, weight) <= width) return text
  let cut = text
  while (cut.length > 1 && measureText(`${cut}...`, size, weight) > width) cut = cut.slice(0, -1)
  return `${cut}...`
}

/** Shares the page width out by how much text each column holds. */
function columnWidths<T>(columns: ExportColumn<T>[], rows: T[], total: number): number[] {
  const sample = rows.slice(0, 200)
  const want = columns.map((col, c) => {
    const head = measureText(col.header, HEAD_FONT, 'bold')
    let longest = 0
    for (let r = 0; r < sample.length; r += 1) {
      longest = Math.max(longest, measureText(cellText(col.value(sample[r], r)), FONT))
    }
    // Free text is allowed to wrap, so it does not get to claim a whole line.
    const body = col.wrap ? Math.min(longest, 170) : Math.min(longest, 220)
    const floor = c === 0 && col.header.startsWith('Sr') ? 30 : 42
    return Math.max(head, body, floor) + CELL_PAD * 2
  })
  const sum = want.reduce((a, b) => a + b, 0)
  if (sum <= total) {
    // Spare room goes to the widest columns, so the table fills the page.
    return want.map((w) => w + ((total - sum) * w) / sum)
  }
  return want.map((w) => (w / sum) * total)
}

function alignOf<T>(col: ExportColumn<T>, rows: T[]): ColumnAlign {
  if (col.align) return col.align
  const first = rows.find((row, i) => {
    const v = col.value(row, i)
    return v !== null && v !== undefined && v !== ''
  })
  return first !== undefined && typeof col.value(first, rows.indexOf(first)) === 'number' ? 'right' : 'left'
}

/* ------------------------------------------------------------------ */
/* Builder                                                            */
/* ------------------------------------------------------------------ */

export function buildPdfReport<T>(
  info: ReportInfo,
  columns: ExportColumn<T>[],
  rows: T[],
  owner: ReportOwner | null,
  logo: PdfImage | null,
  now: Date = new Date(),
  extras: PdfReportExtras = {},
): Blob {
  const allColumns: ExportColumn<T>[] = info.includeIndex
    ? [{ header: 'Sr. No.', value: (_r, i) => i + 1, align: 'center' }, ...columns]
    : columns

  // Wide lists turn the page sideways rather than squeezing every column.
  const doc = new PdfDocument({ landscape: allColumns.length > 6 })
  const W = doc.width
  const H = doc.height
  const contentW = W - MARGIN * 2
  const bottom = H - MARGIN - 22

  /* ---- Letterhead (first page only) ---- */
  let y = MARGIN

  const logoH = 40
  if (logo) {
    const logoW = (logo.width / logo.height) * logoH
    doc.image(logo, MARGIN, y, logoW, logoH)
  } else {
    doc.text('GaragePilot', MARGIN, y + 26, { size: 22, weight: 'bold', color: BLUE })
  }

  // The garage on the right: its name big, then who and how to reach them.
  const right = W - MARGIN
  const garage = owner?.garageName?.trim()
  const contact = [owner?.ownerName, owner?.mobileNumber ? `+91 ${owner.mobileNumber}` : null]
    .filter(Boolean)
    .join('  |  ')
  const where = [owner?.city, owner?.email].filter(Boolean).join('  |  ')
  let ry = y + 13
  if (garage) {
    doc.text(fit(garage, contentW * 0.55, 15, true), right, ry, { size: 15, weight: 'bold', color: INK, align: 'right' })
    ry += 15
  }
  if (contact) {
    doc.text(fit(contact, contentW * 0.55, 9), right, ry, { size: 9, color: BODY, align: 'right' })
    ry += 12
  }
  if (where) doc.text(fit(where, contentW * 0.55, 9), right, ry, { size: 9, color: MUTED, align: 'right' })

  y += logoH + 10
  // Two-colour rule, the logo's blue running into its orange.
  doc.rect(MARGIN, y, contentW * 0.78, 3, { fill: BLUE })
  doc.rect(MARGIN + contentW * 0.78, y, contentW * 0.22, 3, { fill: ORANGE })
  y += 20

  /* ---- Title and what the list holds ---- */
  doc.text(info.title, MARGIN, y, { size: 16, weight: 'bold', color: NAVY })
  doc.text(`Generated on ${stamp(now)}`, right, y, { size: 8.5, color: MUTED, align: 'right' })
  y += 8

  const meta = [...(info.meta ?? []), { label: 'Total Records', value: rows.length }].filter(
    (m) => cellText(m.value) !== '',
  )
  if (meta.length) {
    y += 8
    // Label/value pairs in a light band, flowing onto more lines as needed.
    const items = meta.map((m) => ({ label: `${m.label}: `, value: cellText(m.value) }))
    const lines: { label: string; value: string }[][] = [[]]
    let lineW = 0
    for (const it of items) {
      const w = measureText(it.label, 8.5, 'bold') + measureText(it.value, 8.5) + 22
      if (lineW + w > contentW - 16 && lines[lines.length - 1].length) {
        lines.push([])
        lineW = 0
      }
      lines[lines.length - 1].push(it)
      lineW += w
    }
    const bandH = lines.length * 13 + 9
    doc.rect(MARGIN, y, contentW, bandH, { fill: BAND })
    let ly = y + 15
    for (const line of lines) {
      let lx = MARGIN + 8
      for (const it of line) {
        doc.text(it.label, lx, ly, { size: 8.5, weight: 'bold', color: BODY })
        lx += measureText(it.label, 8.5, 'bold')
        const v = fit(it.value, contentW - (lx - MARGIN) - 8, 8.5)
        doc.text(v, lx, ly, { size: 8.5, color: INK })
        lx += measureText(v, 8.5) + 22
      }
      ly += 13
    }
    y += bandH
  }
  y += 12

  /* ---- Headline figure boxes ---- */
  const cards = extras.cards ?? []
  if (cards.length) {
    const gap = 10
    const boxW = (contentW - gap * (cards.length - 1)) / cards.length
    const boxH = 50
    cards.forEach((card, i) => {
      const x = MARGIN + i * (boxW + gap)
      const lead = i === 0
      doc.rect(x, y, boxW, boxH, lead ? { fill: NAVY } : { fill: WHITE, stroke: RULE, width: 0.8 })
      if (!lead) doc.rect(x, y, 3, boxH, { fill: ORANGE })
      doc.text(fit(card.label.toUpperCase(), boxW - 18, 7.5, true), x + 10, y + 14, {
        size: 7.5,
        weight: 'bold',
        color: lead ? rgb('#bfdbfe') : MUTED,
      })
      doc.text(fit(card.value, boxW - 18, 15, true), x + 10, y + 32, {
        size: 15,
        weight: 'bold',
        color: lead ? WHITE : INK,
      })
      if (card.hint) {
        doc.text(fit(card.hint, boxW - 18, 7.5), x + 10, y + 44, {
          size: 7.5,
          color: lead ? rgb('#dbeafe') : MUTED,
        })
      }
    })
    y += boxH + 16
  }

  /* ---- Small breakdown table ---- */
  const bd = extras.breakdown
  if (bd && bd.rows.length) {
    doc.text(bd.title, MARGIN, y + 2, { size: 10.5, weight: 'bold', color: NAVY })
    y += 9
    const bw = Math.min(contentW, 420)
    const colW = bw / bd.headers.length
    const al = bd.headers.map((_, i) => bd.align?.[i] ?? (i === 0 ? 'left' : 'right'))
    const tx = (i: number) =>
      al[i] === 'right' ? MARGIN + colW * (i + 1) - CELL_PAD : al[i] === 'center' ? MARGIN + colW * i + colW / 2 : MARGIN + colW * i + CELL_PAD
    doc.rect(MARGIN, y, bw, 18, { fill: BAND })
    bd.headers.forEach((h, i) => doc.text(h, tx(i), y + 12, { size: 8, weight: 'bold', color: BODY, align: al[i] }))
    y += 18
    bd.rows.forEach((row) => {
      row.forEach((cell, i) =>
        doc.text(fit(cell, colW - CELL_PAD * 2, FONT, i === 0), tx(i), y + 12, {
          size: FONT,
          weight: i === 0 ? 'bold' : 'normal',
          color: INK,
          align: al[i],
        }),
      )
      y += 17
      doc.line(MARGIN, y, MARGIN + bw, y, { color: RULE, width: 0.6 })
    })
    y += 18
  }

  if (extras.tableTitle) {
    doc.text(extras.tableTitle, MARGIN, y + 2, { size: 10.5, weight: 'bold', color: NAVY })
    y += 10
  }

  /* ---- Table ---- */
  const widths = columnWidths(allColumns, rows, contentW)
  const aligns = allColumns.map((c) => alignOf(c, rows))
  const xs: number[] = []
  widths.reduce((x, w, i) => {
    xs[i] = x
    return x + w
  }, MARGIN)

  const drawHeader = () => {
    const heads = allColumns.map((c, i) => doc.wrapText(c.header, widths[i] - CELL_PAD * 2, HEAD_FONT, 'bold'))
    const hH = Math.max(...heads.map((l) => l.length)) * LINE + 10
    doc.rect(MARGIN, y, contentW, hH, { fill: NAVY })
    heads.forEach((lines, i) => {
      lines.forEach((ln, k) => {
        const tx = aligns[i] === 'right' ? xs[i] + widths[i] - CELL_PAD : aligns[i] === 'center' ? xs[i] + widths[i] / 2 : xs[i] + CELL_PAD
        doc.text(ln, tx, y + 13 + k * LINE, { size: HEAD_FONT, weight: 'bold', color: WHITE, align: aligns[i] })
      })
    })
    y += hH
  }

  if (rows.length === 0) {
    drawHeader()
    doc.text('No records to show.', MARGIN + contentW / 2, y + 22, { size: 10, color: MUTED, align: 'center' })
  } else {
    drawHeader()
    rows.forEach((row, r) => {
      const cells = allColumns.map((col, i) => {
        const text = cellText(col.value(row, r))
        const inner = widths[i] - CELL_PAD * 2
        // Long text wraps (at most 4 lines) rather than running into the next column.
        const lines = doc.wrapText(text, inner, FONT)
        if (lines.length > 4) {
          lines.length = 4
          lines[3] = fit(`${lines[3]}...`, inner, FONT)
        }
        return lines.length ? lines : ['']
      })
      const rowH = Math.max(...cells.map((l) => l.length)) * LINE + 8

      if (y + rowH > bottom) {
        doc.addPage()
        y = MARGIN
        drawHeader()
      }

      if (r % 2 === 1) doc.rect(MARGIN, y, contentW, rowH, { fill: ZEBRA })
      cells.forEach((lines, i) => {
        lines.forEach((ln, k) => {
          const tx = aligns[i] === 'right' ? xs[i] + widths[i] - CELL_PAD : aligns[i] === 'center' ? xs[i] + widths[i] / 2 : xs[i] + CELL_PAD
          doc.text(ln, tx, y + 12 + k * LINE, { size: FONT, color: i === 0 && info.includeIndex ? MUTED : INK, align: aligns[i] })
        })
      })
      y += rowH
      doc.line(MARGIN, y, MARGIN + contentW, y, { color: RULE, width: 0.6 })
    })

    // The bold total under the last row, e.g. "Total Collected ... Rs. 45,000".
    const totals = extras.totals
    if (totals) {
      const tH = 22
      if (y + tH > bottom) {
        doc.addPage()
        y = MARGIN
        drawHeader()
      }
      doc.rect(MARGIN, y, contentW, tH, { fill: rgb('#e0ecff') })
      doc.line(MARGIN, y, MARGIN + contentW, y, { color: BLUE, width: 1.2 })
      // Totals are printed in full — never cut short — even if one spills a
      // little into the column beside it; the label moves left to make room.
      let labelRight = MARGIN + contentW / 2
      const placed: { text: string; x: number; align: ColumnAlign }[] = []
      allColumns.forEach((col, i) => {
        const v = totals.values[col.header]
        if (v === undefined) return
        const w = measureText(v, 9, 'bold')
        const x = aligns[i] === 'right' ? xs[i] + widths[i] - CELL_PAD : aligns[i] === 'center' ? xs[i] + widths[i] / 2 : xs[i] + CELL_PAD
        const left = aligns[i] === 'right' ? x - w : aligns[i] === 'center' ? x - w / 2 : x
        if (!placed.length) labelRight = Math.min(xs[i] - CELL_PAD, left - 12)
        placed.push({ text: v, x, align: aligns[i] })
      })
      doc.text(fit(totals.label, labelRight - MARGIN - CELL_PAD, 9, true), labelRight, y + 14.5, {
        size: 9,
        weight: 'bold',
        color: NAVY,
        align: 'right',
      })
      for (const p of placed) {
        doc.text(p.text, p.x, y + 14.5, { size: 9, weight: 'bold', color: NAVY, align: p.align })
      }
      y += tH
    }
  }

  /* ---- Footer on every page ---- */
  doc.forEachPage((page, count) => {
    const fy = H - MARGIN + 6
    doc.line(MARGIN, fy - 12, W - MARGIN, fy - 12, { color: RULE, width: 0.6 })
    const left = [garage, info.title].filter(Boolean).join('  -  ')
    doc.text(left, MARGIN, fy, { size: 8, color: MUTED })
    doc.text('Generated by GaragePilot', W / 2, fy, { size: 8, color: MUTED, align: 'center' })
    doc.text(`Page ${page} of ${count}`, W - MARGIN, fy, { size: 8, color: MUTED, align: 'right' })
  })

  return doc.blob()
}

/** `vehicles-2026-11-26.pdf` */
export function datedPdfName(base: string, date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${base}-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.pdf`
}

/** Builds the branded PDF and hands it to the browser as a download. */
export async function downloadPdfReport<T>(
  fileName: string,
  info: ReportInfo,
  columns: ExportColumn<T>[],
  rows: T[],
  owner: ReportOwner | null,
  extras: PdfReportExtras = {},
): Promise<void> {
  const logo = await loadLogo()
  downloadPdf(fileName, buildPdfReport(info, columns, rows, owner, logo, new Date(), extras))
}
