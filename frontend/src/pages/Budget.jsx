import { useEffect, useState } from 'react'
import { getBudget, setBudget, getDashboard } from '../api'
import { CATEGORIES, MONTH_NAMES } from '../constants'
import { getCategoryMeta } from '../categoryMeta'
import Icon from '../components/Icon'

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-[#EAECF3] rounded-[18px] p-[22px] ${className}`} style={{ boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      {children}
    </div>
  )
}

export default function Budget() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [totalLimit, setTotalLimit] = useState(0)
  const [categoryLimits, setCategoryLimits] = useState({})
  const [resetDay, setResetDay] = useState(1)
  const [spend, setSpend] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getBudget(year, month).then((b) => {
      setTotalLimit(b.total_limit)
      setCategoryLimits(b.category_limits || {})
      setResetDay(b.reset_day || 1)
    })
    getDashboard(month, year).then((d) => {
      const map = {}
      d.category_breakdown.forEach((c) => { map[c.category] = c.spent })
      setSpend(map)
    })
  }, [month, year])

  const save = async () => {
    await setBudget(year, month, { total_limit: Number(totalLimit), category_limits: categoryLimits, reset_day: Number(resetDay) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const limitedCategories = CATEGORIES.filter((c) => categoryLimits[c] != null)
  const unlimitedCategories = CATEGORIES.filter((c) => categoryLimits[c] == null)

  return (
    <div style={{ maxWidth: 960 }}>
      <div className="flex items-center gap-3 mb-4">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
          className="bg-white border border-[#E7E9F0] rounded-[10px] px-3 py-2 text-[13px] font-semibold">
          {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="bg-white border border-[#E7E9F0] rounded-[10px] px-3 py-2 text-[13px] font-semibold w-24" />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 300px' }}>
        <div className="flex flex-col gap-4">
          <Card>
            <div className="text-[15px] font-bold tracking-[-.2px]">Monthly total limit</div>
            <div className="text-[12.5px] text-[#8891A3] mt-[3px]">Your overall spending cap. Alerts fire at 80% and 100%.</div>
            <div className="flex items-center gap-[14px] mt-4">
              <div className="flex-1 flex items-center rounded-xl px-4 py-3" style={{ background: '#F7F8FB', border: '1px solid #E4E7EF' }}>
                <span className="font-mono-geist text-[22px] font-semibold text-[#98A2B3]">₹</span>
                <input
                  type="number"
                  value={totalLimit}
                  onChange={(e) => setTotalLimit(e.target.value)}
                  className="font-mono-geist text-[22px] font-semibold ml-1 bg-transparent outline-none border-none w-full"
                />
                <span className="ml-auto text-[12.5px] text-[#98A2B3]">per month</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-[6px]">
              <div>
                <div className="text-[15px] font-bold tracking-[-.2px]">Category limits</div>
                <div className="text-[12.5px] text-[#8891A3] mt-[2px]">Optional sub-limits for the categories you watch.</div>
              </div>
            </div>

            {limitedCategories.map((c) => {
              const meta = getCategoryMeta(c)
              const spent = spend[c] || 0
              const limit = categoryLimits[c]
              const used = limit ? spent / limit : 0
              let barColor = meta.color
              if (used >= 1) barColor = '#F0451A'
              else if (used >= 0.85) barColor = '#F59E0B'
              return (
                <div key={c} className="grid items-center gap-[14px] py-3 border-b border-[#F2F3F7]" style={{ gridTemplateColumns: '1.4fr 1.2fr 120px' }}>
                  <div className="flex items-center gap-[11px]">
                    <span className="w-8 h-8 rounded-[9px] flex items-center justify-center" style={{ background: meta.tint }}>
                      <Icon name={meta.icon} size={18} color={meta.color} />
                    </span>
                    <span className="text-[13px] font-semibold">{c}</span>
                  </div>
                  <div>
                    <div className="h-[6px] rounded-[20px] overflow-hidden" style={{ background: '#F0F1F5' }}>
                      <div className="h-full rounded-[20px]" style={{ width: `${Math.min(used * 100, 100)}%`, background: barColor }} />
                    </div>
                    <div className="text-[10.5px] text-[#98A2B3] mt-1">₹{spent.toLocaleString('en-IN')} spent</div>
                  </div>
                  <div className="flex items-center rounded-[9px] px-[11px] py-[7px]" style={{ background: '#F7F8FB', border: '1px solid #E4E7EF' }}>
                    <span className="font-mono-geist text-[13px] font-semibold text-[#98A2B3]">₹</span>
                    <input
                      type="number"
                      value={limit}
                      onChange={(e) => setCategoryLimits((prev) => ({ ...prev, [c]: Number(e.target.value) }))}
                      className="font-mono-geist text-[13px] font-semibold ml-[2px] bg-transparent outline-none border-none w-full"
                    />
                    <button onClick={() => setCategoryLimits((prev) => { const n = { ...prev }; delete n[c]; return n })}>
                      <Icon name="close" size={16} color="#C6CBD8" />
                    </button>
                  </div>
                </div>
              )
            })}

            {unlimitedCategories.length > 0 && (
              <div className="mt-3">
                <div className="text-[11px] font-semibold text-[#98A2B3] uppercase tracking-[.4px] mb-2">Add a limit</div>
                <div className="flex flex-wrap gap-2">
                  {unlimitedCategories.map((c) => {
                    const meta = getCategoryMeta(c)
                    return (
                      <button
                        key={c}
                        onClick={() => setCategoryLimits((prev) => ({ ...prev, [c]: 1000 }))}
                        className="inline-flex items-center gap-[6px] px-[9px] py-[6px] rounded-[8px] text-[12px] font-semibold"
                        style={{ background: meta.tint, color: meta.color }}
                      >
                        <Icon name="add" size={14} color={meta.color} />
                        {c}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <div className="text-sm font-bold">Budget reset day</div>
            <div className="text-xs text-[#8891A3] mt-[3px] leading-[1.5]">The day each month your budget starts fresh.</div>
            <div className="flex items-center justify-between mt-[14px] rounded-[11px] px-[15px] py-[11px]" style={{ background: '#F7F8FB', border: '1px solid #E4E7EF' }}>
              <select value={resetDay} onChange={(e) => setResetDay(e.target.value)}
                className="text-[13px] font-semibold bg-transparent border-none outline-none w-full">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d === 1 ? '1st' : d === 2 ? '2nd' : d === 3 ? '3rd' : `${d}th`} of the month</option>
                ))}
              </select>
            </div>
          </Card>

          <div className="rounded-[18px] p-5" style={{ background: '#F5F5FE', border: '1px solid #E7E7FB' }}>
            <div className="flex items-center gap-2">
              <Icon name="info" size={19} color="#4F46E5" />
              <span className="text-[13px] font-bold" style={{ color: '#3F3ABE' }}>Budgets carry over</span>
            </div>
            <div className="text-xs mt-[6px] leading-[1.55]" style={{ color: '#8886C8' }}>
              Limits persist month over month until you change them. Unspent budget does not roll over.
            </div>
          </div>

          <button
            onClick={save}
            className="text-white text-center text-[13.5px] font-semibold p-[13px] rounded-xl"
            style={{ background: '#4F46E5', boxShadow: '0 8px 18px -8px rgba(79,70,229,.6)' }}
          >
            {saved ? 'Saved ✓' : 'Save budget'}
          </button>
        </div>
      </div>
    </div>
  )
}
