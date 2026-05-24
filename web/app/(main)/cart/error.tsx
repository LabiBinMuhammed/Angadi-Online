'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="p-4" style={{ marginTop: '20vh', textAlign: 'center' }}>
      <h2 className="text-xl font-bold mb-4 text-danger">Something went wrong!</h2>
      <p className="mb-4 text-sm text-muted" style={{ maxWidth: 400, margin: '0 auto 1rem', wordBreak: 'break-all' }}>
        {error.message}
      </p>
      <button
        onClick={() => reset()}
        className="btn btn-primary"
      >
        Try again
      </button>
    </div>
  )
}
