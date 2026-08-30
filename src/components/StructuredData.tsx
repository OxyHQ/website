import { Helmet } from 'react-helmet-async'
import { serializeStructuredData } from '../lib/structuredData'

interface StructuredDataProps {
  data: Record<string, unknown>
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <Helmet>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }}
      />
    </Helmet>
  )
}
