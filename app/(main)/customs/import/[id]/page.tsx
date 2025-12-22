import { notFound } from 'next/navigation'
import { PIBDetailView } from '@/components/pib'
import { getPIBDocument } from '@/lib/pib-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PIBDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await getPIBDocument(id)

  if (result.error || !result.data) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <PIBDetailView pib={result.data} />
    </div>
  )
}
