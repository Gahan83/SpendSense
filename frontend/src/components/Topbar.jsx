import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'

const TITLES = {
  '/': ['Dashboard', 'Overview of your spending'],
  '/transactions': ['Transactions', 'Browse and edit your transaction history'],
  '/import': ['Import', 'Upload and categorise your PhonePe history'],
  '/budget': ['Budget', 'Set your monthly and per-category limits'],
  '/summary': ['Month-End Summary', 'Completed month report'],
  '/settings': ['Settings', 'WhatsApp, Twilio and category rules'],
}

function titleFor(pathname) {
  if (TITLES[pathname]) return TITLES[pathname]
  if (pathname.startsWith('/summary')) return TITLES['/summary']
  return ['SpendSense', '']
}

export default function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [title, sub] = titleFor(location.pathname)

  const submitSearch = (e) => {
    if (e.key !== 'Enter' || !search.trim()) return
    navigate(`/transactions?search=${encodeURIComponent(search.trim())}`)
  }

  return (
    <header
      className="sticky top-0 z-20 border-b border-[#EAECF3] px-[34px] py-4 flex items-center gap-5"
      style={{ background: 'rgba(244,245,248,.82)', backdropFilter: 'blur(10px)' }}
    >
      <div>
        <div className="text-[19px] font-bold tracking-[-.3px]">{title}</div>
        {sub && <div className="text-[12.5px] text-[#8891A3] mt-px">{sub}</div>}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-[#E7E9F0] rounded-[10px] px-3 py-2 w-[210px]">
          <Icon name="search" size={19} color="#AEB4C2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={submitSearch}
            placeholder="Search transactions"
            className="text-[13px] text-[#344054] placeholder:text-[#AEB4C2] outline-none border-none bg-transparent w-full"
          />
        </div>
      </div>
    </header>
  )
}
