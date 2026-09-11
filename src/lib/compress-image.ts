const MAX_DIMENSION = 800
const JPEG_QUALITY = 0.7

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  let { width, height } = bitmap
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height / width) * MAX_DIMENSION)
      width = MAX_DIMENSION
    } else {
      width = Math.round((width / height) * MAX_DIMENSION)
      height = MAX_DIMENSION
    }
  }

  canvas.width = width
  canvas.height = height
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', JPEG_QUALITY)
  })

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
}
