import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import Icon from './Icon'
import { getSettings } from '../api'

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'space_dashboard', end: true },
  { to: '/transactions', label: 'Transactions', icon: 'receipt_long' },
  { to: '/import', label: 'Import', icon: 'cloud_upload' },
  { to: '/budget', label: 'Budget', icon: 'account_balance_wallet' },
  { to: '/summary', label: 'Summary', icon: 'summarize' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

export default function Sidebar() {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {})
  }, [])

  const alertsOn = settings?.alerts_enabled === 'true' || settings?.alerts_enabled === true
  const phone = settings?.phone_number

  return (
    <aside className="w-[252px] flex-shrink-0 bg-white border-r border-[#EAECF3] flex flex-col p-[22px_16px]">
      <div className="flex items-center gap-[11px] px-2 pb-[22px] pt-1">
        <div
          className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center"
          style={{ background: 'linear-gradient(150deg,#4F46E5,#6366F1)', boxShadow: '0 4px 12px rgba(79,70,229,.32)' }}
        >
          <Icon name="savings" size={22} color="#fff" weight={500} />
        </div>
        <div>
          <div className="text-[15px] font-bold tracking-[-.2px]">SpendSense</div>
          <div className="text-[11px] text-[#98A2B3] font-medium mt-px">Personal Finance</div>
        </div>
      </div>

      <div className="text-[10.5px] font-semibold tracking-[.7px] text-[#B0B7C6] px-[10px] pt-[6px] pb-2 uppercase">
        Menu
      </div>
      <nav className="flex flex-col gap-[3px]">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-[11px] py-[9px] rounded-[10px] text-[13.5px] no-underline transition-colors ${
                isActive ? 'font-semibold' : 'font-medium hover:bg-[#F3F4F9]'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? '#EEF0FE' : 'transparent',
              color: isActive ? '#3F3ABE' : '#4B5563',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} size={20} color={isActive ? '#4F46E5' : '#98A2B3'} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="bg-[#F5F5FE] border border-[#E7E7FB] rounded-[13px] p-[14px]">
          <div className="flex items-center gap-2">
            <Icon name="verified" size={18} color="#4F46E5" />
            <span className="text-[12.5px] font-semibold text-[#3F3ABE]">
              {alertsOn ? 'Alerts active' : 'Alerts off'}
            </span>
          </div>
          <div className="text-[11.5px] text-[#8886C8] mt-[5px] leading-[1.5]">
            {alertsOn
              ? `WhatsApp alerts on${phone ? ` for ${phone}` : ''}. You'll be warned at 80%.`
              : 'Turn on alerts in Settings to get WhatsApp warnings.'}
          </div>
        </div>
        <div className="flex items-center gap-[11px] px-2 pt-3 pb-[2px]">
          <div className="w-[34px] h-[34px] rounded-full bg-[#E7E9F2] flex items-center justify-center text-[13px] font-semibold text-[#5A6478]">
            G
          </div>
          <div className="leading-[1.3]">
            <div className="text-[12.5px] font-semibold">Gahan</div>
            <div className="text-[11px] text-[#98A2B3]">Bangalore, IN</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
