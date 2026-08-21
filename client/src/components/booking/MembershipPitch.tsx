import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Box, Button, HStack, Stack, Text } from '@chakra-ui/react'
import { getActiveMembership, listMembershipPlans, createMembershipForCustomer } from '../../lib/booking'

export default function MembershipPitch({ customerId }: { customerId: string }) {
    const [dismissed, setDismissed] = useState(false)
    const queryClient = useQueryClient()

    const membershipQuery = useQuery({
        queryKey: ['activeMembership', customerId],
        queryFn: () => getActiveMembership(customerId),
    })

    const plansQuery = useQuery({
        queryKey: ['membershipPlans'],
        queryFn: listMembershipPlans,
        enabled: membershipQuery.data === null,
    })

    const addMembership = useMutation({
        mutationFn: (planId: string) => createMembershipForCustomer(customerId, planId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activeMembership', customerId] }),
    })

    if (membershipQuery.isLoading) return null
    if (membershipQuery.data) {
        return <Badge colorPalette="purple">Active member</Badge>
    }
    if (dismissed) return null

    return (
        <Box borderWidth="1px" borderRadius="md" p="4" bg="purple.subtle" borderColor="purple.solid">
            <Text fontWeight="bold" mb="2">This customer isn't a member yet</Text>
            <Text fontSize="sm" mb="3" color="gray.600">
                Worth a quick pitch before you finish booking.
            </Text>
            <Stack gap="2">
                {plansQuery.data?.map((plan) => (
                    <HStack key={plan.id} justify="space-between">
                        <Box>
                            <Text fontWeight="medium">{plan.name}</Text>
                            <Text fontSize="sm" color="gray.500">
                                ${plan.price}/{plan.billing_frequency === 'annual' ? 'yr' : 'mo'}
                                {plan.discount_percent > 0 && ` · ${plan.discount_percent}% off service`}
                            </Text>
                        </Box>
                        <Button
                            size="sm"
                            colorPalette="purple"
                            loading={addMembership.isPending}
                            onClick={() => addMembership.mutate(plan.id)}
                        >
                            Add
                        </Button>
                    </HStack>
                ))}
            </Stack>
            <Button size="sm" variant="plain" mt="2" onClick={() => setDismissed(true)}>
                Not this time
            </Button>
        </Box>
    )
}
