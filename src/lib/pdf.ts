/**
 * A minimal PDF writer — enough of the format to lay out a printed document:
 * text in the three standard Helvetica faces, filled and stroked rectangles,
 * rules, and as many pages as the content runs to.
 *
 * The file is written by hand, the same way `excel.ts` writes a workbook, so
 * printing a document costs the app no dependency. Nothing is compressed and
 * no font is embedded: the fourteen standard faces are in every reader, which
 * is what keeps a page of text down to a few kilobytes of plain ASCII.
 *
 * Everything here is measured in points, and every `y` is measured **down from
 * the top of the page** — PDF itself counts up from the bottom, which is no way
 * to write a layout. The flip happens at the edge, in `toPdfY`.
 */

/** A4, the size every garage's printer is loaded with. */
export const PAGE_WIDTH = 595.28
export const PAGE_HEIGHT = 841.89

/** `0`–`1` per channel, as PDF's own colour operators take them. */
export interface Rgb {
  r: number
  g: number
  b: number
}

export const BLACK: Rgb = { r: 0, g: 0, b: 0 }

export type FontWeight = 'normal' | 'bold' | 'italic'

export interface TextOptions {
  size?: number
  weight?: FontWeight
  color?: Rgb
  /** `x` is the left edge, the centre, or the right edge accordingly. */
  align?: 'left' | 'center' | 'right'
}

export interface LineOptions {
  width?: number
  color?: Rgb
}

export interface RectOptions {
  fill?: Rgb
  stroke?: Rgb
  /** Stroke width; ignored without a `stroke`. */
  width?: number
}

const WEIGHTS: FontWeight[] = ['normal', 'bold', 'italic']

/** The resource name each face is drawn with inside a content stream. */
const FONT_KEYS: Record<FontWeight, string> = {
  normal: 'F1',
  bold: 'F2',
  italic: 'F3',
}

const FONT_NAMES: Record<FontWeight, string> = {
  normal: 'Helvetica',
  bold: 'Helvetica-Bold',
  italic: 'Helvetica-Oblique',
}

/**
 * Advance widths for ASCII 32–126, in 1/1000 em, taken from the standard
 * Helvetica and Helvetica-Bold metrics. Without them nothing could be centred,
 * right-aligned or wrapped: the reader knows these widths, and a page laid out
 * against a guess at them comes out ragged.
 */
const HELVETICA_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
]

const HELVETICA_BOLD_WIDTHS = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
]

/** Anything outside the table — an accented letter — measures as an `n`. */
const DEFAULT_WIDTH = 556

/**
 * What the standard faces cannot draw, written the way it is read instead.
 * The rupee sign is the one that matters: it is not in WinAnsiEncoding at all,
 * so an invoice that printed it would print a blank box against every figure.
 */
const REPLACEMENTS: [RegExp, string][] = [
  [/₹\s?/g, 'Rs. '],
  [/[‘’‛]/g, "'"],
  [/[“”]/g, '"'],
  [/[–—]/g, '-'],
  [/…/g, '...'],
  [/·/g, '-'],
  [/•/g, '-'],
]

/**
 * The text as the standard faces can actually set it: the characters they do
 * not carry rewritten, and anything left outside Latin-1 dropped rather than
 * written out as a byte that would be read as some other letter entirely.
 */
export function pdfText(value: string): string {
  let text = value ?? ''
  for (const [pattern, replacement] of REPLACEMENTS) text = text.replace(pattern, replacement)
  // eslint-disable-next-line no-control-regex
  return text
    .replace(/[\u0000-\u001F\u007F-\u00A0]/g, ' ')
    .replace(/[^\u0020-\u00FF]/g, '')
}

/** The width of a string, in points, once it is set at `size`. */
export function measureText(value: string, size: number, weight: FontWeight = 'normal'): number {
  const widths = weight === 'bold' ? HELVETICA_BOLD_WIDTHS : HELVETICA_WIDTHS
  let total = 0

  for (const char of pdfText(value)) {
    const code = char.charCodeAt(0)
    const width = code >= 32 && code <= 126 ? widths[code - 32] : DEFAULT_WIDTH
    total += width
  }

  return (total * size) / 1000
}

/**
 * The string as a PDF literal: the three characters that would end it early
 * escaped, and everything above ASCII written as an octal byte so the file
 * stays plain 7-bit text whatever is in the name of a garage.
 */
function pdfString(value: string): string {
  let out = ''

  for (const char of pdfText(value)) {
    const code = char.charCodeAt(0)
    if (char === '\\' || char === '(' || char === ')') out += `\\${char}`
    else if (code > 126) out += `\\${code.toString(8).padStart(3, '0')}`
    else out += char
  }

  return out
}

/** Trailing zeroes make a content stream twice the size it needs to be. */
function num(value: number): string {
  return String(Math.round(value * 100) / 100)
}

function colorOp(color: Rgb, stroke: boolean): string {
  return `${num(color.r)} ${num(color.g)} ${num(color.b)} ${stroke ? 'RG' : 'rg'}`
}

/**
 * One document being written out. Draw onto it top-down, call `addPage` when
 * the room runs out, and `blob` when it is finished.
 */
export class PdfDocument {
  readonly width = PAGE_WIDTH
  readonly height = PAGE_HEIGHT

  /** Every page's drawing operators, in order. */
  private readonly pages: string[][] = [[]]

  /** The page being drawn on — the last one, except inside `forEachPage`. */
  private active = 0

  private get current(): string[] {
    return this.pages[this.active]
  }

  /** How many pages the document has run to — for a `Page 1 of 3` footer. */
  get pageCount(): number {
    return this.pages.length
  }

  addPage(): void {
    this.pages.push([])
    this.active = this.pages.length - 1
  }

  /**
   * Draws onto each page in turn, once the document is otherwise finished.
   * A footer cannot say `Page 1 of 3` while it is being laid out — how many
   * pages there are is only known after the last of the content is placed —
   * so it is stamped on at the end, from here.
   */
  forEachPage(draw: (page: number, count: number) => void): void {
    const restore = this.active
    this.pages.forEach((_, index) => {
      this.active = index
      draw(index + 1, this.pages.length)
    })
    this.active = restore
  }

  /** PDF counts up from the bottom of the page; this layout counts down. */
  private toPdfY(y: number): number {
    return this.height - y
  }

  text(value: string, x: number, y: number, options: TextOptions = {}): void {
    const body = pdfText(value)
    if (!body.trim()) return

    const size = options.size ?? 10
    const weight = options.weight ?? 'normal'
    const color = options.color ?? BLACK

    let left = x
    if (options.align === 'right') left = x - measureText(body, size, weight)
    else if (options.align === 'center') left = x - measureText(body, size, weight) / 2

    this.current.push(
      `BT ${colorOp(color, false)} /${FONT_KEYS[weight]} ${num(size)} Tf ` +
        `1 0 0 1 ${num(left)} ${num(this.toPdfY(y))} Tm (${pdfString(body)}) Tj ET`,
    )
  }

  line(x1: number, y1: number, x2: number, y2: number, options: LineOptions = {}): void {
    this.current.push(
      `${colorOp(options.color ?? BLACK, true)} ${num(options.width ?? 0.5)} w ` +
        `${num(x1)} ${num(this.toPdfY(y1))} m ${num(x2)} ${num(this.toPdfY(y2))} l S`,
    )
  }

  /** `y` is the top edge, and the rectangle is drawn downwards from it. */
  rect(x: number, y: number, width: number, height: number, options: RectOptions = {}): void {
    const shape = `${num(x)} ${num(this.toPdfY(y + height))} ${num(width)} ${num(height)} re`

    if (options.fill) this.current.push(`${colorOp(options.fill, false)} ${shape} f`)
    if (options.stroke) {
      this.current.push(
        `${colorOp(options.stroke, true)} ${num(options.width ?? 0.5)} w ${shape} S`,
      )
    }
  }

  /**
   * The text broken into lines that each fit `maxWidth`, breaking on spaces
   * where it can and mid-word where a single word is longer than the column.
   */
  wrapText(
    value: string,
    maxWidth: number,
    size: number,
    weight: FontWeight = 'normal',
  ): string[] {
    const words = pdfText(value).split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let line = ''

    const pushBrokenWord = (word: string) => {
      let part = ''
      for (const char of word) {
        if (part && measureText(part + char, size, weight) > maxWidth) {
          lines.push(part)
          part = char
        } else {
          part += char
        }
      }
      line = part
    }

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word

      if (measureText(candidate, size, weight) <= maxWidth) {
        line = candidate
        continue
      }

      if (line) lines.push(line)
      line = ''
      if (measureText(word, size, weight) > maxWidth) pushBrokenWord(word)
      else line = word
    }

    if (line) lines.push(line)
    return lines
  }

  /** The whole document, as the bytes of a `.pdf` file. */
  blob(): Blob {
    return new Blob([this.bytes()] as BlobPart[], { type: 'application/pdf' })
  }

  /**
   * The file itself: the object tree, then the cross-reference table that
   * points at each object by its byte offset — which is why every part is
   * measured as it is appended rather than joined at the end.
   */
  private bytes(): Uint8Array {
    const objects: string[] = []
    const pageCount = this.pages.length

    // 1 catalog, 2 page tree, 3–5 the fonts, then a page and a content stream
    // for each page of the document.
    const fontId = (weight: FontWeight) => 3 + WEIGHTS.indexOf(weight)
    const firstPageId = 3 + WEIGHTS.length
    const pageId = (index: number) => firstPageId + index * 2
    const streamId = (index: number) => pageId(index) + 1

    const kids = this.pages.map((_, index) => `${pageId(index)} 0 R`).join(' ')
    const fonts = WEIGHTS.map((weight) => `/${FONT_KEYS[weight]} ${fontId(weight)} 0 R`).join(' ')
    const resources = `<< /Font << ${fonts} >> >>`

    objects.push('<< /Type /Catalog /Pages 2 0 R >>')
    objects.push(`<< /Type /Pages /Kids [ ${kids} ] /Count ${pageCount} >>`)

    for (const weight of WEIGHTS) {
      objects.push(
        `<< /Type /Font /Subtype /Type1 /BaseFont /${FONT_NAMES[weight]} /Encoding /WinAnsiEncoding >>`,
      )
    }

    this.pages.forEach((ops, index) => {
      const content = ops.join('\n')
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 ${num(this.width)} ${num(this.height)} ] ` +
          `/Resources ${resources} /Contents ${streamId(index)} 0 R >>`,
      )
      objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
    })

    let file = '%PDF-1.4\n'
    const offsets: number[] = []

    objects.forEach((body, index) => {
      offsets.push(file.length)
      file += `${index + 1} 0 obj\n${body}\nendobj\n`
    })

    const xref = file.length
    file += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    for (const offset of offsets) file += `${String(offset).padStart(10, '0')} 00000 n \n`
    file += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`

    // Every character written above is a single byte, which is what lets the
    // offsets be counted in string length.
    const bytes = new Uint8Array(file.length)
    for (let i = 0; i < file.length; i += 1) bytes[i] = file.charCodeAt(i) & 0xff
    return bytes
  }
}

/** Builds the file and hands it to the browser as a download. */
export function downloadPdf(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Revoked on the next tick so the click has definitely been handled.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
