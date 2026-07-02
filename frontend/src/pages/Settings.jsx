import { useEffect, useState } from 'react'
import { getSettings, putSettings, sendTestAlert, getCategoryRules, createCategoryRule, deleteCategoryRule, exportTransactionsUrl } from '../api'
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

function Toggle({ on, onClick, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className="w-[42px] h-6 rounded-[20px] relative"
      style={{ background: on ? '#4F46E5' : '#D3D8E4', cursor: disabled ? 'default' : 'pointer' }}
    >
      <div
        className="absolute top-[2px] w-5 h-5 rounded-full bg-white"
        style={{ left: on ? 20 : 2, boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .15s' }}
      />
    </div>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [rules, setRules] = useState([])
  const [newKeyword, setNewKeyword] = useState('')
  const [newCategory, setNewCategory] = useState(CATEGORIES[0])
  const [testResult, setTestResult] = useState(null)
  const [saved, setSaved] = useState(false)

  const loadRules = () => getCategoryRules().then(setRules)

  useEffect(() => {
    getSettings().then(setSettings)
    loadRules()
  }, [])

  if (!settings) return <div className="text-[#8891A3] text-sm">Loading...</div>

  const alertsOn = settings.alerts_enabled === 'true' || settings.alerts_enabled === true

  const save = async (overrides = {}) => {
    const payload = {
      phone_number: settings.phone_number,
      twilio_account_sid: settings.twilio_account_sid,
      twilio_auth_token: settings.twilio_auth_token,
      twilio_whatsapp_from: settings.twilio_whatsapp_from,
      alerts_enabled: alertsOn,
      ...overrides,
    }
    const res = await putSettings(payload)
    setSettings(res)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const sendTest = async () => setTestResult(await sendTestAlert())

  const addRule = async () => {
    if (!newKeyword.trim()) return
    await createCategoryRule({ keyword: newKeyword.trim(), category: newCategory })
    setNewKeyword('')
    loadRules()
  }

  const removeRule = async (id) => { await deleteCategoryRule(id); loadRules() }

  const fieldCls = "text-xs font-semibold mb-[6px]"
  const boxCls = "rounded-[10px] px-[13px] py-[11px] text-[13px] font-mono-geist"

  return (
    <div style={{ maxWidth: 960 }}>
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* whatsapp + twilio */}
        <Card>
          <div className="flex items-center gap-[9px] mb-1">
            <span className="w-[30px] h-[30px] rounded-lg flex items-center justify-center" style={{ background: '#E7F9EE' }}>
              <Icon name="chat" size={18} color="#25A65B" />
            </span>
            <span className="text-[15px] font-bold tracking-[-.2px]">WhatsApp & Twilio</span>
          </div>
          <div className="flex flex-col gap-[14px] mt-[14px]">
            <div>
              <div className={`${fieldCls} text-[#5A6478]`}>Your WhatsApp number</div>
              <input value={settings.phone_number || ''} placeholder="+919XXXXXXXXX"
                onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                className={`${boxCls} w-full outline-none`} style={{ background: '#F7F8FB', border: '1px solid #E4E7EF', color: '#344054' }} />
            </div>
            <div>
              <div className={`${fieldCls} text-[#5A6478]`}>Twilio Account SID</div>
              <input value={settings.twilio_account_sid || ''}
                onChange={(e) => setSettings({ ...settings, twilio_account_sid: e.target.value })}
                className={`${boxCls} w-full outline-none`} style={{ background: '#F7F8FB', border: '1px solid #E4E7EF', color: '#344054' }} />
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <div className={`${fieldCls} text-[#5A6478]`}>Auth Token</div>
                <input type="password" value={settings.twilio_auth_token || ''}
                  onChange={(e) => setSettings({ ...settings, twilio_auth_token: e.target.value })}
                  className={`${boxCls} w-full outline-none`} style={{ background: '#F7F8FB', border: '1px solid #E4E7EF', color: '#344054' }} />
              </div>
              <div>
                <div className={`${fieldCls} text-[#5A6478]`}>Sender number</div>
                <input value={settings.twilio_whatsapp_from || ''} placeholder="whatsapp:+14155238886"
                  onChange={(e) => setSettings({ ...settings, twilio_whatsapp_from: e.target.value })}
                  className={`${boxCls} w-full outline-none`} style={{ background: '#F7F8FB', border: '1px solid #E4E7EF', color: '#344054', fontSize: 12 }} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => save()} className="text-white text-[12.5px] font-semibold px-4 py-[10px] rounded-[10px]" style={{ background: '#4F46E5' }}>
                Save settings
              </button>
              <button onClick={sendTest} className="inline-flex items-center gap-2 text-white text-[12.5px] font-semibold px-4 py-[10px] rounded-[10px]" style={{ background: '#111827' }}>
                <Icon name="send" size={17} color="#fff" /> Send test message
              </button>
              {saved && <span className="text-[#16A34A] text-xs font-semibold">Saved ✓</span>}
            </div>
            {testResult && (
              <p className={`text-xs font-medium ${testResult.sent ? '' : ''}`} style={{ color: testResult.sent ? '#16A34A' : '#DC2626' }}>
                {testResult.sent ? 'Test message sent ✓' : `Failed: ${testResult.reason}`}
              </p>
            )}
          </div>
        </Card>

        {/* toggles + data */}
        <div className="flex flex-col gap-4">
          <Card>
            <div className="text-[15px] font-bold tracking-[-.2px] mb-[14px]">Alerts</div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between py-[11px] border-b border-[#F2F3F7]">
                <div>
                  <div className="text-[13px] font-semibold">Enable WhatsApp alerts</div>
                  <div className="text-[11.5px] text-[#98A2B3] mt-px">Master switch for all notifications</div>
                </div>
                <Toggle on={alertsOn} onClick={() => save({ alerts_enabled: !alertsOn })} />
              </div>
              <div className="flex items-center justify-between py-[11px] border-b border-[#F2F3F7]">
                <div>
                  <div className="text-[13px] font-semibold">80% warning</div>
                  <div className="text-[11.5px] text-[#98A2B3] mt-px">Heads-up before you hit the limit</div>
                </div>
                <Toggle on={alertsOn} disabled />
              </div>
              <div className="flex items-center justify-between py-[11px]">
                <div>
                  <div className="text-[13px] font-semibold">Month-end summary</div>
                  <div className="text-[11.5px] text-[#98A2B3] mt-px">Auto-send on the last day of the month</div>
                </div>
                <Toggle on={alertsOn} disabled />
              </div>
            </div>
          </Card>
          <Card>
            <div className="text-sm font-bold">Data</div>
            <div className="flex gap-[10px] mt-3">
              <a href={exportTransactionsUrl} className="flex-1 flex items-center justify-center gap-[7px] rounded-[10px] py-[10px] text-[12.5px] font-semibold text-[#344054] no-underline" style={{ border: '1px solid #E7E9F0' }}>
                <Icon name="download" size={17} color="#344054" /> Export all CSV
              </a>
            </div>
          </Card>
        </div>
      </div>

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
