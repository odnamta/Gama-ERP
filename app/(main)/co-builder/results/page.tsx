import { getCompetitionResults } from '../actions'
import { ResultsClient } from './results-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Hasil Kompetisi - Co-Builder',
  description: 'Hasil dan pemenang GAMA ERP Co-Builder Program',
}

export default async function ResultsPage() {
  const results = await getCompetitionResults()
  return <ResultsClient results={results} />
}
