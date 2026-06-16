import type { ManualLedgerRow, ManualLedgerTotals, LoanSector } from './types'

export const LEDGER_SECTOR_LABELS: Record<LoanSector, string> = {
  COFFEE: 'Coffee',
  GENERAL_TRADE: 'General Trade',
  CONSTRUCTION: 'Construction',
  REAL_ESTATE: 'Real Estate',
  TENDERS: 'Tenders',
  HOSPITALITY: 'Hospitality',
}

type Align = 'left' | 'right'

interface LedgerColumn {
  header: string
  align: Align
  /** Whether the column carries a numeric total in the totals row. */
  totalKey?: keyof ManualLedgerTotals
  value: (row: ManualLedgerRow) => string | number
}

const dash = (value: number | null | undefined) =>
  value === null || value === undefined ? '' : value

const dashText = (value: string | null | undefined) =>
  value === null || value === undefined ? '' : value

export const LEDGER_COLUMNS: LedgerColumn[] = [
  { header: 'No.', align: 'left', value: (row) => row.no },
  { header: 'Loan Number', align: 'left', value: (row) => row.loanNumber },
  { header: 'Customer Name', align: 'left', value: (row) => row.customerName },
  {
    header: 'Sector',
    align: 'left',
    value: (row) => (row.sector ? LEDGER_SECTOR_LABELS[row.sector] : ''),
  },
  { header: 'Loan Approved', align: 'right', totalKey: 'loanApproved', value: (row) => row.loanApproved },
  { header: 'Disbursed', align: 'right', totalKey: 'disbursedAmount', value: (row) => dash(row.disbursedAmount) },
  { header: 'Outstanding', align: 'right', totalKey: 'outstanding', value: (row) => row.outstanding },
  { header: 'Disbursement Date', align: 'left', value: (row) => dashText(row.disbursementDate) },
  { header: 'Period (Months)', align: 'right', value: (row) => row.periodMonths },
  { header: 'Interest Rate (%)', align: 'right', value: (row) => row.interestRate },
  {
    header: 'Total Interest',
    align: 'right',
    totalKey: 'totalInterestToBeEarned',
    value: (row) => dash(row.totalInterestToBeEarned),
  },
  { header: 'Interest Received', align: 'right', totalKey: 'interestReceived', value: (row) => row.interestReceived },
  { header: 'Principal Recovered', align: 'right', totalKey: 'principalRecovered', value: (row) => row.principalRecovered },
]

export interface LedgerPeriod {
  from?: string
  to?: string
}

function periodLabel(period?: LedgerPeriod) {
  if (!period?.from && !period?.to) return 'All dates'
  if (period.from && period.to) return `${period.from} → ${period.to}`
  if (period.from) return `From ${period.from}`
  return `Up to ${period.to}`
}

function fileBaseName(sectorLabel?: string, period?: LedgerPeriod) {
  const generatedAt = new Date().toISOString().slice(0, 10)
  const scope = sectorLabel ? `-${sectorLabel.replace(/\s+/g, '-').toLowerCase()}` : ''
  const range =
    period?.from || period?.to ? `-${period.from ?? 'start'}_${period.to ?? 'end'}` : ''
  return `loans-report${scope}${range}-${generatedAt}`
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function exportLedgerToExcel(
  rows: ManualLedgerRow[],
  totals: ManualLedgerTotals,
  sectorLabel?: string,
  period?: LedgerPeriod
) {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.created = new Date()
  const sheet = workbook.addWorksheet('Loans Report')

  const metaRow = sheet.addRow([
    `Sector: ${sectorLabel ?? 'All sectors'}    Period: ${periodLabel(period)}`,
  ])
  metaRow.font = { italic: true, color: { argb: 'FF888888' } }
  sheet.addRow([])

  const headerRow = sheet.addRow(LEDGER_COLUMNS.map((column) => column.header))
  headerRow.font = { bold: true }
  headerRow.alignment = { vertical: 'middle' }

  rows.forEach((row) => {
    sheet.addRow(LEDGER_COLUMNS.map((column) => column.value(row)))
  })

  const totalsRow = sheet.addRow(
    LEDGER_COLUMNS.map((column, index) =>
      index === 0 ? 'Totals' : column.totalKey ? totals[column.totalKey] : ''
    )
  )
  totalsRow.font = { bold: true }

  LEDGER_COLUMNS.forEach((column, index) => {
    const sheetColumn = sheet.getColumn(index + 1)
    sheetColumn.alignment = { horizontal: column.align }
    sheetColumn.width = Math.max(column.header.length + 2, 14)
    if (column.totalKey || column.align === 'right') {
      sheetColumn.numFmt = '#,##0.##'
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  triggerDownload(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `${fileBaseName(sectorLabel, period)}.xlsx`
  )
}

export async function exportLedgerToPdf(
  rows: ManualLedgerRow[],
  totals: ManualLedgerTotals,
  sectorLabel?: string,
  period?: LedgerPeriod
) {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const autoTable = autoTableModule.default

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  doc.setFontSize(14)
  doc.text('Loans Report', 40, 40)
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text(
    `Sector: ${sectorLabel ?? 'All sectors'}    Period: ${periodLabel(period)}    Generated: ${new Date().toLocaleString('en-RW')}`,
    40,
    58
  )

  const fmt = (value: string | number) =>
    typeof value === 'number' ? value.toLocaleString('en-RW', { maximumFractionDigits: 2 }) : value

  autoTable(doc, {
    startY: 72,
    head: [LEDGER_COLUMNS.map((column) => column.header)],
    body: rows.map((row) => LEDGER_COLUMNS.map((column) => fmt(column.value(row)))),
    foot: [
      LEDGER_COLUMNS.map((column, index) =>
        index === 0 ? 'Totals' : column.totalKey ? fmt(totals[column.totalKey]) : ''
      ),
    ],
    styles: { fontSize: 7, cellPadding: 3 },
    headStyles: { fillColor: [54, 224, 123], textColor: 20 },
    footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: 'bold' },
    columnStyles: LEDGER_COLUMNS.reduce(
      (acc, column, index) => ({
        ...acc,
        [index]: { halign: column.align },
      }),
      {} as Record<number, { halign: Align }>
    ),
  })

  doc.save(`${fileBaseName(sectorLabel, period)}.pdf`)
}

/** Sums export rows into a totals row — used when a date range narrows the set. */
export function computeLedgerTotals(rows: ManualLedgerRow[]): ManualLedgerTotals {
  return rows.reduce<ManualLedgerTotals>(
    (acc, row) => ({
      loanApproved: acc.loanApproved + row.loanApproved,
      disbursedAmount: acc.disbursedAmount + (row.disbursedAmount ?? 0),
      outstanding: acc.outstanding + row.outstanding,
      totalInterestToBeEarned: acc.totalInterestToBeEarned + (row.totalInterestToBeEarned ?? 0),
      interestReceived: acc.interestReceived + row.interestReceived,
      principalRecovered: acc.principalRecovered + row.principalRecovered,
    }),
    {
      loanApproved: 0,
      disbursedAmount: 0,
      outstanding: 0,
      totalInterestToBeEarned: 0,
      interestReceived: 0,
      principalRecovered: 0,
    }
  )
}

/** Keeps rows whose disbursementDate falls within [from, to] (inclusive, open-ended). */
export function filterRowsByPeriod(rows: ManualLedgerRow[], period?: LedgerPeriod) {
  if (!period?.from && !period?.to) return rows
  return rows.filter((row) => {
    if (!row.disbursementDate) return false
    if (period.from && row.disbursementDate < period.from) return false
    if (period.to && row.disbursementDate > period.to) return false
    return true
  })
}
