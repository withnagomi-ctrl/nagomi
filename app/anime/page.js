import { Suspense } from 'react'
import AnimeClient from './AnimeClient'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnimeClient />
    </Suspense>
  )
}