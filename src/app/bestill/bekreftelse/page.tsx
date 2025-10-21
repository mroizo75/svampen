import { Suspense } from 'react'
import BookingConfirmationContent from './booking-confirmation-content'

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Laster...</div>}>
      <BookingConfirmationContent />
    </Suspense>
  )
}
