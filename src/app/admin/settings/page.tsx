'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardBody } from "@heroui/card"
import { Input } from "@heroui/input"
import { Button } from "@heroui/button"
import { 
  Settings, 
  ShoppingBag, 
  Save, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle,
  FolderOpen
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Custom Lightweight Spinner Component
const CustomSpinner = () => (
  <div className="w-6 h-6 border-3 border-zinc-200 border-t-primary rounded-full animate-spin" />
)

// Custom Lightweight Progress Bar Component
const CustomProgressBar = ({ value }: { value: number }) => (
  <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      className="h-full bg-primary"
      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
    />
  </div>
)

export default function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [exportProgress, setExportProgress] = useState<number | null>(null)
  const [importProgress, setImportProgress] = useState<number | null>(null)
  
  // Settings state
  const [amazonId, setAmazonId] = useState('')
  const [ebayId, setEbayId] = useState('')
  const [walmartId, setWalmartId] = useState('')
  const [bestbuyId, setBestbuyId] = useState('')
  const [macysId, setMacysId] = useState('')
  const [neweggId, setNeweggId] = useState('')
  const [wootId, setWootId] = useState('')
  const [headerScripts, setHeaderScripts] = useState('')
  const [footerScripts, setFooterScripts] = useState('')

  // Initial settings state to detect changes
  const [initialSettings, setInitialSettings] = useState({
    amazon_affiliate_id: '',
    ebay_affiliate_id: '',
    walmart_affiliate_id: '',
    bestbuy_affiliate_id: '',
    macys_affiliate_id: '',
    newegg_affiliate_id: '',
    woot_affiliate_id: '',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/app_settings')
      const data = await res.json()
      
      const amz = data.amazon_affiliate_id || ''
      const eb = data.ebay_affiliate_id || ''
      const wm = data.walmart_affiliate_id || ''
      const bb = data.bestbuy_affiliate_id || ''
      const mc = data.macys_affiliate_id || ''
      const ne = data.newegg_affiliate_id || ''
      const wt = data.woot_affiliate_id || ''

      setAmazonId(amz)
      setEbayId(eb)
      setWalmartId(wm)
      setBestbuyId(bb)
      setMacysId(mc)
      setNeweggId(ne)
      setWootId(wt)
      
      setInitialSettings({
        amazon_affiliate_id: amz,
        ebay_affiliate_id: eb,
        walmart_affiliate_id: wm,
        bestbuy_affiliate_id: bb,
        macys_affiliate_id: mc,
        newegg_affiliate_id: ne,
        woot_affiliate_id: wt,
      })

      setHeaderScripts(data.header_scripts || '')
      setFooterScripts(data.footer_scripts || '')
    } catch (err) {
      console.error('Failed to fetch settings', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string, value: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/app_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Setting saved successfully' })
        setInitialSettings(prev => ({ ...prev, [key]: value }))
      } else {
        setMessage({ type: 'error', text: 'Failed to save setting' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleSaveAllAffiliates = async () => {
    setSaving(true)
    try {
      const settingsMap = {
        amazon_affiliate_id: amazonId,
        ebay_affiliate_id: ebayId,
        walmart_affiliate_id: walmartId,
        bestbuy_affiliate_id: bestbuyId,
        macys_affiliate_id: macysId,
        newegg_affiliate_id: neweggId,
        woot_affiliate_id: wootId,
      }
      const res = await fetch('/api/admin/app_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsMap })
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'All affiliate tracking IDs updated successfully' })
        setInitialSettings(settingsMap)
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred saving settings' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleExport = async () => {
    setExportProgress(0)
    try {
      const response = await fetch('/api/admin/export-uploads')
      if (!response.ok) throw new Error('Export failed')

      const reader = response.body?.getReader()
      const contentLength = +(response.headers.get('Content-Length') ?? 0)
      
      let receivedLength = 0
      const chunks = []

      if (!reader) throw new Error('Failed to read response')

      while(true) {
        const {done, value} = await reader.read()
        if (done) break
        chunks.push(value)
        receivedLength += value.length
        if (contentLength) {
          setExportProgress(Math.round((receivedLength / contentLength) * 100))
        } else {
          setExportProgress(prev => Math.min((prev || 0) + 10, 95))
        }
      }

      const blob = new Blob(chunks)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `uploads-backup-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      setExportProgress(100)
      setTimeout(() => setExportProgress(null), 2000)
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Failed to export uploads' })
      setExportProgress(null)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportProgress(0)
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/import-uploads', true)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        setImportProgress(percent)
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        setImportProgress(100)
        setMessage({ type: 'success', text: 'Uploads imported successfully!' })
        setTimeout(() => setImportProgress(null), 2000)
      } else {
        setMessage({ type: 'error', text: 'Import failed' })
        setImportProgress(null)
      }
    }

    xhr.onerror = () => {
      setMessage({ type: 'error', text: 'An error occurred during import' })
      setImportProgress(null)
    }

    xhr.send(formData)
  }

  const isAffiliatesDirty = 
    amazonId !== initialSettings.amazon_affiliate_id ||
    ebayId !== initialSettings.ebay_affiliate_id ||
    walmartId !== initialSettings.walmart_affiliate_id ||
    bestbuyId !== initialSettings.bestbuy_affiliate_id ||
    macysId !== initialSettings.macys_affiliate_id ||
    neweggId !== initialSettings.newegg_affiliate_id ||
    wootId !== initialSettings.woot_affiliate_id;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <CustomSpinner />
    </div>
  )

  const affiliateStores = [
    {
      id: 'amazon',
      name: 'Amazon US',
      key: 'amazon_affiliate_id',
      value: amazonId,
      setValue: setAmazonId,
      initialValue: initialSettings.amazon_affiliate_id,
      placeholder: 'e.g. azondeal-20',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      brandColor: '#FF9900',
      desc: 'Associates Program Store Tag ID.'
    },
    {
      id: 'ebay',
      name: 'eBay Partner Network',
      key: 'ebay_affiliate_id',
      value: ebayId,
      setValue: setEbayId,
      initialValue: initialSettings.ebay_affiliate_id,
      placeholder: 'e.g. 5338123456',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      brandColor: '#0064D2',
      desc: '10-digit Campaign ID (campid).'
    },
    {
      id: 'walmart',
      name: 'Walmart Impact',
      key: 'walmart_affiliate_id',
      value: walmartId,
      setValue: setWalmartId,
      initialValue: initialSettings.walmart_affiliate_id,
      placeholder: 'e.g. 2381234',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      brandColor: '#0071CE',
      desc: 'Impact Radius Publisher ID.'
    },
    {
      id: 'bestbuy',
      name: 'Best Buy E-Commerce',
      key: 'bestbuy_affiliate_id',
      value: bestbuyId,
      setValue: setBestbuyId,
      initialValue: initialSettings.bestbuy_affiliate_id,
      placeholder: 'e.g. 33145',
      badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-200',
      brandColor: '#FEE500',
      desc: 'Best Buy Affiliate / IR ID.'
    },
    {
      id: 'macys',
      name: "Macy's Program",
      key: 'macys_affiliate_id',
      value: macysId,
      setValue: setMacysId,
      initialValue: initialSettings.macys_affiliate_id,
      placeholder: 'e.g. macyspartner',
      badgeColor: 'bg-red-100 text-red-800 border-red-200',
      brandColor: '#E01A22',
      desc: "Macy's Partner ID or network tag."
    },
    {
      id: 'newegg',
      name: 'Newegg Affiliate',
      key: 'newegg_affiliate_id',
      value: neweggId,
      setValue: setNeweggId,
      initialValue: initialSettings.newegg_affiliate_id,
      placeholder: 'e.g. neweggpartner',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
      brandColor: '#F58220',
      desc: 'Newegg network identification key.'
    },
    {
      id: 'woot',
      name: 'Woot! Campaign',
      key: 'woot_affiliate_id',
      value: wootId,
      setValue: setWootId,
      initialValue: initialSettings.woot_affiliate_id,
      placeholder: 'e.g. wootcamp',
      badgeColor: 'bg-lime-100 text-lime-800 border-lime-200',
      brandColor: '#80AE24',
      desc: 'Woot custom campaign tracking tag.'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20 space-y-10">
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50"
          >
            <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md ${
              message.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="font-bold text-sm tracking-tight">{message.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-10">
        <div className="flex items-center gap-4 border-b border-zinc-100 pb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight uppercase">App Settings</h1>
            <p className="text-zinc-500 text-sm font-bold tracking-wide">Manage global website configuration</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
            <CardBody className="p-0">
              <div className="bg-zinc-50 px-8 py-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-orange-500">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-zinc-900 uppercase tracking-wider text-sm">Affiliate Integrations</h3>
                    <p className="text-[11px] text-zinc-400 font-bold">Configure your affiliate tracking IDs for all supported stores</p>
                  </div>
                </div>
                
                <Button 
                  color={isAffiliatesDirty ? "primary" : "default"}
                  disabled={!isAffiliatesDirty}
                  className={`h-11 px-6 font-bold rounded-xl shadow-lg transition-all duration-300 ${
                    isAffiliatesDirty 
                      ? 'shadow-primary/25 bg-primary text-white' 
                      : 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none'
                  }`}
                  isLoading={saving}
                  onPress={handleSaveAllAffiliates}
                  startContent={!saving && <Save size={16} />}
                >
                  {saving ? 'Saving...' : 'Save All Accounts'}
                </Button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {affiliateStores.map((store) => {
                    const isFieldDirty = store.value !== store.initialValue
                    return (
                      <div 
                        key={store.id} 
                        className="p-5 rounded-[24px] bg-zinc-50/50 border border-zinc-100 hover:border-zinc-200 transition-all duration-200 relative group"
                        style={{ borderLeft: `4px solid ${store.brandColor}` }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-xs font-black uppercase text-zinc-700 tracking-tight block">
                              {store.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                              {store.desc}
                            </span>
                          </div>
                          {isFieldDirty && (
                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 rounded-full border border-orange-200 animate-pulse">
                              Unsaved
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Input
                            placeholder={store.placeholder}
                            value={store.value}
                            onChange={(e) => store.setValue(e.target.value)}
                            className="flex-1"
                            classNames={{
                              inputWrapper: "h-11 bg-white border-zinc-200 hover:border-zinc-300 focus-within:!border-zinc-400 rounded-xl shadow-sm"
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-none shadow-sm rounded-[40px] overflow-hidden border border-zinc-100">
            <CardBody className="p-8 sm:p-10 space-y-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-zinc-900 rounded-[24px] flex items-center justify-center text-primary shadow-xl shadow-zinc-200">
                  <FolderOpen size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Uploads Manager</h3>
                  <p className="text-zinc-500 text-sm font-medium mt-1">Export your data for backup or import to restore files.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-[32px] bg-zinc-50 border border-zinc-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-zinc-600 shadow-sm">
                        <Save size={14} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Export Backup</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {exportProgress !== null ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-primary">
                          <span>Downloading...</span>
                          <span>{exportProgress}%</span>
                        </div>
                        <CustomProgressBar value={exportProgress} />
                      </div>
                    ) : (
                      <Button 
                        variant="solid"
                        fullWidth
                        className="bg-white text-zinc-900 border border-zinc-200 font-bold h-14 rounded-2xl shadow-sm hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all duration-300"
                        onPress={handleExport}
                        startContent={<RefreshCcw size={18} className="rotate-180" />}
                      >
                        Download ZIP
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-6 rounded-[32px] bg-zinc-50 border border-zinc-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-zinc-600 shadow-sm">
                        <RefreshCcw size={14} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Import Restore</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {importProgress !== null ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-primary">
                          <span>Uploading...</span>
                          <span>{importProgress}%</span>
                        </div>
                        <CustomProgressBar value={importProgress} />
                      </div>
                    ) : (
                      <div className="relative group">
                        <input
                          type="file"
                          accept=".zip"
                          onChange={handleImport}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <Button 
                          variant="solid"
                          fullWidth
                          className="bg-zinc-900 text-white font-bold h-14 rounded-2xl shadow-xl shadow-zinc-200 group-hover:scale-[1.02] transition-transform"
                          startContent={<Save size={18} className="rotate-180" />}
                        >
                          Upload ZIP
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-center text-zinc-400 font-bold uppercase tracking-widest">
                Warning: Importing will overwrite existing files in the uploads folder.
              </p>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden">
            <CardBody className="p-0">
              <div className="bg-zinc-50 px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-500">
                    <RefreshCcw size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-zinc-900 uppercase tracking-wider text-sm">Advanced Scripts</h3>
                    <p className="text-[11px] text-zinc-400 font-bold">Inject custom code into Header and Footer</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-zinc-700">Header Scripts (Inside &lt;head&gt;)</label>
                      <Button 
                        size="sm" 
                        variant="flat" 
                        className="h-8 rounded-xl font-bold text-xs"
                        onPress={() => handleSave('header_scripts', headerScripts)}
                        isLoading={saving}
                      >
                        Update Head
                      </Button>
                    </div>
                    <textarea
                      placeholder="<!-- Google Tag Manager, Custom CSS, etc. -->"
                      value={headerScripts}
                      onChange={(e) => setHeaderScripts(e.target.value)}
                      className="w-full min-h-[120px] p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl text-xs font-mono text-zinc-600 focus:border-primary/30 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-zinc-700">Footer Scripts (Before &lt;/body&gt;)</label>
                      <Button 
                        size="sm" 
                        variant="flat" 
                        className="h-8 rounded-xl font-bold text-xs"
                        onPress={() => handleSave('footer_scripts', footerScripts)}
                        isLoading={saving}
                      >
                        Update Footer
                      </Button>
                    </div>
                    <textarea
                      placeholder="<!-- Analytics tracking codes, Custom JS, etc. -->"
                      value={footerScripts}
                      onChange={(e) => setFooterScripts(e.target.value)}
                      className="w-full min-h-[120px] p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl text-xs font-mono text-zinc-600 focus:border-primary/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="flex gap-3">
                    <AlertCircle className="text-blue-500 shrink-0" size={18} />
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                      <strong>Security Note:</strong> These scripts will be injected directly into your pages. Be extremely careful with the code you paste here, as invalid JavaScript can break your website.
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Sync Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-sm rounded-[32px] bg-zinc-900 text-white p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <RefreshCcw className="text-primary animate-spin-slow" size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Need to sync data?</h3>
                  <p className="text-zinc-400 text-sm font-medium mt-1">If you update scripts or affiliate IDs, refresh your browser to see changes.</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="text-white font-bold h-12 rounded-2xl px-6 border-white/20 hover:bg-white/10"
                onPress={() => window.location.reload()}
              >
                Refresh Dashboard
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-100 text-green-700' 
                : 'bg-red-50 border-red-100 text-red-700'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold text-sm">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
