import { useEffect, useState } from 'react'
import {
  ToastProvider, ToastViewport,
  Toast, ToastTitle, ToastDescription, ToastClose,
} from '@/components/ui/toast'

let memToasts = []
const listeners = new Set()

export function toast({ title, description, variant = 'default', duration = 3000 }) {
  const id = Date.now() + Math.random()
  memToasts = [{ id, title, description, variant }, ...memToasts].slice(0, 3)
  listeners.forEach(fn => fn([...memToasts]))
  setTimeout(() => {
    memToasts = memToasts.filter(t => t.id !== id)
    listeners.forEach(fn => fn([...memToasts]))
  }, duration)
}

export function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    listeners.add(setToasts)
    return () => listeners.delete(setToasts)
  }, [])

  return (
    <ToastProvider>
      {toasts.map(t => (
        <Toast key={t.id} variant={t.variant}>
          {t.title && <ToastTitle>{t.title}</ToastTitle>}
          {t.description && <ToastDescription>{t.description}</ToastDescription>}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
