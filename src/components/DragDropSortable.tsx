"use client"

import { useState, useRef, useEffect } from 'react'

interface DragDropSortableProps<T> {
  items: T[]
  onReorder: (newItems: T[]) => void
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode
  renderAddNew?: () => React.ReactNode
  handleSelector?: string
}

export default function DragDropSortable<T>({ 
  items, 
  onReorder, 
  renderItem, 
  renderAddNew,
  handleSelector = '.drag-handle' 
}: DragDropSortableProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
    setDraggedIndex(index)
    const target = e.currentTarget as HTMLElement
    target.classList.add('dragging')
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.classList.remove('dragging')
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (index !== draggedIndex) {
      setDragOverIndex(index)
    }
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (fromIndex !== index && fromIndex >= 0 && fromIndex < items.length) {
      const newItems = [...items]
      const [removed] = newItems.splice(fromIndex, 1)
      newItems.splice(index, 0, removed)
      onReorder(newItems)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (index !== draggedIndex) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      if (dragOverIndex === index) {
        setDragOverIndex(null)
      }
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item, index) => (
        <div
          key={index}
          ref={(el) => { itemsRef.current[index] = el }}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragLeave={(e) => handleDragLeave(e, index)}
          className={`relative group transition-all duration-200 ${draggedIndex === index ? 'opacity-40 scale-95' : ''} ${dragOverIndex === index ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-white' : ''}`}
        >
          {renderItem(item, index, draggedIndex === index)}
          <div 
            className="drag-handle absolute top-1 left-1 w-6 h-6 bg-gray-700/80 text-white rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
            aria-label="Drag to reorder"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
            </svg>
          </div>
        </div>
      ))}
      {renderAddNew && (
        <div className="relative group">
          {renderAddNew()}
        </div>
      )}
    </div>
  )
}