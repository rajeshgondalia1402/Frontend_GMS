/**
 * The invoice a garage hands over with the vehicle, as a PDF.
 *
 * One document holds everything the customer could ask about the bill: who
 * made it out, who it is for, which vehicle was worked on, what was billed
 * line by line, and every payment taken against it with the balance that was
 * left after each. It is drawn with `pdf.ts`, so it costs no dependency and
 * downloads straight from the browser without the API being involved.
 */

import { formatAmount, formatMoney, vehicleDisplayName } from '@/lib/jobCard'
import { paymentMethodLabel, paymentStatusLabel, paymentsWithBalance } from '@/lib/payment'
import { formatDayMonthYear } from '@/lib/utils'
import { PdfDocument, downloadPdf, measureText } from '@/lib/pdf'
import type { Rgb } from '@/lib/pdf'
import type { JobCardRecord } from '@/types/jobCard'
import type { JobCardMoney, PaymentRecord } from '@/types/payment'

/** The garage the invoice is made out by — the logged-in owner's own details. */
export interface InvoiceGarage {
  name?: string | null
  ownerName?: string | null
  mobile?: string | null
  email?: string | null
  city?: string | null
}

export interface InvoiceInput {
  garage: InvoiceGarage
  /** The card in full: its vehicle, that vehicle's customer, and its lines. */
  jobCard: JobCardRecord
  /** The settled money. The card's own total is used where it is missing. */
  money?: JobCardMoney | null
  /** Every live receipt on the card, in any order. */
  payments: PaymentRecord[]
  /** Stamped in the footer. Now, unless a caller is testing it. */
  generatedAt?: Date
}

/** `#1f4ef5` as PDF takes it — three channels of 0–1. */
function hex(value: string): Rgb {
  const n = parseInt(value.slice(1), 16)
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
  }
}

/** The screens' own palette, so the printed bill looks like the app. */
const INK = hex('#0f172a')
const BODY = hex('#1e293b')
const MUTED = hex('#64748b')
const LINE = hex('#e2e8f0')
const SOFT = hex('#f8fafc')
const PAPER = hex('#ffffff')
const BRAND = hex('#1f4ef5')
const PAID = hex('#047857')
const DUE = hex('#b91c1c')

const MARGIN = 40
const FOOTER_HEIGHT = 46

/** The column the values in a detail box are set against. */
const LABEL_WIDTH = 86

/** A dash reads as "asked for, not filled in"; an empty cell reads as a bug. */
const EMPTY = '-'

function value(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return EMPTY
  const text = String(raw).trim()
  return text || EMPTY
}

/** `05-Sept-2026` from anything the API dates a record with. */
function day(raw: string | null | undefined): string {
  if (!raw) return EMPTY
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? String(raw) : formatDayMonthYear(parsed)
}

/** `05-Sept-2026, 2:50 pm` — a receipt is a moment, not a day. */
function moment(raw: string | null | undefined): string {
  if (!raw) return EMPTY
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return String(raw)

  const time = parsed.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${formatDayMonthYear(parsed)}, ${time}`
}

/** One `Label  ....  Value` line inside a detail box. */
interface DetailRow {
  label: string
  value: string
}

/** A column of the items or payments table. */
interface TableColumn {
  header: string
  width: number
  align?: 'left' | 'center' | 'right'
}

const ITEM_COLUMNS: TableColumn[] = [
  { header: 'Sr.', width: 30, align: 'center' },
  { header: 'Description', width: 275 },
  { header: 'Qty', width: 45, align: 'center' },
  { header: 'Rate (Rs.)', width: 80, align: 'right' },
  { header: 'Amount (Rs.)', width: 85, align: 'right' },
]

const PAYMENT_COLUMNS: TableColumn[] = [
  { header: 'Sr.', width: 26, align: 'center' },
  { header: 'Received On', width: 125 },
  { header: 'Method', width: 90 },
  { header: 'Note', width: 129 },
  { header: 'Amount (Rs.)', width: 75, align: 'right' },
  { header: 'Balance (Rs.)', width: 70, align: 'right' },
]

/**
 * The invoice being laid out. The cursor walks down the page and asks for room
 * before each block; when a block will not fit, the page is turned under it.
 */
class InvoiceLayout {
  readonly doc = new PdfDocument()
  private y = MARGIN

  private readonly left = MARGIN
  private readonly right: number
  private readonly width: number

  constructor(private readonly title: string) {
    this.right = this.doc.width - MARGIN
    this.width = this.doc.width - MARGIN * 2
  }

  get cursor(): number {
    return this.y
  }

  set cursor(next: number) {
    this.y = next
  }

  get leftEdge(): number {
    return this.left
  }

  get rightEdge(): number {
    return this.right
  }

  get contentWidth(): number {
    return this.width
  }

  private get bottom(): number {
    return this.doc.height - FOOTER_HEIGHT
  }

  /** Turns the page when `height` will not fit under the cursor. */
  ensure(height: number): void {
    if (this.y + height <= this.bottom) return

    this.doc.addPage()
    this.y = MARGIN

    // A page on its own says nothing about which bill it belongs to.
    this.doc.text(`${this.title} (continued)`, this.left, this.y + 9, {
      size: 9,
      weight: 'bold',
      color: MUTED,
    })
    this.y += 22
  }

  /** A heading over a block, in the small caps the screens use. */
  sectionTitle(text: string): void {
    this.ensure(24)
    this.doc.text(text.toUpperCase(), this.left, this.y + 9, {
      size: 8.5,
      weight: 'bold',
      color: MUTED,
    })
    this.y += 16
  }
}

/** The band at the top: who the bill is from, and what it is. */
function drawHeader(layout: InvoiceLayout, input: InvoiceInput, paymentStatus: string): void {
  const { doc } = layout
  const height = 96

  doc.rect(0, 0, doc.width, height, { fill: INK })
  doc.rect(0, height, doc.width, 4, { fill: BRAND })

  const garageName = value(input.garage.name) === EMPTY ? 'Garage' : String(input.garage.name).trim()
  doc.text(garageName, layout.leftEdge, 40, { size: 20, weight: 'bold', color: PAPER })

  const owner = [input.garage.ownerName, input.garage.city]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
  if (owner) doc.text(owner, layout.leftEdge, 58, { size: 9.5, color: hex('#94a3b8') })

  const contact = [input.garage.mobile, input.garage.email]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join('   |   ')
  if (contact) doc.text(contact, layout.leftEdge, 74, { size: 9.5, color: hex('#cbd5e1') })

  doc.text('INVOICE', layout.rightEdge, 42, {
    size: 22,
    weight: 'bold',
    color: PAPER,
    align: 'right',
  })

  // The status is the first thing a customer looks for, so it is stamped up
  // here beside the title rather than left to the totals at the bottom.
  const label = paymentStatus.toUpperCase()
  const badgeWidth = measureText(label, 9, 'bold') + 18
  doc.rect(layout.rightEdge - badgeWidth, 54, badgeWidth, 18, { fill: BRAND })
  doc.text(label, layout.rightEdge - badgeWidth / 2, 66.5, {
    size: 9,
    weight: 'bold',
    color: PAPER,
    align: 'center',
  })

  layout.cursor = height + 22
}

/** The four figures that identify the bill, in one strip of cells. */
function drawMetaStrip(layout: InvoiceLayout, cells: DetailRow[]): void {
  const { doc } = layout
  const height = 44
  layout.ensure(height + 14)

  const top = layout.cursor
  doc.rect(layout.leftEdge, top, layout.contentWidth, height, { fill: SOFT, stroke: LINE })

  const cellWidth = layout.contentWidth / cells.length

  cells.forEach((cell, index) => {
    const x = layout.leftEdge + cellWidth * index
    if (index > 0) doc.line(x, top + 8, x, top + height - 8, { color: LINE })

    doc.text(cell.label.toUpperCase(), x + 12, top + 17, { size: 7.5, weight: 'bold', color: MUTED })
    doc.text(cell.value, x + 12, top + 33, { size: 10.5, weight: 'bold', color: INK })
  })

  layout.cursor = top + height + 14
}

/**
 * One titled box of `label: value` rows. Drawn to a height handed in from
 * outside so the pair of them line up whatever each holds.
 */
function drawDetailBox(
  layout: InvoiceLayout,
  x: number,
  width: number,
  title: string,
  heading: string,
  rows: DetailRow[],
  height: number,
): void {
  const { doc } = layout
  const top = layout.cursor

  doc.rect(x, top, width, height, { stroke: LINE })
  doc.rect(x, top, width, 20, { fill: SOFT })
  doc.line(x, top + 20, x + width, top + 20, { color: LINE })
  doc.text(title.toUpperCase(), x + 12, top + 13.5, { size: 8, weight: 'bold', color: MUTED })

  let y = top + 38
  doc.text(heading, x + 12, y, { size: 11.5, weight: 'bold', color: INK })
  y += 16

  // The values start on one line down the box rather than being pushed out
  // to its right edge, so a short answer and a long one begin together.
  const valueX = x + 12 + LABEL_WIDTH

  for (const row of rows) {
    doc.text(row.label, x + 12, y, { size: 9, color: MUTED })

    // A value too long for the room left is set a size down before it is
    // allowed to run over the border.
    const room = x + width - 12 - valueX
    const size = measureText(row.value, 9, 'bold') > room ? 8 : 9
    doc.text(row.value, valueX, y, { size, weight: 'bold', color: BODY })

    y += 14
  }
}

/** The height a detail box needs for its rows. */
function detailBoxHeight(rows: DetailRow[]): number {
  return 44 + 16 + rows.length * 14
}

/** The customer on the left, the vehicle on the right, matched in height. */
function drawParties(layout: InvoiceLayout, input: InvoiceInput): void {
  const vehicle = input.jobCard.vehicle
  const customer = vehicle?.customer

  const customerRows: DetailRow[] = [
    { label: 'Mobile', value: value(customer?.mobileNumber) },
    { label: 'WhatsApp', value: value(customer?.whatsappNumber ?? customer?.mobileNumber) },
    { label: 'Job Card No.', value: value(input.jobCard.jobNumber) },
    { label: 'Attended By', value: value(input.jobCard.assignedStaff?.name) },
  ]

  const vehicleRows: DetailRow[] = [
    { label: 'Vehicle', value: vehicle ? value(vehicleDisplayName(vehicle)) : EMPTY },
    { label: 'Vehicle Type', value: value(vehicle?.vehicleType) },
    { label: 'Fuel Type', value: value(vehicle?.fuelType) },
    { label: 'Colour', value: value(vehicle?.color) },
    {
      label: 'Current KM',
      value: vehicle?.currentKm ? `${vehicle.currentKm.toLocaleString('en-IN')} km` : EMPTY,
    },
    { label: 'Insurance Expiry', value: day(vehicle?.insuranceExpiry) },
  ]

  // Each box is as tall as what it holds — the customer's details are fewer
  // than the vehicle's, and a box padded out to match would be half white.
  const customerHeight = detailBoxHeight(customerRows)
  const vehicleHeight = detailBoxHeight(vehicleRows)
  const height = Math.max(customerHeight, vehicleHeight)
  layout.ensure(height + 16)

  const gap = 15
  const width = (layout.contentWidth - gap) / 2

  drawDetailBox(
    layout,
    layout.leftEdge,
    width,
    'Bill To',
    value(customer?.fullName),
    customerRows,
    customerHeight,
  )
  drawDetailBox(
    layout,
    layout.leftEdge + width + gap,
    width,
    'Vehicle',
    value(vehicle?.vehicleNumber),
    vehicleRows,
    vehicleHeight,
  )

  layout.cursor += height + 16
}

/** What the vehicle came in for, and who took it on. */
function drawJobDetails(layout: InvoiceLayout, input: InvoiceInput): void {
  const { doc } = layout
  const complaint = value(input.jobCard.vehicle?.description)

  const lines = doc.wrapText(complaint, layout.contentWidth - 24, 9.5)
  const height = 34 + Math.max(1, lines.length) * 13

  layout.ensure(height + 16)
  const top = layout.cursor

  doc.rect(layout.leftEdge, top, layout.contentWidth, height, { stroke: LINE })
  doc.text('COMPLAINT / WORK REQUESTED', layout.leftEdge + 12, top + 16, {
    size: 8,
    weight: 'bold',
    color: MUTED,
  })

  let y = top + 33
  for (const line of lines) {
    doc.text(line, layout.leftEdge + 12, y, { size: 9.5, color: BODY })
    y += 13
  }

  layout.cursor = top + height + 16
}

/** The header row of a table, repeated at the top of every page it runs onto. */
function drawTableHead(layout: InvoiceLayout, columns: TableColumn[]): void {
  const { doc } = layout
  const height = 22
  const top = layout.cursor

  doc.rect(layout.leftEdge, top, layout.contentWidth, height, { fill: INK })

  let x = layout.leftEdge
  for (const column of columns) {
    const align = column.align ?? 'left'
    const at = align === 'right' ? x + column.width - 8 : align === 'center' ? x + column.width / 2 : x + 8
    doc.text(column.header.toUpperCase(), at, top + 14.5, {
      size: 8,
      weight: 'bold',
      color: PAPER,
      align,
    })
    x += column.width
  }

  layout.cursor = top + height
}

/** One row of cells, each already reduced to the lines it prints as. */
function drawTableRow(
  layout: InvoiceLayout,
  columns: TableColumn[],
  cells: string[][],
  options: { zebra?: boolean; bold?: boolean } = {},
): void {
  const { doc } = layout
  const lines = Math.max(1, ...cells.map((cell) => cell.length))
  const height = 8 + lines * 12
  const top = layout.cursor

  if (options.zebra) doc.rect(layout.leftEdge, top, layout.contentWidth, height, { fill: SOFT })
  doc.line(layout.leftEdge, top + height, layout.rightEdge, top + height, { color: LINE })

  let x = layout.leftEdge
  columns.forEach((column, index) => {
    const align = column.align ?? 'left'
    const at = align === 'right' ? x + column.width - 8 : align === 'center' ? x + column.width / 2 : x + 8

    cells[index]?.forEach((line, row) => {
      doc.text(line, at, top + 14 + row * 12, {
        size: 9,
        weight: options.bold ? 'bold' : 'normal',
        color: BODY,
        align,
      })
    })

    x += column.width
  })

  layout.cursor = top + height
}

/** Every billed line, with the page turned under the table where it runs on. */
function drawItems(layout: InvoiceLayout, input: InvoiceInput): void {
  const { doc } = layout
  const items = input.jobCard.items ?? []

  layout.sectionTitle('Services / Items Billed')
  layout.ensure(60)
  drawTableHead(layout, ITEM_COLUMNS)

  if (items.length === 0) {
    drawTableRow(layout, ITEM_COLUMNS, [[], ['Nothing was billed on this job card.'], [], [], []])
  }

  items.forEach((item, index) => {
    const description = doc.wrapText(value(item.description), ITEM_COLUMNS[1].width - 16, 9)
    const height = 8 + Math.max(1, description.length) * 12

    // A row that would be split across the page break is moved down whole,
    // and the header goes with it so the columns are still named.
    if (layout.cursor + height > doc.height - FOOTER_HEIGHT) {
      layout.ensure(height + 22)
      drawTableHead(layout, ITEM_COLUMNS)
    }

    drawTableRow(
      layout,
      ITEM_COLUMNS,
      [
        [String(index + 1)],
        description,
        [String(item.qty)],
        [formatAmount(item.rate)],
        [formatAmount(item.total ?? item.qty * item.rate)],
      ],
      { zebra: index % 2 === 1 },
    )
  })

  layout.cursor += 14
}

/** What the work came to, what has come in, and what is still owed. */
function drawTotals(
  layout: InvoiceLayout,
  totals: { total: number; paid: number; balance: number },
): void {
  const { doc } = layout
  const width = 240
  const rowHeight = 18
  // Two lines of figures, a little air, then the balance band across the foot.
  const height = rowHeight * 2 + 38

  layout.ensure(height + 16)

  const top = layout.cursor
  const x = layout.rightEdge - width

  const row = (label: string, amount: string, y: number, color: Rgb, bold = false) => {
    doc.text(label, x + 12, y, { size: 9.5, weight: bold ? 'bold' : 'normal', color: MUTED })
    doc.text(amount, layout.rightEdge - 12, y, {
      size: 9.5,
      weight: 'bold',
      color,
      align: 'right',
    })
  }

  doc.rect(x, top, width, height, { fill: SOFT, stroke: LINE })
  row('Total Amount', formatMoney(totals.total), top + 18, INK)
  row('Amount Paid', formatMoney(totals.paid), top + 18 + rowHeight, PAID)

  const balanceTop = top + height - 30
  doc.rect(x, balanceTop, width, 30, { fill: totals.balance > 0 ? DUE : PAID })
  doc.text('Balance Due', x + 12, balanceTop + 19, { size: 10.5, weight: 'bold', color: PAPER })
  doc.text(formatMoney(totals.balance), layout.rightEdge - 12, balanceTop + 19, {
    size: 12,
    weight: 'bold',
    color: PAPER,
    align: 'right',
  })

  // The left of the block is otherwise empty page, so the sentence the desk
  // would say out loud goes there.
  const note =
    totals.balance > 0
      ? `${formatMoney(totals.balance)} is still to be collected on this job card.`
      : 'This bill is fully settled. Thank you for your business.'
  const noteWidth = layout.contentWidth - width - 20
  doc.wrapText(note, noteWidth, 9.5).forEach((line, index) => {
    doc.text(line, layout.leftEdge, top + 18 + index * 13, { size: 9.5, color: MUTED })
  })

  layout.cursor = top + height + 16
}

/** Every receipt, with what was left owing the moment it was taken. */
function drawPayments(layout: InvoiceLayout, input: InvoiceInput, total: number): void {
  const { doc } = layout
  const rows = paymentsWithBalance(input.payments ?? [], total)

  layout.sectionTitle('Payments Received')
  layout.ensure(60)
  drawTableHead(layout, PAYMENT_COLUMNS)

  if (rows.length === 0) {
    drawTableRow(layout, PAYMENT_COLUMNS, [[], ['No payment has been recorded yet.'], [], [], [], []])
    layout.cursor += 14
    return
  }

  rows.forEach(({ payment, balanceAfter }, index) => {
    const note = doc.wrapText(payment.note ?? '', PAYMENT_COLUMNS[3].width - 16, 9)
    const height = 8 + Math.max(1, note.length) * 12

    if (layout.cursor + height > doc.height - FOOTER_HEIGHT) {
      layout.ensure(height + 22)
      drawTableHead(layout, PAYMENT_COLUMNS)
    }

    drawTableRow(
      layout,
      PAYMENT_COLUMNS,
      [
        [String(index + 1)],
        [moment(payment.paymentDate)],
        [paymentMethodLabel(payment.paymentMethod)],
        note.length ? note : [EMPTY],
        [formatAmount(payment.amount)],
        [balanceAfter > 0 ? formatAmount(balanceAfter) : 'Settled'],
      ],
      { zebra: index % 2 === 1 },
    )
  })

  layout.cursor += 14
}

/** The same line at the foot of every page, once the last of them is drawn. */
function drawFooters(layout: InvoiceLayout, input: InvoiceInput, generatedAt: Date): void {
  const { doc } = layout
  const y = doc.height - 30

  doc.forEachPage((page, count) => {
    doc.line(layout.leftEdge, y - 12, layout.rightEdge, y - 12, { color: LINE })

    doc.text(
      `Computer generated invoice - ${value(input.garage.name)} - ${moment(generatedAt.toISOString())}`,
      layout.leftEdge,
      y,
      { size: 8, weight: 'italic', color: MUTED },
    )
    doc.text(`Page ${page} of ${count}`, layout.rightEdge, y, {
      size: 8,
      color: MUTED,
      align: 'right',
    })
  })
}

/** The invoice, as the bytes of a `.pdf` file. */
export function buildInvoicePdf(input: InvoiceInput): Blob {
  const generatedAt = input.generatedAt ?? new Date()
  const card = input.jobCard

  // The payment endpoint's figures are the settled ones; the card's own total
  // stands in where the invoice is built without them.
  const total = input.money?.totalAmount ?? card.totalAmount ?? 0
  const paid =
    input.money?.paidAmount ?? (input.payments ?? []).reduce((sum, p) => sum + p.amount, 0)
  const balance = Math.max(0, input.money?.remainingAmount ?? total - paid)
  const status = paymentStatusLabel(input.money?.paymentStatus ?? card.paymentStatus)

  const layout = new InvoiceLayout(`Invoice ${card.jobNumber}`)

  drawHeader(layout, input, status)
  drawMetaStrip(layout, [
    { label: 'Invoice / Job No.', value: value(card.jobNumber) },
    { label: 'Invoice Date', value: formatDayMonthYear(generatedAt) },
    { label: 'Service Date', value: day(card.serviceDate) },
    { label: 'Delivered On', value: day(card.completionDate) },
  ])
  drawParties(layout, input)
  drawJobDetails(layout, input)
  drawItems(layout, input)
  drawTotals(layout, { total, paid, balance })
  drawPayments(layout, input, total)
  drawFooters(layout, input, generatedAt)

  return layout.doc.blob()
}

/** `invoice-JC-2026-0004.pdf`, or the date where a card has no number. */
export function invoiceFileName(jobNumber: string | null | undefined, at: Date = new Date()): string {
  const safe = (jobNumber ?? '').trim().replace(/[^A-Za-z0-9-]+/g, '-').replace(/^-|-$/g, '')
  return `invoice-${safe || formatDayMonthYear(at)}.pdf`
}

/** Builds the invoice and hands it to the browser as a download. */
export function downloadInvoice(input: InvoiceInput): void {
  downloadPdf(invoiceFileName(input.jobCard.jobNumber), buildInvoicePdf(input))
}
