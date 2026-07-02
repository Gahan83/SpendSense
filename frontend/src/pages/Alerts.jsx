import { useEffect, useState } from 'react'
import { getSettings } from '../api'
import Icon from '../components/Icon'

const SAMPLE_MSGS = [
  {
    time: '2:14 PM',
    text: `📢 *Spending Warning — 80% Used*\n\nYou've used ₹24,100 of your ₹30,000 monthly budget (80%).\n\nRemaining: ₹5,900 with 9 days left (~₹655/day allowed).`,
  },
  {
    time: '6:02 PM',
    text: `⚠️ *Category Alert — Gym & Fitness*\n\nYou've hit your Gym & Fitness budget for the month.\n\nSpent: ₹1,500 / Limit: ₹1,500\nExcess: ₹0\n\nLatest transaction: ₹1,500 at Cult.fit`,
  },
  {
    time: '9:47 PM',
    text: `📅 *May 2026 — Monthly Summary*\n\n🍽 Food & Dining   ₹7,800  (34)\n🛒 Online Shopping ₹4,500  (9)\n⛽ Fuel           ₹3,200  (6)\n─────────────\n💰 *Total: ₹27,600*\n🎯 Budget: ₹30,000  ✅ Under by ₹2,400`,
  },
]

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-[#EAECF3] rounded-[18px] p-[22px] ${className}`} style={{ boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      {children}
    </div>
  )
}

export default function Alerts() {
  const [settings, setSettings] = useState(null)

  useEffect(() => { getSettings().then(setSettings) }, [])

  const budgetLimit = settings?.total_limit
  const phone = settings?.phone_number

  return (
    <div className="grid gap-[26px]" style={{ gridTemplateColumns: '340px 1fr', maxWidth: 940 }}>
      {/* phone mockup */}
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: 320, height: 640, background: '#0B141A', borderRadius: 40, padding: 11, boxShadow: '0 24px 60px -20px rgba(15,23,41,.5)' }}>
          <div className="absolute z-10" style={{ top: 11, left: '50%', transform: 'translateX(-50%)', width: 120, height: 26, background: '#0B141A', borderRadius: '0 0 16px 16px' }} />
          <div className="w-full h-full flex flex-col overflow-hidden" style={{ borderRadius: 30, background: '#ECE5DD' }}>
            <div className="flex items-center gap-[10px]" style={{ background: '#075E54', padding: '26px 14px 10px' }}>
              <Icon name="arrow_back" size={22} color="#fff" />
              <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(150deg,#4F46E5,#6366F1)' }}>
                <Icon name="savings" size={19} color="#fff" />
              </div>
              <div className="flex-1">
                <div className="text-[13.5px] font-semibold text-white">SpendSense</div>
                <div className="text-[10.5px]" style={{ color: 'rgba(255,255,255,.7)' }}>business account</div>
              </div>
              <Icon name="more_vert" size={20} color="#fff" />
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-[10px]" style={{ padding: '14px 12px', backgroundImage: 'linear-gradient(rgba(236,229,221,.9),rgba(236,229,221,.9))' }}>
              <div className="self-center text-[10px] font-medium px-[10px] py-[3px] rounded-lg" style={{ background: '#D4E9F7', color: '#4A6572' }}>TODAY</div>
              {SAMPLE_MSGS.map((m, i) => (
                <div key={i} className="self-start max-w-[88%] bg-white p-[8px_10px_6px]" style={{ borderRadius: '2px 9px 9px 9px', boxShadow: '0 1px 1px rgba(0,0,0,.12)' }}>
                  <div className="text-[11.5px] leading-[1.5] whitespace-pre-line" style={{ color: '#111B21' }}>{m.text}</div>
                  <div className="text-right text-[9px] mt-[2px]" style={{ color: '#8696A0' }}>{m.time}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2" style={{ background: '#F0F0F0', padding: '8px 10px' }}>
              <div className="flex-1 bg-white rounded-[20px] px-[14px] py-2 text-xs" style={{ color: '#8696A0' }}>Message</div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#075E54' }}>
                <Icon name="mic" size={19} color="#fff" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* config info */}
      <div className="flex flex-col gap-4">
        <Card>
          <div className="text-base font-bold tracking-[-.2px]">How alerts work</div>
          <div className="text-[12.5px] text-[#8891A3] mt-1 leading-[1.55]">
            Every import re-checks your spend. When a threshold is crossed, a WhatsApp message goes out with the exact reason —
            no duplicates for the same threshold in one day{phone ? ` on ${phone}` : ''}.
          </div>
          <div className="flex flex-col gap-[11px] mt-[18px]">
            <div className="flex items-center gap-3 p-[13px] rounded-xl" style={{ border: '1px solid #FBE4CC', background: '#FFF7ED' }}>
              <span className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center" style={{ background: '#FCEBD5' }}>
                <Icon name="campaign" size={19} color="#D97706" />
              </span>
              <div className="flex-1">
                <div className="text-[13px] font-semibold" style={{ color: '#92610F' }}>80% warning</div>
                <div className="text-[11.5px]" style={{ color: '#B7791F' }}>"You've used 80% of your monthly budget"</div>
              </div>
              <span className="font-mono-geist text-xs font-semibold" style={{ color: '#D97706' }}>80%</span>
            </div>
            <div className="flex items-center gap-3 p-[13px] rounded-xl" style={{ border: '1px solid #F3C9C0', background: '#FEF2F0' }}>
              <span className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center" style={{ background: '#FADBD4' }}>
                <Icon name="error" size={19} color="#DC2626" />
              </span>
              <div className="flex-1">
                <div className="text-[13px] font-semibold" style={{ color: '#991B1B' }}>Limit breached</div>
                <div className="text-[11.5px]" style={{ color: '#B91C1C' }}>Total spend crosses your monthly cap</div>
              </div>
              <span className="font-mono-geist text-xs font-semibold" style={{ color: '#DC2626' }}>100%</span>
            </div>
            <div className="flex items-center gap-3 p-[13px] rounded-xl" style={{ border: '1px solid #E7E9F0', background: '#FAFBFC' }}>
              <span className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center" style={{ background: '#EEF0FE' }}>
                <Icon name="splitscreen" size={19} color="#4F46E5" />
              </span>
              <div className="flex-1">
                <div className="text-[13px] font-semibold">Category limit</div>
                <div className="text-[11.5px] text-[#98A2B3]">A single category exceeds its sub-limit</div>
              </div>
              <span className="font-mono-geist text-xs font-semibold text-[#5A6478]">per-cat</span>
            </div>
          </div>
        </Card>
        <div className="rounded-[18px] p-[20px_22px] text-white flex items-center gap-[14px]" style={{ background: '#111827' }}>
          <Icon name="verified" size={26} color="#25D366" />
          <div className="flex-1">
            <div className="text-sm font-bold">Delivered via Twilio</div>
            <div className="text-xs mt-[2px]" style={{ color: 'rgba(255,255,255,.65)' }}>
              Free sandbox or your own account — messages arrive in under 60 seconds.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
