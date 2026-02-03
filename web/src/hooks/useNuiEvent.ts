import { useEffect, useRef } from 'react'
import { NuiMessage } from '@/types'

export function useNuiEvent<T extends NuiMessage>(
  action: string,
  handler: (data: T) => void
) {
  const savedHandler = useRef(handler)

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    const eventListener = (event: MessageEvent<T>) => {
      const { type } = event.data
      if (type === action) {
        savedHandler.current(event.data)
      }
    }

    window.addEventListener('message', eventListener)
    return () => window.removeEventListener('message', eventListener)
  }, [action])
}
