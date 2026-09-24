/**
 * The receipt a garage hands the buyer of a used car, as a PDF.
 *
 * It holds the deal and every rupee paid against it: who sold the car to whom,
 * which car it was, the price it went for, each receipt with what was left
 * owing after it, and the balance. Laid out with the job card invoice's own
 * building blocks, so the two documents look like they come from one garage,
 * and built in the browser without the API being involved.
 */

import { formatAmount } from '@/lib/jobCard'
import { formatDayMonthYear } from '@/lib/utils'
import { downloadPdf } from '@/lib/pdf'
import {
  FOOTER_HEIGHT,
  InvoiceLayout,
  day,
  detailBoxHeight,
  drawDetailBox,
  drawFooters,
  drawHeader,
  drawMetaStrip,
  drawTableHead,
  drawTableRow,
  drawTotals,
  moment,
  value,
} from '@/lib/invoice'
import type { DetailRow, InvoiceGarage, TableColumn } from '@/lib/invoice'
import { deliveredStatusLabel, paymentStatusLabel, soldCarTitle } from '@/lib/carSold'
import type { CarSoldCustomerRecord, CarSoldPayment, SoldCarRecord } from '@/types/carSold'

export interface CarSaleReceiptInput {
  garage: InvoiceGarage
  /** A sold car with its sale — one row of the sold list. */
  car: SoldCarRecord
  /** Stamped in the footer. Now, unless a caller is testing it. */
  generatedAt?: Date
}

const PAYMENT_COLUMNS: TableColumn[] = [
  { header: 'Sr.', width: 40, align: 'center' },
  { header: 'Received On', width: 215 },
  { header: 'Amount (Rs.)', width: 130, align: 'right' },
  { header: 'Balance (Rs.)', width: 130, align: 'right' },
]

/** Each receipt, oldest first, with what was still owing once it was taken. */
function paymentsWithBalance(
  payments: CarSoldPayment[],
  price: number,
): { payment: CarSoldPayment; balanceAfter: number }[] {
  const ordered = [...payments].sort(
    (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
  )

  let owing = price
  return ordered.map((payment) => {
    owing = Math.max(0, owing - payment.paymentAmount)
    return { payment, balanceAfter: owing }
  })
}

/** The buyer on the left, the car on the right, matched in height. */
function drawParties(layout: InvoiceLayout, car: SoldCarRecord, sale: CarSoldCustomerRecord): void {
  const buyerRows: DetailRow[] = [
    { label: 'Mobile', value: value(sale.purchaseOwnerMobileNo) },
    { label: 'Address', value: value(sale.purchaseOwnerAddress) },
  ]

  const carRows: DetailRow[] = [
    { label: 'Car', value: value(soldCarTitle(car)) },
    { label: 'Year', value: value(car.yearOfVehicle) },
    { label: 'Sold By', value: value(car.ownerName) },
    { label: 'Seller Mobile', value: value(car.mobileNumber) },
  ]

  const buyerHeight = detailBoxHeight(buyerRows)
  const carHeight = detailBoxHeight(carRows)
  const height = Math.max(buyerHeight, carHeight)
  layout.ensure(height + 16)

  const gap = 15
  const width = (layout.contentWidth - gap) / 2

  drawDetailBox(
    layout,
    layout.leftEdge,
    width,
    'Buyer',
    value(sale.purchaseOwnerName),
    buyerRows,
    buyerHeight,
  )
  drawDetailBox(
    layout,
    layout.leftEdge + width + gap,
    width,
    'Car',
    value(car.carNumber),
    carRows,
    carHeight,
  )

  layout.cursor += height + 16
}

/** Every receipt, with the page turned under the table where it runs on. */
function drawPayments(layout: InvoiceLayout, sale: CarSoldCustomerRecord): void {
  const { doc } = layout
  const rows = paymentsWithBalance(sale.payments ?? [], sale.finalSellingPrice)

  layout.sectionTitle('Payments Received')
  layout.ensure(60)
  drawTableHead(layout, PAYMENT_COLUMNS)

  if (rows.length === 0) {
    drawTableRow(layout, PAYMENT_COLUMNS, [[], ['No payment has been recorded yet.'], [], []])
    layout.cursor += 14
    return
  }

  rows.forEach(({ payment, balanceAfter }, index) => {
    // A row that would be split across the page break is moved down whole,
    // and the header goes with it so the columns are still named.
    if (layout.cursor + 20 > doc.height - FOOTER_HEIGHT) {
      layout.ensure(42)
      drawTableHead(layout, PAYMENT_COLUMNS)
    }

    drawTableRow(
      layout,
      PAYMENT_COLUMNS,
      [
        [String(index + 1)],
        [moment(payment.createdDate)],
        [formatAmount(payment.paymentAmount)],
        [balanceAfter > 0 ? formatAmount(balanceAfter) : 'Settled'],
      ],
      { zebra: index % 2 === 1 },
    )
  })

  layout.cursor += 14
}

/**
 * The receipt, as the bytes of a `.pdf` file. A car marked sold without a
 * buyer has no sale to put on one, and is refused.
 */
export function buildCarSaleReceiptPdf(input: CarSaleReceiptInput): Blob {
  const { car } = input
  const sale = car.soldCustomerDetail
  if (!sale) throw new Error('This car has no sale recorded to make a receipt for.')

  const generatedAt = input.generatedAt ?? new Date()
  const layout = new InvoiceLayout(`Receipt ${value(car.carNumber)}`)

  drawHeader(layout, input.garage, paymentStatusLabel(sale), 'RECEIPT')
  drawMetaStrip(layout, [
    { label: 'Car Number', value: value(car.carNumber) },
    { label: 'Sold On', value: day(sale.createdAt ?? car.createdAt) },
    { label: 'Delivery', value: deliveredStatusLabel(sale.deliveredStatus) },
    { label: 'Delivered On', value: day(sale.deliveredDate) },
  ])
  drawParties(layout, car, sale)
  drawTotals(
    layout,
    {
      total: sale.finalSellingPrice,
      paid: sale.paidAmount,
      balance: Math.max(0, sale.remainingAmount),
    },
    {
      totalLabel: 'Final Selling Price',
      dueNote: (balance) => `${balance} is still to be paid on this car.`,
      settledNote: 'This car is fully paid for. Thank you for your purchase.',
    },
  )
  drawPayments(layout, sale)
  drawFooters(layout, input.garage, generatedAt, 'receipt')

  return layout.doc.blob()
}

/** `receipt-GJ01AB1234.pdf`, or the date where a car has no number. */
export function carSaleReceiptFileName(
  carNumber: string | null | undefined,
  at: Date = new Date(),
): string {
  const safe = (carNumber ?? '').trim().replace(/[^A-Za-z0-9-]+/g, '-').replace(/^-|-$/g, '')
  return `receipt-${safe || formatDayMonthYear(at)}.pdf`
}

/** Builds the receipt and hands it to the browser as a download. */
export function downloadCarSaleReceipt(input: CarSaleReceiptInput): void {
  downloadPdf(carSaleReceiptFileName(input.car.carNumber), buildCarSaleReceiptPdf(input))
}
