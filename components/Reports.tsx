'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import {
  computeLedgerTotals,
  exportLedgerToExcel,
  exportLedgerToPdf,
  filterRowsByPeriod,
} from '@/lib/ledger-export'
import type {
  LoanSector,
  ManualLedgerResponse,
  ManualLedgerRow,
  ManualLedgerTotals,
} from '@/lib/types'

const LOAN_SECTORS: { value: LoanSector; label: string }[] = [
  { value: 'COFFEE', label: 'Coffee' },
  { value: 'GENERAL_TRADE', label: 'General Trade' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'REAL_ESTATE', label: 'Real Estate' },
  { value: 'TENDERS', label: 'Tenders' },
  { value: 'HOSPITALITY', label: 'Hospitality' },
]

const SECTOR_LABELS: Record<LoanSector, string> = LOAN_SECTORS.reduce(
  (acc, sector) => ({ ...acc, [sector.value]: sector.label }),
  {} as Record<LoanSector, string>
)

const EMPTY_TOTALS: ManualLedgerTotals = {
  loanApproved: 0,
  disbursedAmount: 0,
  outstanding: 0,
  totalInterestToBeEarned: 0,
  interestReceived: 0,
  principalRecovered: 0,
}

interface Props {
  role?: 'LOAN_OFFICER' | 'GENERAL_MANAGER'
}

export default function Reports({ role = 'LOAN_OFFICER' }: Props) {
  const [rows, setRows] = useState<ManualLedgerRow[]>([])
  const [totals, setTotals] = useState<ManualLedgerTotals>(EMPTY_TOTALS)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sector, setSector] = useState<LoanSector | ''>('')
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)
  const [exportError, setExportError] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const basePath =
    role === 'GENERAL_MANAGER' ? '/dashboard/general-manager/loans' : '/dashboard/loan-officer/loans'

  const fetchLedger = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (sector) params.set('sector', sector)

      const res = await apiFetch<ManualLedgerResponse>(
        `/loans/manual-ledger?${params.toString()}`
      )
      setRows(res.data)
      setTotals(res.totals)
      setTotalPages(res.meta.totalPages)
    } catch (error) {
      console.error('Failed to fetch manual ledger:', error)
    } finally {
      setLoading(false)
    }
  }, [page, sector])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLedger()
  }, [fetchLedger])

  const onSectorChange = (value: LoanSector | '') => {
    setSector(value)
    setPage(1)
  }

  // Pulls every page for the current sector filter so exports cover the
  // whole filtered set, not just the page on screen.
  const fetchAllRows = async () => {
    const limit = 100
    const all: ManualLedgerRow[] = []
    let currentPage = 1
    let pages = 1
    let exportTotals: ManualLedgerTotals = EMPTY_TOTALS

    do {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(limit) })
      if (sector) params.set('sector', sector)
      const res = await apiFetch<ManualLedgerResponse>(
        `/loans/manual-ledger?${params.toString()}`
      )
      all.push(...res.data)
      exportTotals = res.totals
      pages = res.meta.totalPages
      currentPage += 1
    } while (currentPage <= pages)

    return { rows: all, totals: exportTotals }
  }

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExportError('')

    if (fromDate && toDate && fromDate > toDate) {
      setExportError('The "From" date must be on or before the "To" date.')
      return
    }

    setExporting(format)
    try {
      const { rows: allRows, totals: allTotals } = await fetchAllRows()

      const period = { from: fromDate || undefined, to: toDate || undefined }
      const hasPeriod = Boolean(fromDate || toDate)
      const exportRows = hasPeriod ? filterRowsByPeriod(allRows, period) : allRows
      const exportTotals = hasPeriod ? computeLedgerTotals(exportRows) : allTotals

      if (exportRows.length === 0) {
        setExportError(
          hasPeriod
            ? 'No disbursed loans fall within the selected date range.'
            : 'Nothing to export for the current filter.'
        )
        return
      }

      const sectorLabel = sector ? SECTOR_LABELS[sector] : undefined
      if (format === 'excel') {
        await exportLedgerToExcel(exportRows, exportTotals, sectorLabel, period)
      } else {
        await exportLedgerToPdf(exportRows, exportTotals, sectorLabel, period)
      }
    } catch (error) {
      console.error('Failed to export manual ledger:', error)
      setExportError('Export failed. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  const fmtMoney = (n: number | null | undefined) =>
    n === null || n === undefined
      ? '—'
      : n.toLocaleString('en-RW', { maximumFractionDigits: 2 })

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString('en-RW', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—'

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#36e07b]">
          Reports
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-base text-gray-400">
          A consolidated view of approved loans with disbursement, interest, and recovery
          figures. Filter by sector and date range, then export to PDF or Excel.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
            Sector
            <select
              value={sector}
              onChange={(event) => onSectorChange(event.target.value as LoanSector | '')}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#36e07b]"
            >
              <option value="">All sectors</option>
              {LOAN_SECTORS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              Report from
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#36e07b]"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              Report to
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#36e07b]"
              />
            </label>
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate('')
                  setToDate('')
                }}
                className="py-2 text-xs font-medium text-gray-400 underline-offset-2 transition-colors hover:text-gray-700 hover:underline"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => handleExport('excel')}
              disabled={exporting !== null || loading || rows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#36e07b] hover:text-gray-900 disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {exporting === 'excel' ? 'Exporting…' : 'Excel'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null || loading || rows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#36e07b] hover:text-gray-900 disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          The report period filters exported rows by disbursement date and recomputes the totals
          for that range. Leave the dates empty to export everything matching the sector.
        </p>
        {exportError && <p className="mt-1 text-sm text-red-600">{exportError}</p>}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
          Loading ledger...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8faf0]">
            <svg className="h-6 w-6 text-[#36e07b]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0120 9.414V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="mb-1 text-sm font-semibold text-gray-900">No ledger entries</p>
          <p className="text-sm text-gray-400">
            {sector
              ? 'No loans match the selected sector.'
              : 'Approved loans will appear here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <Th>No.</Th>
                  <Th>Loan Number</Th>
                  <Th>Customer Name</Th>
                  <Th>Sector</Th>
                  <Th align="right">Loan Approved</Th>
                  <Th align="right">Disbursed</Th>
                  <Th align="right">Outstanding</Th>
                  <Th>Disbursement Date</Th>
                  <Th align="right">Period (Mo.)</Th>
                  <Th align="right">Interest Rate</Th>
                  <Th align="right">Total Interest</Th>
                  <Th align="right">Interest Received</Th>
                  <Th align="right">Principal Recovered</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => (
                  <tr key={row.loanId} className="transition-colors hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-sm text-gray-700">
                      {row.no}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      <Link
                        href={`${basePath}/${row.loanId}`}
                        className="font-mono font-medium text-[#238a4d] transition-colors hover:text-[#1bcb68]"
                      >
                        {row.loanNumber}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                      {row.customerName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                      {row.sector ? SECTOR_LABELS[row.sector] : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm text-gray-700">
                      {fmtMoney(row.loanApproved)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm text-gray-700">
                      {fmtMoney(row.disbursedAmount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm">
                      <span className={row.outstanding === 0 ? 'font-semibold text-green-600' : 'text-gray-700'}>
                        {fmtMoney(row.outstanding)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                      {fmtDate(row.disbursementDate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-700">
                      {row.periodMonths}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-gray-700">
                      {row.interestRate}%
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm text-gray-700">
                      {fmtMoney(row.totalInterestToBeEarned)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm text-gray-700">
                      {fmtMoney(row.interestReceived)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm text-gray-700">
                      {fmtMoney(row.principalRecovered)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-100 bg-gray-50/60 font-semibold text-gray-900">
                  <td className="whitespace-nowrap px-4 py-4 text-sm" colSpan={4}>
                    Totals
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm">
                    {fmtMoney(totals.loanApproved)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm">
                    {fmtMoney(totals.disbursedAmount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm">
                    {fmtMoney(totals.outstanding)}
                  </td>
                  <td className="px-4 py-4" colSpan={3} />
                  <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm">
                    {fmtMoney(totals.totalInterestToBeEarned)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm">
                    {fmtMoney(totals.interestReceived)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-mono text-sm">
                    {fmtMoney(totals.principalRecovered)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}
