import { useState, useCallback } from 'react'

let toastId = 0
const listeners = []
let memState = { toasts: [] }

function dispatch(action) {
  memState = reducer(memState, action)
  listeners.forEach(l => l(memState))
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return { toasts: [action.toast, ...state.toasts].slice(0, 3) }
    case 'REMOVE':
      return { toasts: state.toasts.filter(t => t.id !== action.id) }
    default:
      return state
  }
}

export function toast({ title, description, variant = 'default', duration = 3000 }) {
  const id = ++toastId
  dispatch({ type: 'ADD', toast: { id, title, description, variant, open: true } })
  setTimeout(() => dispatch({ type: 'REMOVE', id }), duration)
}

export function useToast() {
  const [state, setState] = useState(memState)

  useCallback(() => {
    listeners.push(setState)
    return () => {
      const idx = listeners.indexOf(setState)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])()

  return { toasts: state.toasts, toast }
}
