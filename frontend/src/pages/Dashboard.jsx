import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { getDashboard } from '../api'
import { getCategoryMeta } from '../categoryMeta'
import { MONTH_NAMES } from '../constants'
import Icon from '../components/Icon'

function Donut({ data, total }) {
  const size = 180
  const r = 66
  const circ = 2 * Math.PI * r
  let acc = 0
  const segs = data.map((d) => {
    const len = (d.value / total) * circ
    const seg = { color: d.color, dash: `${len.toFixed(2)} ${(circ - len).toFixed(2)}`, offset: -acc }
    acc += len
    return seg
  })
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0F1F5" strokeWidth={21} />
        {segs.map((s, i) => (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={21}
            strokeDasharray={s.dash} strokeDashoffset={s.offset} />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[11px] text-[#98A2B3] font-medium">Total</div>
        <div className="font-mono-geist text-[19px] font-semibold tracking-[-.5px]">₹{total.toLocaleString('en-IN')}</div>
      </div>
    </div>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-[#EAECF3] rounded-[18px] p-5 ${className}`} style={{ boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    setError(null)
    getDashboard(month, year)
      .then((d) => { setData(d); setLoading(false) })
      .catch((e) => { setError(e.response?.data?.detail || 'Could not load dashboard'); setLoading(false) })
  }, [month, year])

  const changeMonth = (delta) => {
    let m = month + delta, y = year
    if (m > 12) { m = 1; y += 1 }
    if (m < 1) { m = 12; y -= 1 }
    setMonth(m); setYear(y)
  }

  if (error) return <div className="text-[#DC2626] text-sm">{error}</div>
  if (loading || !data) return <div className="text-[#8891A3] text-sm">Loading dashboard...</div>

  const topCat = [...data.category_breakdown].sort((a, b) => b.spent - a.spent)[0]
  const donutData = data.category_breakdown
    .filter((c) => c.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .map((c) => ({ name: c.category, value: c.spent, color: getCategoryMeta(c.category).color }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 bg-white border border-[#E7E9F0] rounded-[10px] px-3 py-2 cursor-pointer w-fit">
          <button onClick={() => changeMonth(-1)} className="flex"><Icon name="chevron_left" size={20} color="#5A6478" /></button>
          <span className="text-[13.5px] font-semibold px-1">{MONTH_NAMES[month - 1]} {year}</span>
          <button onClick={() => changeMonth(1)} className="flex"><Icon name="chevron_right" size={20} color="#5A6478" /></button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid gap-4 mb-[18px]" style={{ gridTemplateColumns: '1.35fr 1fr 1fr 1fr' }}>
        <div
          className="rounded-[18px] p-[20px_22px] text-white relative overflow-hidden"
          style={{
            background: 'linear-gradient(155deg,#4F46E5 0%,#6D5DF0 55%,#7A5AF0 100%)',
            boxShadow: '0 12px 30px -12px rgba(79,70,229,.55)',
          }}
        >
          <div className="absolute rounded-full" style={{ right: -30, top: -30, width: 150, height: 150, background: 'rgba(255,255,255,.08)' }} />
          <div className="flex items-center justify-between relative">
            <span className="text-[12.5px] font-medium" style={{ color: 'rgba(255,255,255,.82)' }}>Spent this month</span>
            <span className="text-[11px] font-semibold px-[9px] py-1 rounded-[20px]" style={{ background: 'rgba(255,255,255,.18)' }}>
              {Math.round(data.progress_pct)}% used
            </span>
          </div>
          <div className="font-mono-geist text-[33px] font-semibold tracking-[-1px] mt-2 relative">₹{data.total_spent.toLocaleString('en-IN')}</div>
          <div className="text-[12.5px] mt-[2px] relative" style={{ color: 'rgba(255,255,255,.78)' }}>of ₹{data.total_limit.toLocaleString('en-IN')} budget</div>
          <div className="h-2 rounded-[20px] mt-4 overflow-hidden relative" style={{ background: 'rgba(255,255,255,.22)' }}>
            <div className="h-full rounded-[20px]" style={{ width: `${Math.min(data.progress_pct, 100)}%`, background: '#FFD66B' }} />
          </div>
          <div className="flex justify-between mt-[9px] text-[11.5px] relative" style={{ color: 'rgba(255,255,255,.8)' }}>
            <span>₹{Math.max(data.total_limit - data.total_spent, 0).toLocaleString('en-IN')} left</span>
            <span>{data.days_remaining} days remaining</span>
          </div>
        </div>

        <Card>
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: '#EEF0FE' }}>
            <Icon name="payments" size={20} color="#4F46E5" />
          </div>
          <div className="font-mono-geist text-2xl font-semibold tracking-[-.6px] mt-[14px]">₹{Math.round(data.daily_allowance).toLocaleString('en-IN')}</div>
          <div className="text-[12.5px] text-[#8891A3] mt-[2px]">Daily allowance left</div>
        </Card>

        <Card>
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: '#E7F6EE' }}>
            <Icon name="receipt_long" size={20} color="#16A34A" />
          </div>
          <div className="font-mono-geist text-2xl font-semibold tracking-[-.6px] mt-[14px]">{data.transaction_count}</div>
          <div className="text-[12.5px] text-[#8891A3] mt-[2px]">Transactions</div>
        </Card>

        <Card>
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: '#FEF0E6' }}>
            <Icon name="trending_up" size={20} color="#D97706" />
          </div>
          <div className="font-mono-geist text-2xl font-semibold tracking-[-.6px] mt-[14px] truncate">{topCat ? topCat.category.split(' ')[0] : '—'}</div>
          <div className="text-[12.5px] text-[#8891A3] mt-[2px]">Top category · ₹{(topCat?.spent || 0).toLocaleString('en-IN')}</div>
        </Card>
      </div>

      {/* CHART ROW */}
      <div className="grid gap-4 mb-[18px]" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <Card>
          <div className="flex items-center justify-between mb-[6px]">
            <div>
              <div className="text-[15px] font-bold tracking-[-.2px]">Cumulative spend</div>
              <div className="text-xs text-[#8891A3] mt-[2px]">Tracking against your ₹{data.total_limit.toLocaleString('en-IN')} pace</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.daily_series}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#AEB4C2' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `₹${Math.round(v).toLocaleString('en-IN')}`} labelFormatter={(d) => `Day ${d}`} />
              {data.total_limit > 0 && (
                <ReferenceLine y={data.total_limit} stroke="#F0451A" strokeDasharray="5 5" strokeOpacity={0.55}
                  label={{ value: `Budget ₹${data.total_limit.toLocaleString('en-IN')}`, position: 'insideTopRight', fontSize: 10, fill: '#F0451A' }} />
              )}
              <Area type="monotone" dataKey="cumulative" stroke="#4F46E5" strokeWidth={2.6} fill="url(#areaGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="text-[15px] font-bold tracking-[-.2px]">By category</div>
          {donutData.length === 0 ? (
            <div className="text-[#98A2B3] text-sm mt-4">No spending yet</div>
          ) : (
            <div className="flex items-center gap-[18px] mt-2">
              <Donut data={donutData} total={data.total_spent} />
              <div className="flex-1 flex flex-col gap-[9px] min-w-0">
                {donutData.slice(0, 6).map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-[9px] h-[9px] rounded-[3px] flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-[#4B5563] whitespace-nowrap overflow-hidden text-ellipsis flex-1">{d.name}</span>
                    <span className="font-mono-geist text-[11.5px] font-medium text-[#8891A3]">
                      {Math.round((d.value / data.total_spent) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* LOWER ROW */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <Card>
          <div className="flex items-center justify-between mb-[14px]">
            <div className="text-[15px] font-bold tracking-[-.2px]">Category budgets</div>
            <button onClick={() => navigate('/budget')} className="text-[12.5px] font-semibold" style={{ color: '#4F46E5' }}>Manage →</button>
          </div>
          <div className="flex flex-col gap-[3px]">
            {data.category_breakdown.length === 0 && <div className="text-[#98A2B3] text-sm py-2">No transactions yet</div>}
            {data.category_breakdown.slice(0, 7).map((c) => {
              const meta = getCategoryMeta(c.category)
              const hasLimit = !!c.limit
              const barW = hasLimit ? Math.min((c.spent / c.limit) * 100, 100) : 30
              let barColor = meta.color, sColor = '#98A2B3', statusLabel = 'No limit'
              if (hasLimit) {
                const used = c.spent / c.limit
                if (used >= 1) { barColor = '#F0451A'; sColor = '#DC2626'; statusLabel = 'Over' }
                else if (used >= 0.85) { barColor = '#F59E0B'; sColor = '#D97706'; statusLabel = 'Near limit' }
                else { sColor = '#16A34A'; statusLabel = 'On track' }
              } else { barColor = '#D3D8E4' }
              return (
                <div key={c.category} className="grid items-center gap-3 py-[9px] border-b border-[#F2F3F7] last:border-0"
                  style={{ gridTemplateColumns: '1.6fr 1fr 74px' }}>
                  <div className="flex items-center gap-[11px] min-w-0">
                    <span className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: meta.tint }}>
                      <Icon name={meta.icon} size={18} color={meta.color} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{c.category}</div>
                      <div className="text-[11px] text-[#98A2B3]">{c.count} transactions</div>
                    </div>
                  </div>
                  <div>
                    <div className="h-[6px] rounded-[20px] overflow-hidden" style={{ background: '#F0F1F5' }}>
                      <div className="h-full rounded-[20px]" style={{ width: `${barW}%`, background: barColor }} />
                    </div>
                    <div className="text-[10.5px] text-[#98A2B3] mt-1">
                      {hasLimit ? `₹${c.spent.toLocaleString('en-IN')} of ₹${c.limit.toLocaleString('en-IN')}` : 'No limit'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono-geist text-[13px] font-semibold">₹{c.spent.toLocaleString('en-IN')}</div>
                    <div className="text-[10.5px] font-semibold" style={{ color: sColor }}>{statusLabel}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <div className="text-[15px] font-bold tracking-[-.2px] mb-[13px]">Top merchants</div>
            <div className="flex flex-col gap-3">
              {data.top_merchants.length === 0 && <div className="text-[#98A2B3] text-sm">No merchants yet</div>}
              {data.top_merchants.map((m) => (
                <div key={m.merchant} className="flex items-center gap-[11px]">
                  <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: '#EEF0FE', color: '#4F46E5' }}>
                    {m.merchant[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{m.merchant}</div>
                  </div>
                  <div className="font-mono-geist text-[13px] font-semibold">₹{m.amount.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </Card>

          <div className="rounded-[18px] p-[20px_22px] text-white" style={{ background: 'linear-gradient(150deg,#111827,#1F2937)', boxShadow: '0 8px 20px -10px rgba(17,24,39,.5)' }}>
            <div className="flex items-center gap-2">
              <Icon name="summarize" size={19} color="#FFD66B" />
              <span className="text-sm font-bold">Month-end summary</span>
            </div>
            <div className="text-xs mt-[7px] leading-[1.5]" style={{ color: 'rgba(255,255,255,.7)' }}>
              Generate the full {MONTH_NAMES[month - 1]} report and push it to WhatsApp in one tap.
            </div>
            <button
              onClick={() => navigate(`/summary/${year}/${month}`)}
              className="inline-flex items-center gap-[7px] mt-[14px] bg-white text-[#111827] text-[12.5px] font-semibold px-[15px] py-[9px] rounded-[9px]"
            >
              Generate Summary <Icon name="arrow_forward" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
