'use client'

import React, { useState, useEffect, useCallback } from "react"
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter 
} from "@heroui/modal"
import { Tabs, Tab } from "@heroui/tabs"
import { Divider } from "@heroui/divider"
import { Button } from "@heroui/button"
import { Input, Textarea } from "@heroui/input"
import { Select, SelectItem } from "@heroui/select"
import { deleteCategory, getAllCategories } from "@/app/admin/categories/actions"
import { Image as ImageIcon, Globe, Search, Settings2, FolderTree, Upload, X, AlertCircle } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

interface CategoryFormProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  category?: any
  allCategories: any[]
  onSuccess: () => void
}

const ImageUpload = ({ 
  label, 
  value, 
  onChange, 
  existingImage 
}: { 
  label: string, 
  value: File | null, 
  onChange: (file: File | null) => void,
  existingImage?: string 
}) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (value) {
      const objectUrl = URL.createObjectURL(value)
      setPreview(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      if (existingImage) {
        // Construct absolute URL for production preview if needed
        const fullUrl = existingImage.startsWith('/uploads/') 
          ? `https://azondeal.com${existingImage}` 
          : existingImage
        setPreview(fullUrl)
      } else {
        setPreview(null)
      }
    }
  }, [value, existingImage])

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new (window as any).Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Optimize for categories (max 1200)
        const maxDim = 1200
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
        
        // Convert to WebP for best compression
        canvas.toBlob((blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now()
            })
            onChange(optimizedFile)
          }
        }, 'image/webp', 0.8)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [onChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [handleFile])

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative group h-44 rounded-[2.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden bg-zinc-50/50 ${
          isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-zinc-200 hover:border-primary/40 hover:bg-zinc-100/50"
        }`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
              <label className="p-3 bg-white rounded-2xl cursor-pointer hover:scale-110 active:scale-95 transition-all text-zinc-700 shadow-xl">
                <Upload size={20} />
                <input type="file" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} accept="image/*" />
              </label>
              <button 
                type="button"
                onClick={() => { onChange(null); setPreview(null); }}
                className="p-3 bg-red-500 rounded-2xl hover:scale-110 active:scale-95 transition-all text-white shadow-xl shadow-red-500/20"
              >
                <X size={20} />
              </button>
            </div>
          </>
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
            <div className="p-4 bg-white rounded-[1.5rem] shadow-sm mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all text-zinc-400 group-hover:text-primary">
              <Upload size={24} />
            </div>
            <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Upload</p>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider font-bold">WebP, PNG, JPG</p>
            <input type="file" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} accept="image/*" />
          </label>
        )}
      </div>
    </div>
  )
}

export default function CategoryForm({ 
  isOpen, 
  onOpenChange, 
  category, 
  allCategories,
  onSuccess 
}: CategoryFormProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<any>("basic")
  const [type, setType] = useState<"mother" | "child">("mother")
  const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: "" })

  const showToast = (message: string) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: "" }), 5000)
  }

  const [formData, setFormData] = useState<any>({
    id: "",
    name: "",
    slug: "",
    parentId: "",
    searchKeyword: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  })

  const [images, setImages] = useState({
    small: null as File | null,
    medium: null as File | null,
    large: null as File | null,
  })

  useEffect(() => {
    if (category) {
      setFormData({
        id: category.id.toString(),
        name: category.name || "",
        slug: category.slug || "",
        parentId: category.parentId?.toString() || "",
        searchKeyword: category.searchKeyword || "",
        seoTitle: category.seoTitle || "",
        seoDescription: category.seoDescription || "",
        seoKeywords: category.seoKeywords || "",
      })
      setType(category.parentId ? "child" : "mother")
    } else {
      setFormData({
        id: "",
        name: "",
        slug: "",
        parentId: "",
        searchKeyword: "",
        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",
      })
      setType("mother")
    }
    setImages({ small: null, medium: null, large: null })
  }, [category, isOpen])

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev, [field]: value }
      if (field === "name" && !category) {
        newData.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      }
      return newData
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const data = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value as string)
    })

    if (type === "mother") {
      data.delete("parentId")
    }

    if (images.small) data.append("imageSmall", images.small)
    if (images.medium) data.append("imageMedium", images.medium)
    if (images.large) data.append("imageLarge", images.large)

    const response = await fetch("/api/admin/categories/upload", {
      method: "POST",
      body: data,
    })
    
    const result = await response.json()
    
    if (result.success) {
      onSuccess()
      onOpenChange(false)
    } else {
      showToast(result.error || "Failed to save category")
    }
    setLoading(false)
  }

  const parentOptions = allCategories.filter(cat => !cat.parentId && cat.id !== category?.id)

  return (
    <>
      {/* Custom Error Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md"
          >
            <div className="bg-red-50 border border-red-200 shadow-2xl rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="text-red-600" size={22} />
              </div>
              <div className="flex-1">
                <h4 className="text-red-950 font-bold text-sm">স্লাগ পরিবর্তন করতে হবে</h4>
                <p className="text-red-700 text-xs font-semibold">{toast.message}</p>
              </div>
              <button 
                type="button"
                onClick={() => setToast({ show: false, message: "" })} 
                className="text-red-400 hover:text-red-600 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
      size="3xl"
      scrollBehavior="inside"
      className="bg-white"
      classNames={{
        base: "max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden",
        header: "px-10 py-8 border-b border-zinc-100 bg-white",
        body: "px-10 py-6 bg-white",
        footer: "px-10 pb-10 pt-4 flex gap-4 bg-zinc-50/50 border-t border-zinc-100",
        closeButton: "hover:bg-zinc-100 active:bg-zinc-200 transition-all rounded-full p-2 mt-2 mr-2 z-50"
      }}
    >
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit}>
            <ModalHeader className="px-10 py-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-[1.5rem] text-primary">
                  <FolderTree size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{category ? "Update Category" : "New Category"}</h2>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Manage your voucher hierarchy</p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="px-10 py-6">
              <Tabs 
                aria-label="Category Options" 
                selectedKey={activeTab} 
                onSelectionChange={setActiveTab}
                variant="underlined"
                className="w-full"
                classNames={{
                  base: "w-full",
                  tabList: "gap-10 border-b border-zinc-100 p-0 w-full relative",
                  cursor: "bg-primary h-1 rounded-full bottom-0 shadow-[0_-2px_10px_rgba(var(--primary-rgb),0.3)]",
                  tab: "h-14 px-0 font-black uppercase tracking-[0.15em] text-[11px] transition-all duration-300",
                  tabContent: "group-data-[selected=true]:text-primary group-data-[selected=true]:scale-110 transition-transform"
                }}
              >
                <Tab 
                  key="basic" 
                  title={
                    <div className="flex items-center space-x-2">
                      <Settings2 size={16} />
                      <span>General</span>
                    </div>
                  }
                >
                  <div className="space-y-8 pt-8">
                    <div className="bg-zinc-50/50 p-6 rounded-[2rem] border border-zinc-100 space-y-6">
                      <div className="flex items-center justify-center p-1.5 bg-white rounded-2xl border border-zinc-200 w-fit mx-auto shadow-sm">
                        <button 
                          type="button"
                          onClick={() => setType("mother")}
                          className={`px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                            type === "mother" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-400 hover:text-zinc-600"
                          }`}
                        >
                          Mother
                        </button>
                        <button 
                          type="button"
                          onClick={() => setType("child")}
                          className={`px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                            type === "child" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-zinc-400 hover:text-zinc-600"
                          }`}
                        >
                          Child
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Name</label>
                          <Input 
                            isRequired
                            placeholder="e.g. Electronics"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            variant="flat"
                            className="w-full"
                            classNames={{
                              input: "bg-white",
                              inputWrapper: "h-12 bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm"
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Slug</label>
                          <Input 
                            isRequired
                            placeholder="electronics-deals"
                            value={formData.slug}
                            onChange={(e) => handleChange("slug", e.target.value)}
                            variant="flat"
                            className="w-full"
                            classNames={{
                              input: "bg-white",
                              inputWrapper: "h-12 bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm"
                            }}
                          />
                        </div>
                      </div>

                      {type === "child" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                          <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Select Mother Category</label>
                          <Select 
                            isRequired
                            placeholder="Choose a parent"
                            selectedKeys={formData.parentId ? [formData.parentId] : []}
                            onSelectionChange={(keys) => handleChange("parentId", Array.from(keys)[0] as string)}
                            variant="flat"
                            classNames={{
                              trigger: "h-12 bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 focus-within:border-primary transition-all shadow-sm",
                              value: "text-zinc-700"
                            }}
                          >
                            {parentOptions.map((cat) => (
                              <SelectItem 
                                key={cat.id.toString()} 
                                textValue={cat.name}
                                className="cursor-pointer hover:bg-zinc-100 transition-colors rounded-xl py-2 px-3 data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                              >
                                {cat.name}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </Tab>

                <Tab 
                  key="images" 
                  title={
                    <div className="flex items-center space-x-2">
                      <ImageIcon size={16} />
                      <span>Visual Assets</span>
                    </div>
                  }
                >
                  <div className="space-y-6 pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <ImageUpload 
                        label="Small (Size 1)" 
                        value={images.small} 
                        onChange={(f) => setImages(p => ({...p, small: f}))}
                        existingImage={category?.imageSmall}
                      />
                      <ImageUpload 
                        label="Medium (Size 2)" 
                        value={images.medium} 
                        onChange={(f) => setImages(p => ({...p, medium: f}))}
                        existingImage={category?.imageMedium}
                      />
                      <ImageUpload 
                        label="Large (Size 3)" 
                        value={images.large} 
                        onChange={(f) => setImages(p => ({...p, large: f}))}
                        existingImage={category?.imageLarge}
                      />
                    </div>
                  </div>
                </Tab>

                <Tab 
                  key="seo" 
                  title={
                    <div className="flex items-center space-x-2">
                      <Globe size={16} />
                      <span>SEO & Data</span>
                    </div>
                  }
                >
                  <div className="space-y-6 pt-8 pb-4">
                    <div className="bg-zinc-50/50 p-6 rounded-[2rem] border border-zinc-100 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">SEO Title</label>
                        <Input 
                          placeholder="Meta title for search engines"
                          value={formData.seoTitle}
                          onChange={(e) => handleChange("seoTitle", e.target.value)}
                          variant="flat"
                          classNames={{
                            input: "bg-white",
                            inputWrapper: "h-12 bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 focus-within:border-primary transition-all shadow-sm"
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">SEO Description</label>
                        <Textarea 
                          placeholder="Meta description for search engines"
                          value={formData.seoDescription}
                          onChange={(e) => handleChange("seoDescription", e.target.value)}
                          variant="flat"
                          classNames={{
                            input: "bg-white py-3",
                            inputWrapper: "bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 focus-within:border-primary transition-all shadow-sm"
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">SEO Keywords</label>
                        <Input 
                          placeholder="Keyword1, Keyword2, etc."
                          value={formData.seoKeywords}
                          onChange={(e) => handleChange("seoKeywords", e.target.value)}
                          variant="flat"
                          classNames={{
                            input: "bg-white",
                            inputWrapper: "h-12 bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 focus-within:border-primary transition-all shadow-sm"
                          }}
                        />
                      </div>
                    </div>

                    <Divider className="my-2 bg-zinc-100" />

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-primary uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Search size={14} />
                        Search Keyword (Future Use)
                      </label>
                      <Input 
                        placeholder="Special internal keyword"
                        value={formData.searchKeyword}
                        onChange={(e) => handleChange("searchKeyword", e.target.value)}
                        variant="flat"
                        classNames={{
                          input: "placeholder:text-primary/30",
                          inputWrapper: "h-12 bg-primary/5 rounded-2xl border border-transparent hover:border-primary/20 focus-within:border-primary/40 transition-all"
                        }}
                      />
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
            <ModalFooter className="px-10 pb-10 pt-4 flex gap-4 bg-zinc-50/30">
              <Button 
                variant="ghost" 
                onPress={onClose}
                className="h-14 flex-1 rounded-2xl font-bold text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-all"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                isLoading={loading}
                className="h-14 flex-[2] rounded-2xl font-black uppercase tracking-[0.2em] bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {category ? "Save Changes" : "Create Category"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  </>
  )
}
