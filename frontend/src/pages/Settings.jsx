import { useEffect, useState } from 'react'
import { getCategoryRules, createCategoryRule, deleteCategoryRule, exportTransactionsUrl } from '../api'
import { CATEGORIES } from '../constants'
import { getCategoryMeta } from '../categoryMeta'
import Icon from '../components/Icon'

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-[#EAECF3] rounded-[18px] p-[22px] ${className}`} style={{ boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      {children}
    </div>
  )
}

export default function Settings() {
  const [rules, setRules] = useState([])
  const [newKeyword, setNewKeyword] = useState('')
  const [newCategory, setNewCategory] = useState(CATEGORIES[0])

  const loadRules = () => getCategoryRules().then(setRules)

  useEffect(() => { loadRules() }, [])

  const addRule = async () => {
    if (!newKeyword.trim()) return
    await createCategoryRule({ keyword: newKeyword.trim(), category: newCategory })
    setNewKeyword('')
    loadRules()
  }

  const removeRule = async (id) => { await deleteCategoryRule(id); loadRules() }

  return (
    <div style={{ maxWidth: 960 }}>
      <Card className="mb-4">
        <div className="text-sm font-bold">Data</div>
        <div className="flex gap-[10px] mt-3">
          <a href={exportTransactionsUrl} className="flex-1 flex items-center justify-center gap-[7px] rounded-[10px] py-[10px] text-[12.5px] font-semibold text-[#344054] no-underline" style={{ border: '1px solid #E7E9F0' }}>
            <Icon name="download" size={17} color="#344054" /> Export all CSV
          </a>
        </div>
      </Card>

      {/* category rules */}
      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-[#EEF0F4]">
          <div>
            <div className="text-[15px] font-bold tracking-[-.2px]">Category rules</div>
            <div className="text-xs text-[#8891A3] mt-[2px]">Keyword → category mappings, checked before defaults.</div>
          </div>
          <div className="flex items-center gap-2">
            <input placeholder="keyword" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)}
              className="border border-[#E7E9F0] rounded-[8px] px-2 py-[7px] text-xs w-[120px] outline-none" />
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
              className="border border-[#E7E9F0] rounded-[8px] px-2 py-[7px] text-xs">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={addRule} className="inline-flex items-center gap-[7px] text-white text-[12.5px] font-semibold px-[15px] py-[9px] rounded-[10px]" style={{ background: '#4F46E5' }}>
              <Icon name="add" size={17} color="#fff" /> Add rule
            </button>
          </div>
        </div>
        <div className="grid gap-[14px] px-[22px] py-[11px] text-[11px] font-semibold text-[#98A2B3] uppercase tracking-[.4px]"
          style={{ background: '#FAFBFC', gridTemplateColumns: '1fr 1fr 40px' }}>
          <div>Keyword</div><div>Maps to</div><div></div>
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {rules.map((r) => {
            const meta = getCategoryMeta(r.category)
            return (
              <div key={r.id} className="grid items-center gap-[14px] px-[22px] py-3 border-b border-[#F4F5F8] last:border-0"
                style={{ gridTemplateColumns: '1fr 1fr 40px' }}>
                <div className="font-mono-geist text-[13px] text-[#344054]">{r.keyword}</div>
                <div className="inline-flex items-center gap-[7px] w-fit">
                  <span className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center" style={{ background: meta.tint }}>
                    <Icon name={meta.icon} size={15} color={meta.color} />
                  </span>
                  <span className="text-[13px] font-semibold">{r.category}</span>
                </div>
                {!!r.is_custom ? (
                  <button onClick={() => removeRule(r.id)}><Icon name="delete" size={18} color="#C6CBD8" /></button>
                ) : <div />}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
