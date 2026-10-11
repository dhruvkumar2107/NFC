"use client"
import Link from 'next/link'
import { useParams } from 'next/navigation'
import CardBuilderEditor from '@/components/builder/CardBuilderEditor'

export default function AdminBuilderEditorPage() {
  const params = useParams()
  const cardId = String(params?.cardId || '')

  return (
    <div>
      <Link href="/admin/builder" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">← Back to cards</Link>
      {cardId ? <CardBuilderEditor cardId={cardId} /> : <p className="text-sm text-red-600">Invalid card.</p>}
    </div>
  )
}
