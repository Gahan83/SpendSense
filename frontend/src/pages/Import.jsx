import { useState, useRef } from 'react'
import { importTransactions } from '../api'
import { getCategoryMeta } from '../categoryMeta'
import Icon from '../components/Icon'

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-[#EAECF3] rounded-[18px] ${className}`} style={{ boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      {children}
    </div>
  )
}

export default function Import() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    setFile(f)
    setResult(null)
    setError(null)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const res = await importTransactions(file)
      setResult(res)
    } catch (e) {
      setError(e.response?.data?.detail || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: '1fr 300px' }}>
        {/* dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false)
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
          }}
          onClick={() => inputRef.current?.click()}
          className="bg-white rounded-[18px] p-[38px] text-center flex flex-col items-center justify-center cursor-pointer"
          style={{ border: `2px dashed ${dragOver ? '#4F46E5' : '#C9CEDE'}` }}
        >
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center mb-[14px]" style={{ background: '#EEF0FE' }}>
            <Icon name="cloud_upload" size={30} color="#4F46E5" />
          </div>
          <div className="text-base font-bold tracking-[-.2px]">
            {file ? file.name : 'Drop your PhonePe export here'}
          </div>
          <div className="text-[12.5px] text-[#8891A3] mt-[5px] leading-[1.5]" style={{ maxWidth: 340 }}>
            Upload the CSV or Excel history exported from PhonePe. We also accept HDFC / ICICI / SBI UPI statements.
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); file ? handleUpload() : inputRef.current?.click() }}
            disabled={loading}
            className="inline-flex items-center gap-2 mt-[18px] text-white text-[13px] font-semibold px-[18px] py-[10px] rounded-[10px] disabled:opacity-60"
            style={{ background: '#4F46E5', boxShadow: '0 6px 16px -6px rgba(79,70,229,.6)' }}
          >
            <Icon name={file ? 'publish' : 'upload_file'} size={18} color="#fff" />
            {loading ? 'Importing…' : file ? 'Import file' : 'Choose file'}
          </button>
          <div className="text-[11px] text-[#AEB4C2] mt-3">CSV, XLSX · up to 10MB</div>
        </div>

        {/* result */}
        <Card className="p-5">
          {!result && !error && (
            <div className="text-[#8891A3] text-sm">Upload a file to see the import result here.</div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-[#B91C1C] text-sm">
              <Icon name="error" size={20} color="#DC2626" /> {error}
            </div>
          )}
          {result && (
            <>
              <div className="flex items-center gap-[9px]">
                <Icon name="task_alt" size={20} color="#16A34A" />
                <span className="text-sm font-bold">Parsed successfully</span>
              </div>
              <div className="text-xs text-[#8891A3] mt-[3px]">{file?.name}</div>
              <div className="flex flex-col gap-[10px] mt-4">
                <div className="flex items-center justify-between rounded-[10px] px-[13px] py-[10px]" style={{ background: '#E7F6EE' }}>
                  <span className="text-[12.5px] font-semibold" style={{ color: '#15803D' }}>New added</span>
                  <span className="font-mono-geist text-base font-semibold" style={{ color: '#15803D' }}>{result.added}</span>
                </div>
                <div className="flex items-center justify-between rounded-[10px] px-[13px] py-[10px]" style={{ background: '#F4F5F8' }}>
                  <span className="text-[12.5px] font-semibold text-[#5A6478]">Duplicates skipped</span>
                  <span className="font-mono-geist text-base font-semibold text-[#5A6478]">{result.duplicates}</span>
                </div>
                {result.unknown_columns?.length > 0 && (
                  <div className="flex items-center justify-between rounded-[10px] px-[13px] py-[10px]" style={{ background: '#FEF0E6' }}>
                    <span className="text-[12.5px] font-semibold" style={{ color: '#B7791F' }}>Unrecognised columns</span>
                    <span className="font-mono-geist text-base font-semibold" style={{ color: '#B7791F' }}>{result.unknown_columns.length}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* preview table */}
      {result?.added_rows?.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-[#EEF0F4]">
            <div>
              <div className="text-[15px] font-bold tracking-[-.2px]">Imported rows</div>
              <div className="text-xs text-[#8891A3] mt-[2px]">Auto-categorised · edit categories anytime from Transactions</div>
            </div>
          </div>
          <div className="grid gap-[14px] px-[22px] py-[11px] text-[11px] font-semibold text-[#98A2B3] uppercase tracking-[.4px]"
            style={{ background: '#FAFBFC', gridTemplateColumns: '110px 1fr 90px 160px' }}>
            <div>Date</div><div>Merchant</div><div className="text-right">Amount</div><div>Category</div>
          </div>
          {result.added_rows.map((r, i) => {
            const meta = getCategoryMeta(r.category)
            return (
              <div key={i} className="grid items-center gap-[14px] px-[22px] py-3 border-b border-[#F4F5F8] last:border-0"
                style={{ gridTemplateColumns: '110px 1fr 90px 160px' }}>
                <div className="text-[12.5px] text-[#5A6478]">{r.date}</div>
                <div className="text-[13px] font-semibold truncate">{r.merchant}</div>
                <div className={`font-mono-geist text-[13px] font-semibold text-right ${r.type === 'DEBIT' ? '' : ''}`}
                  style={{ color: r.type === 'DEBIT' ? '#B42318' : '#15803D' }}>
                  {r.type === 'DEBIT' ? '−' : '+'}₹{r.amount.toLocaleString('en-IN')}
                </div>
                <div className="inline-flex items-center gap-[6px] px-[9px] py-[5px] rounded-[8px] w-fit" style={{ background: meta.tint }}>
                  <Icon name={meta.icon} size={15} color={meta.color} />
                  <span className="text-[11.5px] font-semibold whitespace-nowrap" style={{ color: meta.color }}>{r.category}</span>
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
