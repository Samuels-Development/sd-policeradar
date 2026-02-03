import { useCallback } from 'react'

const resourceName = 'sd-policeradar'

export function useNuiCallback<T = unknown, R = unknown>(
  eventName: string
): (data?: T) => Promise<R> {
  return useCallback(
    async (data?: T): Promise<R> => {
      const response = await fetch(`https://${resourceName}/${eventName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data ?? {}),
      })
      return response.json()
    },
    [eventName]
  )
}

export function fetchNui<T = unknown>(eventName: string, data?: unknown): Promise<T> {
  return fetch(`https://${resourceName}/${eventName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data ?? {}),
  })
    .then((response) => response.json())
    .catch(() => ({}))
}
