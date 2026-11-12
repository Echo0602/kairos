import { createContext, useContext } from 'react'

export const ToastCtx = createContext<(msg: string) => void>(() => {})

export function useToast() {
  return useContext(ToastCtx)
}
