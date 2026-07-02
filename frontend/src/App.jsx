import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import Import from './pages/Import'
import Transactions from './pages/Transactions'
import Budget from './pages/Budget'
import Settings from './pages/Settings'
import Summary from './pages/Summary'
import Alerts from './pages/Alerts'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F4F5F8' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Topbar />
        <div className="px-[34px] pt-[26px] pb-[60px]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/import" element={<Import />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/summary/:year/:month" element={<Summary />} />
            <Route path="/alerts" element={<Alerts />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
