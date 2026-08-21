import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Box, Button, HStack, NativeSelect, Stack, Textarea } from '@chakra-ui/react'
import { listMembershipPlansForTech, enrollMembership, flagForComfortAdvisor } from '../../lib/tech'
import { toaster } from '../../components/ui/toaster'

interface Props {
    jobId: string
}

export default function ActionButtons({ jobId }: Props) {
    const [planId, setPlanId] = useState('')
    const [notes, setNotes] = useState('')
    const [showReferral, setShowReferral] = useState(false)

    const plansQuery = useQuery({ queryKey: ['membershipPlansForTech'], queryFn: listMembershipPlansForTech })

    const enrollMutation = useMutation({
        mutationFn: () => enrollMembership(jobId, planId),
        onSuccess: (outcome) => toaster.create({
            title: outcome === 'sent' ? 'Membership enrolled' : 'Saved locally -- will enroll when back online',
            type: outcome === 'sent' ? 'success' : 'info',
        }),
        onError: () => toaster.create({ title: "Couldn't enroll the membership", type: 'error' }),
    })

    const referralMutation = useMutation({
        mutationFn: () => flagForComfortAdvisor(jobId, notes || undefined),
        onSuccess: (outcome) => {
            setShowReferral(false)
            setNotes('')
            toaster.create({
                title: outcome === 'sent' ? 'Flagged for Comfort Advisor' : 'Saved locally -- will flag when back online',
                type: outcome === 'sent' ? 'success' : 'info',
            })
        },
        onError: () => toaster.create({ title: "Couldn't flag this job", type: 'error' }),
    })

    return (
        <Stack gap="3">
            <Box>
                <HStack>
                    <NativeSelect.Root size="sm" width="220px">
                        <NativeSelect.Field value={planId} onChange={(e) => setPlanId(e.target.value)}>
                            <option value="">Select a membership plan…</option>
                            {plansQuery.data?.map((plan) => (
                                <option key={plan.id} value={plan.id}>{plan.name}</option>
                            ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Button
                        size="sm"
                        colorPalette="blue"
                        disabled={!planId}
                        loading={enrollMutation.isPending}
                        onClick={() => enrollMutation.mutate()}
                    >
                        Enroll membership
                    </Button>
                </HStack>
            </Box>

            <Box>
                {!showReferral ? (
                    <Button size="sm" variant="surface" onClick={() => setShowReferral(true)}>
                        Flag for Comfort Advisor
                    </Button>
                ) : (
                    <Stack gap="2">
                        <Textarea
                            size="sm"
                            placeholder="Optional notes for the Comfort Advisor"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                        <HStack>
                            <Button
                                size="sm"
                                colorPalette="blue"
                                loading={referralMutation.isPending}
                                onClick={() => referralMutation.mutate()}
                            >
                                Send flag
                            </Button>
                            <Button size="sm" variant="surface" onClick={() => setShowReferral(false)}>Cancel</Button>
                        </HStack>
                    </Stack>
                )}
            </Box>
        </Stack>
    )
}
