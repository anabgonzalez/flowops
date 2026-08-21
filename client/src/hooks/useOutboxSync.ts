import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { processOutbox, pendingCount } from '../lib/outbox'
import { getOutboxHandlers } from '../lib/tech'

const SYNC_INTERVAL_MS = 45_000

/** Wires the outbox's drain loop to real triggers: the browser's 'online'
 * event, tab regaining focus, and a periodic timer -- the timer matters
 * specifically because iOS Safari has no Background Sync API at all, so
 * "sync the instant signal returns" only reliably happens while the tab
 * is actually open and polling, not truly in the background. Returns the
 * live pending-action count for a UI badge. */
export function useOutboxSync(): number {
    const queryClient = useQueryClient()

    useEffect(() => {
        const sync = () => {
            processOutbox(getOutboxHandlers()).finally(() => {
                queryClient.invalidateQueries({ queryKey: ['outboxPending'] })
            })
        }

        const onVisibilityChange = () => { if (!document.hidden) sync() }

        sync()
        window.addEventListener('online', sync)
        document.addEventListener('visibilitychange', onVisibilityChange)
        const interval = setInterval(sync, SYNC_INTERVAL_MS)

        return () => {
            window.removeEventListener('online', sync)
            document.removeEventListener('visibilitychange', onVisibilityChange)
            clearInterval(interval)
        }
    }, [queryClient])

    const { data } = useQuery({
        queryKey: ['outboxPending'],
        queryFn: pendingCount,
        refetchInterval: SYNC_INTERVAL_MS,
    })

    return data ?? 0
}
