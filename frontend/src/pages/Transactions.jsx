import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listTransactions, updateTransactionCategory, exportTransactionsUrl } from '../api'
import { CATEGORIES, MONTH_NAMES } from '../constants'
import { getCategoryMeta } from '../categoryMeta'
import Icon from '../components/Icon'

const PAGE_SIZE = 15

export default function Transactions() {
  const [searchParams] = useSearchParams()
  const [rows, setRows] = useState([])
  const [filters, setFilters] = useState({
    month: '', year: '', category: '', search: searchParams.get('search') || '',
    min_amount: '', max_amount: '',
  })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = (f = filters, p = page) => {
    setLoading(true)
    const params = { ...f, page: p, page_size: PAGE_SIZE }
    Object.keys(params).forEach((k) => { if (params[k] === '') delete params[k] })
    listTransactions(params).then((data) => { setRows(data); setLoading(false) })
  }

  useEffect(() => { load(filters, 1); setPage(1) }, [])
  useEffect(() => { load(filters, page) }, [page])

  const applyFilters = () => { setPage(1); load(filters, 1) }

  const handleCategoryChange = async (id, category) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, category } : r)))
    await updateTransactionCategory(id, category)
  }

  const inputCls = "flex items-center gap-2 bg-white border border-[#E7E9F0] rounded-[10px] px-3 py-[9px] text-[13px] font-semibold text-[#344054]"

  return (
    <div>
      {/* filter bar */}
      <div className="flex items-center gap-[10px] mb-4 flex-wrap">
        <div className={`${inputCls} w-[260px]`}>
          <Icon name="search" size={19} color="#AEB4C2" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Search by merchant…"
            className="outline-none border-none bg-transparent w-full font-normal placeholder:text-[#AEB4C2] placeholder:font-normal"
          />
        </div>
        <select value={filters.category} onChange={(e) => { const f = { ...filters, category: e.target.value }; setFilters(f); }}
          className={inputCls}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className={inputCls}>
          <option value="">Any month</option>
          {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" placeholder="Min ₹" value={filters.min_amount}
          onChange={(e) => setFilters({ ...filters, min_amount: e.target.value })}
          className={`${inputCls} w-[90px] font-normal`} />
        <input type="number" placeholder="Max ₹" value={filters.max_amount}
          onChange={(e) => setFilters({ ...filters, max_amount: e.target.value })}
          className={`${inputCls} w-[90px] font-normal`} />
        <button onClick={applyFilters} className="text-white text-[13px] font-semibold px-4 py-[9px] rounded-[10px]" style={{ background: '#4F46E5' }}>
          Apply
        </button>
        <a href={exportTransactionsUrl} className={`${inputCls} ml-auto no-underline`}>
          <Icon name="download" size={18} color="#344054" /> Export
        </a>
      </div>

      <div className="bg-white border border-[#EAECF3] rounded-[18px] overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
        <div className="grid gap-[14px] px-[22px] py-3 text-[11px] font-semibold text-[#98A2B3] uppercase tracking-[.4px]"
          style={{ background: '#FAFBFC', gridTemplateColumns: '110px 1fr 160px 130px 110px' }}>
          <div>Date</div><div>Merchant</div><div>Category</div><div>UPI Ref</div><div className="text-right">Amount</div>
        </div>
        {loading ? (
          <div className="text-center py-8 text-[#98A2B3] text-sm">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-[#98A2B3] text-sm">No transactions</div>
        ) : rows.map((t) => {
          const meta = getCategoryMeta(t.category)
          return (
            <div key={t.id} className="grid items-center gap-[14px] px-[22px] py-[13px] border-b border-[#F4F5F8] last:border-0 hover:bg-[#FBFBFE]"
              style={{ gridTemplateColumns: '110px 1fr 160px 130px 110px' }}>
              <div className="text-[12.5px] text-[#5A6478]">{t.date}</div>
              <div className="flex items-center gap-[11px] min-w-0">
                <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: meta.tint }}>
                  <Icon name={meta.icon} size={17} color={meta.color} />
                </div>
                <span className="text-[13px] font-semibold truncate">{t.merchant}</span>
              </div>
              <select value={t.category} onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                className="text-xs border-none bg-transparent font-semibold" style={{ color: meta.color }}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="font-mono-geist text-xs text-[#98A2B3] truncate">{t.upi_ref || '—'}</div>
              <div className="font-mono-geist text-[13px] font-semibold text-right" style={{ color: t.type === 'DEBIT' ? '#B42318' : '#15803D' }}>
                {t.type === 'DEBIT' ? '−' : '+'}₹{t.amount.toLocaleString('en-IN')}
              </div>
            </div>
          )
        })}
        <div className="flex items-center justify-between px-[22px] py-[14px]">
          <span className="text-[12.5px] text-[#8891A3]">Page {page} · {rows.length} shown</span>
          <div className="flex gap-[6px]">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 rounded-[8px] border border-[#E7E9F0] flex items-center justify-center disabled:opacity-40">
              <Icon name="chevron_left" size={18} color="#5A6478" />
            </button>
            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[13px] font-semibold text-white" style={{ background: '#4F46E5' }}>
              {page}
            </div>
            <button disabled={rows.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded-[8px] border border-[#E7E9F0] flex items-center justify-center disabled:opacity-40">
              <Icon name="chevron_right" size={18} color="#5A6478" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
