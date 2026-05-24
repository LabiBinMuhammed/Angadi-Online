import type { Metadata } from 'next'
import SearchClient from './SearchClient'

export const metadata: Metadata = { title: 'Search Shops' }

export default function SearchPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        main.page { padding-top: 0.5rem !important; }
      `}} />
      
      <div style={{ padding: '0 0.5rem' }}>
        <SearchClient />
      </div>
    </>
  )
}
