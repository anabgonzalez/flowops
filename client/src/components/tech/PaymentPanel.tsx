import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { Box, Button, Heading, HStack, Input, NativeSelect, Stack, Text } from '@chakra-ui/react'
import type { Invoice } from '@flowops/shared'
import { createInvoiceFromJob, recordPayment, listJobLineItems } from '../../lib/tech'
import { getStripe, isStripeConfigured, createPaymentIntent } from '../../lib/stripe'
import { toaster } from '../../components/ui/toaster'

function CardPaymentForm({ invoice, onPaid }: { invoice: Invoice; onPaid: () => void }) {
    const stripe = useStripe()
    const elements = useElements()
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const amountDue = invoice.total_amount - invoice.amount_paid

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!stripe || !elements) return
        setSubmitting(true)
        setError(null)

        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' })
        if (confirmError) {
            setError(confirmError.message ?? 'Payment failed')
            setSubmitting(false)
            return
        }
        if (paymentIntent?.status === 'succeeded') {
            try {
                await recordPayment(invoice.id, amountDue, 'card', paymentIntent.id)
                onPaid()
            } catch {
                setError('Card was charged, but recording the payment failed -- let the office know so the invoice gets fixed.')
            }
        }
        setSubmitting(false)
    }

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <PaymentElement />
            {error && <Text color="red.500" fontSize="sm" mt="2">{error}</Text>}
            <Button type="submit" mt="3" colorPalette="blue" loading={submitting} disabled={!stripe}>
                Charge ${amountDue.toFixed(2)}
            </Button>
        </Box>
    )
}

interface Props {
    jobId: string
}

/** Payment collection needs live connectivity throughout -- a card
 * charge is a real-time round trip to Stripe, not something that can be
 * queued and replayed later. See the Phase E plan. */
export default function PaymentPanel({ jobId }: Props) {
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [manualMethod, setManualMethod] = useState<'cash' | 'check'>('cash')
    const [reference, setReference] = useState('')
    const [paid, setPaid] = useState(false)

    const lineItemsQuery = useQuery({ queryKey: ['jobLineItems', jobId], queryFn: () => listJobLineItems(jobId) })
    const approvedTotal = (lineItemsQuery.data ?? [])
        .filter((li) => li.is_approved)
        .reduce((sum, li) => sum + li.total, 0)

    const createInvoiceMutation = useMutation({
        mutationFn: () => createInvoiceFromJob(jobId),
        onSuccess: async (inv) => {
            setInvoice(inv)
            if (!isStripeConfigured) return
            try {
                const result = await createPaymentIntent(inv.id)
                setClientSecret(result.client_secret)
            } catch (err) {
                toaster.create({ title: err instanceof Error ? err.message : "Couldn't set up card payment", type: 'warning' })
            }
        },
        onError: () => toaster.create({ title: "Couldn't create the invoice -- check your connection", type: 'error' }),
    })

    const manualPaymentMutation = useMutation({
        mutationFn: () => recordPayment(invoice!.id, invoice!.total_amount - invoice!.amount_paid, manualMethod, reference || undefined),
        onSuccess: () => {
            setPaid(true)
            toaster.create({ title: 'Payment recorded', type: 'success' })
        },
        onError: () => toaster.create({ title: "Couldn't record the payment -- check your connection", type: 'error' }),
    })

    if (paid) {
        return (
            <Box borderWidth="1px" borderColor="green.500" borderRadius="md" p="3">
                <Text fontWeight="bold">Payment collected.</Text>
            </Box>
        )
    }

    if (!invoice) {
        return (
            <Box>
                <Heading size="sm" mb="2">Collect payment</Heading>
                <Text mb="2">Approved total: ${approvedTotal.toFixed(2)}</Text>
                <Button
                    colorPalette="blue"
                    loading={createInvoiceMutation.isPending}
                    disabled={approvedTotal === 0}
                    onClick={() => createInvoiceMutation.mutate()}
                >
                    Create invoice
                </Button>
                <Text fontSize="xs" color="gray.500" mt="1">Requires a live connection -- payment can't be collected offline.</Text>
            </Box>
        )
    }

    const amountDue = invoice.total_amount - invoice.amount_paid

    return (
        <Box borderWidth="1px" borderRadius="md" p="3">
            <Heading size="sm" mb="2">Invoice {invoice.invoice_number}</Heading>
            <Text mb="3">Amount due: ${amountDue.toFixed(2)}</Text>

            {isStripeConfigured && clientSecret ? (
                <Elements stripe={getStripe()} options={{ clientSecret }}>
                    <CardPaymentForm invoice={invoice} onPaid={() => setPaid(true)} />
                </Elements>
            ) : (
                <Stack gap="2">
                    {!isStripeConfigured && (
                        <Text fontSize="sm" color="gray.500">
                            Card payment isn't set up yet -- record cash or check instead.
                        </Text>
                    )}
                    <HStack>
                        <NativeSelect.Root size="sm" width="140px">
                            <NativeSelect.Field
                                value={manualMethod}
                                onChange={(e) => setManualMethod(e.target.value as 'cash' | 'check')}
                            >
                                <option value="cash">Cash</option>
                                <option value="check">Check</option>
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        <Input
                            size="sm"
                            placeholder="Reference # (optional)"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                        />
                    </HStack>
                    <Button
                        colorPalette="blue"
                        loading={manualPaymentMutation.isPending}
                        onClick={() => manualPaymentMutation.mutate()}
                    >
                        Record payment
                    </Button>
                </Stack>
            )}
        </Box>
    )
}
