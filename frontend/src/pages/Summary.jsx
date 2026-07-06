import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSummary, exportTransactionsUrl } from '../api'
import { getCategoryMeta } from '../categoryMeta'
import { MONTH_NAMES } from '../constants'
import Icon from '../components/Icon'

function Donut({ data, total, size = 200, r = 74, strokeWidth = 24 }) {
  const circ = 2 * Math.PI * r
  let acc = 0
  const segs = data.map((d) => {
    const len = (d.value / total) * circ
    const seg = { color: d.color, dash: `${len.toFixed(2)} ${(circ - len).toFixed(2)}`, offset: -acc }
    acc += len
    return seg
  })
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0F1F5" strokeWidth={strokeWidth} />
        {segs.map((s, i) => (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={strokeWidth}
            strokeDasharray={s.dash} strokeDashoffset={s.offset} />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[11px] text-[#98A2B3]">{data.length} categories</div>
        <div className="font-mono-geist text-[22px] font-semibold tracking-[-.5px]">₹{total.toLocaleString('en-IN')}</div>
      </div>
    </div>
  )
}

export default function Summary() {
  const params = useParams()
  const navigate = useNavigate()
  const now = new Date()
  const year = Number(params.year) || now.getFullYear()
  const month = Number(params.month) || now.getMonth() + 1
  const [data, setData] = useState(null)

  useEffect(() => { getSummary(year, month).then(setData) }, [year, month])

  if (!data) return <div className="text-[#8891A3] text-sm">Loading summary...</div>

  const categories = Object.entries(data.categories).sort((a, b) => b[1].amount - a[1].amount)
  const totalCount = categories.reduce((s, [, v]) => s + v.count, 0)
  const donutData = categories.filter(([, v]) => v.amount > 0).map(([name, v]) => ({ name, value: v.amount, color: getCategoryMeta(name).color }))
  const underBudget = data.variance >= 0

  const changeMonth = (delta) => {
    let m = month + delta, y = year
    if (m > 12) { m = 1; y += 1 }
    if (m < 1) { m = 12; y -= 1 }
    navigate(`/summary/${y}/${m}`)
  }

  return (
    <div style={{ maxWidth: 1080 }}>
      <div className="flex items-center justify-between mb-[18px]">
        <div className="flex items-center gap-[10px] bg-white border border-[#E7E9F0] rounded-[11px] px-2 py-[6px]">
          <button onClick={() => changeMonth(-1)} className="flex"><Icon name="chevron_left" size={20} color="#5A6478" /></button>
          <span className="text-[13.5px] font-semibold px-1">{MONTH_NAMES[month - 1]} {year}</span>
          <button onClick={() => changeMonth(1)} className="flex"><Icon name="chevron_right" size={20} color="#C6CBD8" /></button>
        </div>
        <div className="flex gap-[10px]">
          <a href={exportTransactionsUrl} className="inline-flex items-center gap-[7px] bg-white border border-[#E7E9F0] rounded-[10px] px-[14px] py-[9px] text-[13px] font-semibold text-[#344054] no-underline">
            <Icon name="download" size={18} color="#344054" /> Export CSV
          </a>
        </div>
      </div>

      <div className="bg-white border border-[#EAECF3] rounded-[20px] overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(16,24,40,.05)' }}>
        {/* header band */}
        <div className="px-[30px] py-[26px] text-white" style={{ background: 'linear-gradient(135deg,#4F46E5,#6D5DF0)' }}>
          <div className="text-[12.5px] font-medium" style={{ color: 'rgba(255,255,255,.8)' }}>Monthly Summary</div>
          <div className="text-2xl font-bold tracking-[-.4px] mt-[2px]">{MONTH_NAMES[month - 1]} {year} — where your money went</div>
          <div className="grid gap-[14px] mt-[22px]" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            <div>
              <div className="text-[11.5px]" style={{ color: 'rgba(255,255,255,.72)' }}>Total spent</div>
              <div className="font-mono-geist text-[22px] font-semibold mt-[3px]">₹{data.total_spent.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-[11.5px]" style={{ color: 'rgba(255,255,255,.72)' }}>Budget</div>
              <div className="font-mono-geist text-[22px] font-semibold mt-[3px]">₹{data.budget.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-[11.5px]" style={{ color: 'rgba(255,255,255,.72)' }}>Variance</div>
              <div className="font-mono-geist text-[22px] font-semibold mt-[3px]" style={{ color: '#B9F5CF' }}>
                {underBudget ? '+' : '−'}₹{Math.abs(data.variance).toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <div className="text-[11.5px]" style={{ color: 'rgba(255,255,255,.72)' }}>Status</div>
              <div className="text-[15px] font-bold mt-[6px] inline-flex items-center gap-[5px]">
                <Icon name={underBudget ? 'check_circle' : 'error'} size={18} color="#B9F5CF" />
                {underBudget ? 'Under budget' : 'Over budget'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '300px 1fr' }}>
          {/* donut + insights */}
          <div className="p-[26px_28px] border-r border-[#EEF0F4]">
            {donutData.length > 0 ? <Donut data={donutData} total={data.total_spent} /> : (
              <div className="text-center text-[#98A2B3] text-sm py-8">No spending this month</div>
            )}
            <div className="mt-[22px] flex flex-col gap-3">
              {data.biggest_expense && (
                <div className="flex items-start gap-[10px] rounded-[11px] p-[11px_13px]" style={{ background: '#FAFAFF', border: '1px solid #EEF0F4' }}>
                  <Icon name="star" size={19} color="#4F46E5" />
                  <div>
                    <div className="text-[11px] text-[#98A2B3]">Biggest expense</div>
                    <div className="text-[13px] font-semibold mt-px">
                      ₹{data.biggest_expense.amount.toLocaleString('en-IN')} · {data.biggest_expense.merchant}
                    </div>
                  </div>
                </div>
              )}
              {data.most_frequent_merchant && (
                <div className="flex items-start gap-[10px] rounded-[11px] p-[11px_13px]" style={{ background: '#FAFAFF', border: '1px solid #EEF0F4' }}>
                  <Icon name="storefront" size={19} color="#4F46E5" />
                  <div>
                    <div className="text-[11px] text-[#98A2B3]">Most frequent merchant</div>
                    <div className="text-[13px] font-semibold mt-px">
                      {data.most_frequent_merchant.merchant} · {data.most_frequent_merchant.count} times
                    </div>
                  </div>
                </div>
              )}
              {data.insight && (
                <div className="flex items-start gap-[10px] rounded-[11px] p-[11px_13px]" style={{ background: '#FFF7ED', border: '1px solid #FBE4CC' }}>
                  <Icon name="lightbulb" size={19} color="#D97706" />
                  <div>
                    <div className="text-[11px]" style={{ color: '#B7791F' }}>Insight</div>
                    <div className="text-[12.5px] font-semibold mt-px leading-[1.4]" style={{ color: '#92610F' }}>{data.insight}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* table */}
          <div className="p-[22px_28px]">
            <div className="grid gap-3 pb-[10px] border-b border-[#EEF0F4] text-[11px] font-semibold text-[#98A2B3] uppercase tracking-[.4px]"
              style={{ gridTemplateColumns: '1.6fr 90px 80px 60px' }}>
              <div>Category</div><div className="text-right">Amount</div><div className="text-right">Txns</div><div className="text-right">Share</div>
            </div>
            {categories.length === 0 && <div className="text-[#98A2B3] text-sm py-4">No transactions this month</div>}
            {categories.map(([cat, v]) => {
              const meta = getCategoryMeta(cat)
              const pct = data.total_spent ? Math.round((v.amount / data.total_spent) * 100) : 0
              return (
                <div key={cat} className="grid items-center gap-3 py-[9px] border-b border-[#F4F5F8] last:border-0"
                  style={{ gridTemplateColumns: '1.6fr 90px 80px 60px' }}>
                  <div className="flex items-center gap-[10px]">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: meta.tint }}>
                      <Icon name={meta.icon} size={16} color={meta.color} />
                    </span>
                    <span className="text-[13px] font-semibold">{cat}</span>
                  </div>
                  <div className="font-mono-geist text-[13px] font-semibold text-right">₹{v.amount.toLocaleString('en-IN')}</div>
                  <div className="font-mono-geist text-[12.5px] text-[#8891A3] text-right">{v.count}</div>
                  <div className="font-mono-geist text-[12.5px] font-semibold text-right" style={{ color: meta.color }}>{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
