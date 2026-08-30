'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card"
import { Button } from "@heroui/button"
import { Table, Pagination } from "@heroui/react"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal"
import { Spinner } from "@heroui/spinner"
import { Input } from "@heroui/input"
import { Divider } from "@heroui/divider"
import { Plus, Edit2, Trash2, Save, X, ImageIcon, Monitor, Smartphone, Upload, CloudUpload, FileImage, Image as ImageIcon2, Link2 } from 'lucide-react'
import Image from 'next/image'
import { BlurImage } from '@/components/BlurImage'

interface HeroSlide {
  id: number
  desktop: string
  mobile: string
  alt: string
  link?: string
  order: number
}

const LAYOUT_SLOTS = [
  { order: 0, label: "Left Top", ratio: "aspect-square", displayRatio: "1:1", span: "" },
  { order: 1, label: "Left Bottom", ratio: "aspect-video", displayRatio: "16:9", span: "" },
  { order: 2, label: "Middle Top", ratio: "aspect-[21/9]", displayRatio: "21:9", span: "" },
  { order: 3, label: "Middle Bottom", ratio: "aspect-[8/9]", displayRatio: "8:9", span: "" },
  { order: 4, label: "Right Top", ratio: "aspect-video", displayRatio: "16:9", span: "" },
  { order: 5, label: "Right Bottom", ratio: "aspect-square", displayRatio: "1:1", span: "" },
]

interface ImageUploadProps {
  label: string
  value?: string
  onChange: (value: string) => void
  icon: React.ReactNode
  aspectRatio?: string
}

function ImageUpload({ label, value, onChange, icon, aspectRatio = "aspect-video" }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new (window as any).Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Max dimension 1920
        const maxDim = 1920
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = (maxDim / width) * height
            width = maxDim
          } else {
            width = (maxDim / height) * width
            height = maxDim
          }
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Compress to WebP with 0.8 quality for better compression
        const compressedBase64 = canvas.toDataURL('image/webp', 0.8)
        onChange(compressedBase64)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [onChange])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const item = e.clipboardData.items[0]
    if (item?.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) handleFile(file)
    }
  }, [handleFile])

  return (
    <div className="space-y-2" onPaste={onPaste}>
      <span className="text-sm font-bold text-zinc-700 ml-1">{label}</span>
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-[24px] border-2 border-dashed transition-all cursor-pointer group ${
          isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-zinc-200 hover:border-blue-400 hover:bg-zinc-50/50'
        } ${aspectRatio} flex flex-col items-center justify-center gap-3`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
        
        {value ? (
          <>
            <Image src={value} alt="Preview" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm">
              <CloudUpload size={32} className="mb-2 animate-bounce" />
              <span className="font-bold text-xs uppercase tracking-wider">Drop or Paste to Replace</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-400 p-6 text-center">
            <div className="p-4 bg-zinc-100 rounded-2xl mb-4 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
              <CloudUpload size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-900">Click, Drag, or Paste</p>
              <p className="text-[11px] font-medium text-zinc-400">SVG, PNG, JPG or GIF (Max 5MB)</p>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 text-zinc-400 opacity-40">
          {icon}
        </div>
      </div>
    </div>
  )
}

export default function AdminHeroPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const onOpen = () => setIsOpen(true)
  const onClose = () => setIsOpen(false)
  
  const [currentSlide, setCurrentSlide] = useState<Partial<HeroSlide>>({
    desktop: '',
    mobile: '',
    alt: '',
    link: '',
    order: 0
  })

  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/hero')
      const data = await res.json()
      setSlides(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (slide: HeroSlide) => {
    setCurrentSlide(slide)
    onOpen()
  }

  const handleAdd = (order?: number) => {
    setCurrentSlide({
      desktop: '',
      mobile: '',
      alt: '',
      link: '',
      order: typeof order === 'number' ? order : slides.length
    })
    onOpen()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this slide?')) return
    
    try {
      await fetch(`/api/admin/hero?id=${id}`, { method: 'DELETE' })
      setSlides(slides.filter(s => s.id !== id))
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleSave = async () => {
    console.log('handleSave triggered', { id: currentSlide.id, order: currentSlide.order })
    try {
      setSaving(true)
      
      const formData = new FormData()
      if (currentSlide.id) formData.append('id', currentSlide.id.toString())
      if (currentSlide.alt) formData.append('alt', currentSlide.alt)
      if (currentSlide.link) formData.append('link', currentSlide.link)
      formData.append('order', (currentSlide.order || 0).toString())

      // Helper to handle both URLs and Base64
      const appendImage = async (field: string, value: string) => {
        if (value.startsWith('data:image/')) {
          const res = await fetch(value)
          const blob = await res.blob()
          formData.append(field, blob, `${field}.jpg`)
        } else {
          formData.append(field, value)
        }
      }

      await appendImage('desktop', currentSlide.desktop || '')
      await appendImage('mobile', currentSlide.mobile || '')

      const res = await fetch('/api/admin/hero', {
        method: 'POST',
        body: formData
        // Note: Don't set Content-Type header when sending FormData
      })
      
      if (res.ok) {
        await fetchSlides()
        onClose()
      } else {
        const errorData = await res.json()
        alert(`Failed to save: ${errorData.error || 'Unknown error'}\nDetails: ${errorData.details || 'No details available'}`)
      }
    } catch (err) {
      console.error('Save error:', err)
      alert(`An error occurred while saving: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" color="current" className="text-primary" />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Visual Layout Manager */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Layout Preview</h2>
                  <p className="text-zinc-500 text-sm">Click any slot to add or change an image</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
                {/* Column 1 */}
                <div className="flex flex-col gap-6">
                  {[LAYOUT_SLOTS[0], LAYOUT_SLOTS[1]].map((slot) => {
                    const slide = slides.find(s => s.order === slot.order)
                    return (
                      <div 
                        key={slot.order}
                        onClick={() => slide ? handleEdit(slide) : handleAdd(slot.order)}
                        className={`group relative overflow-hidden rounded-[24px] border-2 border-dashed transition-all cursor-pointer ${
                          slide ? 'border-transparent shadow-lg hover:scale-[1.02]' : 'border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50'
                        } ${slot.ratio}`}
                      >
                        {slide ? (
                          <>
                            <Image src={slide.desktop} alt={slide.alt} fill className="object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                              <Edit2 size={24} className="mb-2" />
                              <span className="font-bold text-xs uppercase tracking-wider">Change Image</span>
                            </div>
                            <div className="absolute top-4 left-4 flex flex-col gap-1">
                              <div className="bg-white/90 backdrop-blur-md text-zinc-900 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm w-fit">
                                Slot #{slot.order + 1}
                              </div>
                              <div className="bg-blue-600/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm w-fit">
                                {slot.displayRatio}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-2">
                            <div className="p-3 bg-zinc-50 rounded-2xl">
                              <Plus size={20} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">{slot.label}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Column 2 */}
                <div className="flex flex-col gap-6">
                  {[LAYOUT_SLOTS[2], LAYOUT_SLOTS[3]].map((slot) => {
                    const slide = slides.find(s => s.order === slot.order)
                    return (
                      <div 
                        key={slot.order}
                        onClick={() => slide ? handleEdit(slide) : handleAdd(slot.order)}
                        className={`group relative overflow-hidden rounded-[24px] border-2 border-dashed transition-all cursor-pointer ${
                          slide ? 'border-transparent shadow-lg hover:scale-[1.02]' : 'border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50'
                        } ${slot.ratio}`}
                      >
                        {slide ? (
                          <>
                            <Image src={slide.desktop} alt={slide.alt} fill className="object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                              <Edit2 size={24} className="mb-2" />
                              <span className="font-bold text-xs uppercase tracking-wider">Change Image</span>
                            </div>
                            <div className="absolute top-4 left-4 flex flex-col gap-1">
                              <div className="bg-white/90 backdrop-blur-md text-zinc-900 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm w-fit">
                                Slot #{slot.order + 1}
                              </div>
                              <div className="bg-blue-600/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm w-fit">
                                {slot.displayRatio}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-2">
                            <div className="p-3 bg-zinc-50 rounded-2xl">
                              <Plus size={20} />
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-bold uppercase tracking-widest">{slot.label}</span>
                              <span className="text-[10px] font-medium opacity-60">Ratio: {slot.displayRatio}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Column 3 */}
                <div className="flex flex-col gap-6">
                  {[LAYOUT_SLOTS[4], LAYOUT_SLOTS[5]].map((slot) => {
                    const slide = slides.find(s => s.order === slot.order)
                    return (
                      <div 
                        key={slot.order}
                        onClick={() => slide ? handleEdit(slide) : handleAdd(slot.order)}
                        className={`group relative overflow-hidden rounded-[24px] border-2 border-dashed transition-all cursor-pointer ${
                          slide ? 'border-transparent shadow-lg hover:scale-[1.02]' : 'border-zinc-200 hover:border-blue-400 hover:bg-blue-50/50'
                        } ${slot.ratio}`}
                      >
                        {slide ? (
                          <>
                            <Image src={slide.desktop} alt={slide.alt} fill className="object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                              <Edit2 size={24} className="mb-2" />
                              <span className="font-bold text-xs uppercase tracking-wider">Change Image</span>
                            </div>
                            <div className="absolute top-4 left-4 flex flex-col gap-1">
                              <div className="bg-white/90 backdrop-blur-md text-zinc-900 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm w-fit">
                                Slot #{slot.order + 1}
                              </div>
                              <div className="bg-blue-600/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm w-fit">
                                {slot.displayRatio}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-2">
                            <div className="p-3 bg-zinc-50 rounded-2xl">
                              <Plus size={20} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">{slot.label}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <Divider />

            {/* List View */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Previous Slides History</h2>
                <p className="text-zinc-500 text-sm">Detailed history of all hero images</p>
              </div>
              <Card className="border-none shadow-xl shadow-zinc-200/50 rounded-[32px] overflow-hidden">
            <Table variant="secondary" className="bg-white">
              <Table.ScrollContainer>
                <Table.Content aria-label="Hero slides table">
                  <Table.Header>
                    <Table.Column className="bg-zinc-50 text-zinc-500 font-bold uppercase text-xs px-6 py-4">Preview</Table.Column>
                    <Table.Column isRowHeader className="bg-zinc-50 text-zinc-500 font-bold uppercase text-xs px-6 py-4">Alt / Title</Table.Column>
                    <Table.Column className="bg-zinc-50 text-zinc-500 font-bold uppercase text-xs px-6 py-4 text-right">Actions</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {slides.map((slide) => (
                      <Table.Row id={slide.id} key={slide.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                        <Table.Cell className="px-6 py-4">
                          <div className="flex gap-3">
                            <div className="relative group w-24 h-14">
                              <BlurImage
                                src={slide.desktop}
                                alt="Desktop"
                                className="rounded-xl shadow-sm border border-zinc-200"
                                objectFit="cover"
                              />
                              <div className="absolute -top-2 -left-2 bg-white p-1 rounded-lg shadow-md z-20">
                                <Monitor size={12} className="text-zinc-400" />
                              </div>
                            </div>
                            <div className="relative group w-10 h-14">
                              <BlurImage
                                src={slide.mobile}
                                alt="Mobile"
                                className="rounded-xl shadow-sm border border-zinc-200"
                                objectFit="cover"
                              />
                              <div className="absolute -top-2 -left-2 bg-white p-1 rounded-lg shadow-md z-20">
                                <Smartphone size={12} className="text-zinc-400" />
                              </div>
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4">
                          <span className="font-bold text-zinc-700">{slide.alt}</span>
                        </Table.Cell>
                        <Table.Cell className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              isIconOnly 
                              variant="ghost" 
                              onPress={() => handleEdit(slide)}
                              className="text-blue-500 hover:bg-blue-50 rounded-xl"
                            >
                              <Edit2 size={18} />
                            </Button>
                            <Button 
                              isIconOnly 
                              variant="ghost" 
                              className="text-danger hover:bg-danger-50 rounded-xl"
                              onPress={() => handleDelete(slide.id)}
                            >
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
            {slides.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <div className="size-20 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                  <ImageIcon size={40} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900">No slides found</h3>
                  <p className="text-zinc-500">Start by adding your first hero slide</p>
                </div>
              </div>
            )}
          </Card>
            </div>
          </div>
        )}

      {/* Edit/Add Modal */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={setIsOpen}
        size="4xl"
        scrollBehavior="inside"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "bg-white rounded-[32px] shadow-2xl border-none",
          header: "px-8 pt-8 pb-4",
          body: "px-8 py-4",
          footer: "px-8 pb-8 pt-4"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <ImageIcon size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                    {currentSlide.id ? 'Edit Hero Slide' : 'Add New Hero Slide'}
                  </h2>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col xl:flex-row gap-8">
                  <div className="flex-[2] flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <ImageUpload 
                        label="Desktop Image (1920x1080)"
                        value={currentSlide.desktop}
                        onChange={(val) => setCurrentSlide({...currentSlide, desktop: val})}
                        icon={<Monitor size={20} />}
                        aspectRatio="aspect-video"
                      />
                    </div>

                    <div className="flex-1">
                      <ImageUpload 
                        label="Mobile Image (800x1200)"
                        value={currentSlide.mobile}
                        onChange={(val) => setCurrentSlide({...currentSlide, mobile: val})}
                        icon={<Smartphone size={20} />}
                        aspectRatio="aspect-[3/4]"
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                      <label className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] ml-1">Image Alt Text / Title</label>
                      <Input 
                        placeholder={`E.g. Summer Sale ${new Date().getFullYear()}`}
                        value={currentSlide.alt}
                        onValueChange={(val) => setCurrentSlide({...currentSlide, alt: val})}
                        variant="flat"
                        classNames={{
                          inputWrapper: "bg-zinc-50 border-none rounded-2xl h-14 px-4 hover:bg-zinc-100 transition-colors",
                          input: "font-bold text-zinc-900"
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] ml-1">Target Link (URL)</label>
                      <Input 
                        placeholder="https://example.com/deals"
                        value={currentSlide.link}
                        onValueChange={(val) => setCurrentSlide({...currentSlide, link: val})}
                        variant="flat"
                        startContent={<Link2 size={18} className="text-zinc-400" />}
                        classNames={{
                          inputWrapper: "bg-zinc-50 border-none rounded-2xl h-14 px-4 hover:bg-zinc-100 transition-colors",
                          input: "font-bold text-zinc-900 ml-1"
                        }}
                      />
                    </div>

                    <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[32px] space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20">
                          <ImageIcon2 size={18} />
                        </div>
                        <h4 className="font-bold text-zinc-900">Upload Tip</h4>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                        For best results, use high-quality images. Desktop slides should be landscape (16:9) and Mobile slides should be portrait (3:4 or 4:5). You can also <b>paste</b> images directly from your clipboard!
                      </p>
                    </div>
                  </div>
                </div>

                <Divider className="my-8" />

                <div className="space-y-4">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Live Preview</span>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100 aspect-video relative flex items-center justify-center">
                      {currentSlide.desktop ? (
                        <Image src={currentSlide.desktop} alt="Preview" width={400} height={225} className="w-full h-full object-cover" />
                      ) : (
                        <Monitor size={40} className="text-zinc-200" />
                      )}
                    </div>
                    <div className="flex-1 bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100 aspect-[9/12] relative flex items-center justify-center">
                      {currentSlide.mobile ? (
                        <Image src={currentSlide.mobile} alt="Preview" width={200} height={267} className="w-full h-full object-cover" />
                      ) : (
                        <Smartphone size={40} className="text-zinc-200" />
                      )}
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button 
                  variant="ghost" 
                  onPress={onClose} 
                  className="font-bold rounded-xl"
                >
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleSave} 
                  isLoading={saving}
                  startContent={!saving && <Save size={18} />}
                  className="font-bold rounded-xl shadow-lg shadow-blue-500/20 px-8"
                >
                  Save Changes
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

    </div>
  )
}
