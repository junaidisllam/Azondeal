"use client" // Force re-compilation - Final Check

import React, { useEffect, useState, useMemo, useCallback } from "react"
import { Table, Pagination, Dropdown } from "@heroui/react"
import { Input } from "@heroui/input"
import { Button } from "@heroui/button"
import { Skeleton } from "@heroui/skeleton"
import { useDisclosure } from "@heroui/modal"
import { Chip } from "@heroui/chip"
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  FolderTree,
  MoreVertical,
  Globe
} from "lucide-react"
import { deleteCategory, getAllCategories } from "./actions"
import CategoryForm from "@/components/admin/CategoryForm"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { BlurImage } from "@/components/BlurImage"

const columnHelper = createColumnHelper<any>()

function getPaginationItems(currentPage: number, totalPages: number) {
  const delta = 2
  const left = currentPage - delta
  const right = currentPage + delta + 1
  const range = []
  const rangeWithDots = []
  let l

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) {
      range.push(i)
    }
  }

  for (const i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push("...")
      }
    }
    rangeWithDots.push(i)
    l = i
  }

  return rangeWithDots
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  const [allCategories, setAllCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const fetchData = useCallback(async (searchQuery = searchTerm, pageNum = page) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/categories/list?page=${pageNum}&limit=10&search=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories)
        setTotal(data.total)
      } else {
        console.error("Failed to fetch categories: status", res.status)
      }
      
      const allCats = await getAllCategories()
      setAllCategories(allCats)
    } catch (err) {
      console.error("Failed to fetch categories:", err)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, page])

  useEffect(() => {
    fetchData()
  }, [page, searchTerm, fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchTerm(query)
    setPage(1)
  }

  const handleAdd = () => {
    setSelectedCategory(null)
    onOpen()
  }

  const handleEdit = (category: any) => {
    setSelectedCategory(category)
    onOpen()
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      const result = await deleteCategory(id)
      if (result.success) {
        fetchData()
      } else {
        alert(result.error)
      }
    }
  }

  // Generate Skeleton Data
  const tableData = useMemo(() => {
    if (loading && categories.length === 0) {
      return Array.from({ length: 5 }).map((_, i) => ({ id: `skeleton-${i}`, isSkeleton: true }))
    }
    return categories
  }, [loading, categories])

  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      id: "name",
      header: "Category Name",
      cell: (info) => {
        const cat = info.row.original
        if (cat.isSkeleton) return <Skeleton className="w-32 h-5 rounded-md" />
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden shrink-0 relative">
              {cat.imageSmall ? (
                <BlurImage src={cat.imageSmall} alt={cat.name} objectFit="cover" />
              ) : (
                <FolderTree size={18} className="text-zinc-300" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-zinc-900 leading-tight">{cat.name}</span>
              <code className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{cat.slug}</code>
            </div>
          </div>
        )
      }
    }),
    columnHelper.accessor("parentId", {
      id: "type",
      header: "Type",
      cell: (info) => {
        const cat = info.row.original
        if (cat.isSkeleton) return <Skeleton className="w-20 h-6 rounded-xl" />
        const isChild = !!cat.parentId
        return (
          <Chip 
            variant="flat"
            className={`text-[10px] font-black uppercase tracking-widest px-2 h-6 border-none ${
              isChild ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"
            }`}
          >
            {isChild ? "Child" : "Mother"}
          </Chip>
        )
      }
    }),
    columnHelper.accessor((row) => row.parent?.name, {
      id: "parent",
      header: "Parent Category",
      cell: (info) => {
        const cat = info.row.original
        if (cat.isSkeleton) return <Skeleton className="w-24 h-5 rounded-md" />
        if (!cat.parent) return <span className="text-zinc-300 text-[11px] font-bold uppercase">Main Category</span>
        return (
          <div className="flex items-center gap-2 text-zinc-600 font-bold text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            {cat.parent.name}
          </div>
        )
      }
    }),
    columnHelper.accessor("seoTitle", {
      id: "seo",
      header: "SEO Status",
      cell: (info) => {
        const cat = info.row.original
        if (cat.isSkeleton) return <Skeleton className="w-16 h-5 rounded-md" />
        const hasSEO = !!cat.seoTitle || !!cat.seoDescription
        return (
          <div className={`flex items-center gap-1.5 font-bold text-[11px] ${hasSEO ? "text-green-500" : "text-zinc-300"}`}>
            <Globe size={14} />
            {hasSEO ? "OPTIMIZED" : "NOT SET"}
          </div>
        )
      }
    }),
    columnHelper.accessor("id", {
      header: "Actions",
      cell: (info) => {
        const cat = info.row.original
        if (cat.isSkeleton) {
          return (
            <div className="flex gap-2">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <Skeleton className="w-9 h-9 rounded-xl" />
            </div>
          )
        }
        return (
          <div className="flex gap-2">
            <Button
              isIconOnly
              variant="ghost"
              className="w-10 h-10 min-w-0 bg-zinc-50 hover:bg-zinc-900 hover:text-white text-zinc-500 rounded-2xl transition-all"
              onPress={() => handleEdit(cat)}
            >
              <Edit2 size={16} />
            </Button>
            <Button
              isIconOnly
              variant="ghost"
              className="w-10 h-10 min-w-0 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-2xl transition-all"
              onPress={() => handleDelete(cat.id)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )
      }
    })
  ], [handleEdit, handleDelete])

  const table = useReactTable({
    columns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / 10),
  })

  // Pagination calculation
  const pageCount = table.getPageCount()
  const pages = getPaginationItems(page, pageCount)
  const start = (page - 1) * 10 + 1
  const end = Math.min(page * 10, total)

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm border border-zinc-50">
        <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={20} />
          <Input 
            placeholder="Search categories by name or slug..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 h-12 bg-zinc-50 border-none rounded-2xl focus:bg-white transition-all shadow-none"
          />
          <button type="submit" className="hidden" />
        </form>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            className="h-12 rounded-2xl font-black uppercase tracking-widest text-[12px] bg-primary text-white px-8 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            onPress={handleAdd}
          >
            <Plus size={20} className="mr-2" />
            Add New Category
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-zinc-50 overflow-hidden">
        <Table>
          <Table.ScrollContainer>
            <Table.Content
              aria-label="Categories list"
              className="min-w-[800px]"
            >
              <Table.Header>
                {table.getHeaderGroups()[0]!.headers.map((header) => (
                  <Table.Column
                    key={header.id}
                    id={header.id}
                    isRowHeader={header.id === "name"}
                    className="text-zinc-500 font-bold tracking-widest text-[11px] uppercase py-4"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body
                renderEmptyState={() => {
                  if (loading) return null;
                  return (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4">
                      <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center">
                        <FolderTree size={40} className="text-zinc-200" />
                      </div>
                      <p className="font-bold uppercase tracking-widest text-[11px]">No categories found</p>
                    </div>
                  )
                }}
              >
                {table.getRowModel().rows.map((row) => (
                  <Table.Row key={row.id} id={row.id} className="hover:bg-zinc-50/50 transition-colors group">
                    {row.getVisibleCells().map((cell) => (
                      <Table.Cell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
          
          {total > 10 && (
            <Table.Footer>
              <div className="flex w-full justify-between items-center p-6 bg-white border-t border-zinc-50">
                <Pagination size="sm" className="w-full">
                  <Pagination.Summary className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest">
                    Showing {start} to {end} of {total} results
                  </Pagination.Summary>
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.Previous
                        isDisabled={page === 1}
                        onPress={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <Pagination.PreviousIcon />
                        Prev
                      </Pagination.Previous>
                    </Pagination.Item>
                    {pages.map((p, idx) => (
                      <Pagination.Item key={p === "..." ? `ellipsis-${idx}` : p}>
                        {p === "..." ? (
                          <Pagination.Ellipsis />
                        ) : (
                          <Pagination.Link
                            isActive={p === page}
                            onPress={() => setPage(p as number)}
                          >
                            {p}
                          </Pagination.Link>
                        )}
                      </Pagination.Item>
                    ))}
                    <Pagination.Item>
                      <Pagination.Next
                        isDisabled={page === pageCount}
                        onPress={() => setPage((p) => Math.min(pageCount, p + 1))}
                      >
                        Next
                        <Pagination.NextIcon />
                      </Pagination.Next>
                    </Pagination.Item>
                  </Pagination.Content>
                </Pagination>
              </div>
            </Table.Footer>
          )}
        </Table>
      </div>

      <CategoryForm 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        category={selectedCategory}
        allCategories={allCategories}
        onSuccess={fetchData}
      />
    </div>
  )
}
