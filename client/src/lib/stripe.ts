import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined

export const isStripeConfigured = Boolean(publishableKey)

let stripePromise: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
    if (!publishableKey) return Promise.resolve(null)
    if (!stripePromise) stripePromise = loadStripe(publishableKey)
    return stripePromise
}

export interface PaymentIntentResult {
    client_secret: string
    amount: number
}

export async function createPaymentIntent(invoiceId: string): Promise<PaymentIntentResult> {
    const { data, error } = await supabase.functions.invoke('create-payment-intent', { body: { invoice_id: invoiceId } })
    if (error) {
        // Same lesson as send-eta-sms: non-2xx responses land here with
        // the descriptive body dropped, not in `data` -- recover it.
        if (error instanceof FunctionsHttpError) {
            const body = await error.context.json().catch(() => null)
            if (body && typeof body.error === 'string') throw new Error(body.error)
        }
        throw error
    }
    return data as PaymentIntentResult
}
