import Dexie, { type Table } from 'dexie'

// Payment collection is deliberately never queued here -- charging a
// card is a live round-trip to Stripe at the moment of the tap/swipe,
// not something that can be replayed later from a cached state. See the
// Phase E plan.
export type OutboxActionType =
    | 'applyPricebookPackage'
    | 'uploadMedia'
    | 'enrollMembership'
    | 'flagForComfortAdvisor'
    | 'uploadSignature'

export interface OutboxAction {
    id?: number
    type: OutboxActionType
    payload: unknown
    createdAt: number
    attempts: number
    lastError?: string
}

class OutboxDB extends Dexie {
    actions!: Table<OutboxAction, number>
    constructor() {
        super('flowops-outbox')
        this.version(1).stores({ actions: '++id, type, createdAt' })
    }
}

export const outboxDB = new OutboxDB()

export async function enqueueAction(type: OutboxActionType, payload: unknown): Promise<void> {
    await outboxDB.actions.add({ type, payload, createdAt: Date.now(), attempts: 0 })
}

export async function pendingCount(): Promise<number> {
    return outboxDB.actions.count()
}

export type OutboxHandlers = Partial<Record<OutboxActionType, (payload: never) => Promise<void>>>

let syncing = false

/** Drains the outbox in FIFO order. Stops (without dropping remaining
 * items) the moment a failure looks like "we're actually offline again"
 * rather than hammering retries with no signal; a genuine per-action
 * error (a real 4xx from the server, say) is recorded on that item and
 * skipped so it doesn't block everything queued behind it. */
export async function processOutbox(handlers: OutboxHandlers): Promise<void> {
    if (syncing || !navigator.onLine) return
    syncing = true
    try {
        const actions = await outboxDB.actions.orderBy('createdAt').toArray()
        for (const action of actions) {
            const handler = handlers[action.type]
            if (!handler) continue
            try {
                await handler(action.payload as never)
                await outboxDB.actions.delete(action.id!)
            } catch (err) {
                if (!navigator.onLine) break
                await outboxDB.actions.update(action.id!, {
                    attempts: action.attempts + 1,
                    lastError: err instanceof Error ? err.message : String(err),
                })
            }
        }
    } finally {
        syncing = false
    }
}
