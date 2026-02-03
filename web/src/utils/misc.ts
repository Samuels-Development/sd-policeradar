export function isEnvBrowser(): boolean {
  return !(window as unknown as { invokeNative?: unknown }).invokeNative
}

export function debugData<T>(events: { action: string; data: T }[], timer = 1000): void {
  if (isEnvBrowser()) {
    for (const event of events) {
      setTimeout(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              type: event.action,
              ...event.data
            }
          })
        )
      }, timer)
    }
  }
}
