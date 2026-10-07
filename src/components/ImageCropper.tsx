"use client"

import { useEffect, useRef, useState } from 'react'

interface ImageCropperProps {
  file: File
  onComplete: (croppedFile: File) => void
  onCancel: () => void
  aspectRatio?: number
  maxWidth?: number
  maxHeight?: number
}

export default function ImageCropper({ file, onComplete, onCancel, aspectRatio = 1, maxWidth = 400, maxHeight = 400 }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [dragState, setDragState] = useState<{ x: number; y: number; scale: number; pinchDistance?: number }>({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      setImageLoaded(true)
      const { width, height } = img
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
      canvas.width = width * ratio
      canvas.height = height * ratio
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const initialScale = Math.max(canvas.width / width, canvas.height / height)
      setDragState({ x: 0, y: 0, scale: initialScale })
    }
  }, [file, maxWidth, maxHeight])

  const draw = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !imageLoaded) return
    const ctx = canvas.getContext('2d')!
    const { width, height } = img
    const { x, y, scale } = dragState
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.scale(scale, scale)
    ctx.translate(-width / 2 + x, -height / 2 + y)
    ctx.drawImage(img, 0, 0, width, height)
    ctx.restore()
  }

  useEffect(() => {
    draw()
  }, [dragState, imageLoaded])

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragStartRef.current = { x: clientX, y: clientY }
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const dx = (clientX - dragStartRef.current.x) / dragState.scale
    const dy = (clientY - dragStartRef.current.y) / dragState.scale
    setDragState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
    dragStartRef.current = { x: clientX, y: clientY }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setDragState(prev => ({ ...prev, scale: Math.min(Math.max(prev.scale * delta, 1), 5) }))
  }

  const handlePinch = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return
    e.preventDefault()
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY)
    if (!dragState.pinchDistance) {
      setDragState(prev => ({ ...prev, pinchDistance: distance }))
      return
    }
    const scaleChange = distance / dragState.pinchDistance
    setDragState(prev => ({ 
      ...prev, 
      scale: Math.min(Math.max(prev.scale * scaleChange, 1), 5),
      pinchDistance: distance
    }))
  }

  const cropAndSave = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !imageLoaded) return

    const { width: canvasWidth, height: canvasHeight } = canvas
    const { width: imgWidth, height: imgHeight } = img
    const { x, y, scale } = dragState

    const outputSize = Math.min(canvasWidth, canvasHeight)
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = outputSize
    outputCanvas.height = outputSize
    const ctx = outputCanvas.getContext('2d')!

    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.scale(scale, scale)
    ctx.translate(-imgWidth / 2 + x, -imgHeight / 2 + y)
    ctx.beginPath()
    ctx.arc(0, 0, outputSize / (2 * scale), 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, -imgWidth / 2 + x, -imgHeight / 2 + y, imgWidth, imgHeight)
    ctx.restore()

    outputCanvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
        onComplete(croppedFile)
      }
    }, 'image/jpeg', 0.85)
  }

  if (!imageLoaded) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p>Loading image...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center text-white mb-4">
        <h2 className="text-lg font-semibold mb-2">Position your face in the circle</h2>
        <p className="text-sm text-gray-400">Drag to move, scroll/pinch to zoom. The circular area will be saved.</p>
      </div>
      
      <div 
        className="relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onWheel={handleWheel}
        onTouchMoveCapture={handlePinch}
      >
        <canvas
          ref={canvasRef}
          className="rounded-full shadow-2xl border-4 border-white/20"
          style={{ touchAction: 'none' }}
        />
        <div className="absolute inset-0 rounded-full border-4 border-primary-500 pointer-events-none shadow-inner" />
        
        <img
          ref={imgRef}
          src={URL.createObjectURL(file)}
          alt=""
          className="hidden"
        />
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={cropAndSave}
          className="flex-1 px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
        >
          Save & Use
        </button>
      </div>
    </div>
  )
}