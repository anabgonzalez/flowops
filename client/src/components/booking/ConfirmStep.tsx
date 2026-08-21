import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Box, Button, Input, Stack, Text } from '@chakra-ui/react'
import type { AvailableSlot, Customer, Job, JobType, Property } from '@flowops/shared'
import { createBookingAndJob } from '../../lib/booking'

interface Props {
    customer: Customer
    property: Property
    jobType: JobType
    parentJobId: string | null
    slot: AvailableSlot
    onBooked: (job: Job) => void
}

export default function ConfirmStep({ customer, property, jobType, parentJobId, slot, onBooked }: Props) {
    const [summary, setSummary] = useState('')

    const mutation = useMutation({
        mutationFn: () =>
            createBookingAndJob({
                p_property_id: property.id,
                p_customer_id: customer.id,
                p_job_type: jobType,
                p_technician_id: slot.technicianId,
                p_scheduled_start: slot.start.toISOString(),
                p_scheduled_end: slot.end.toISOString(),
                p_summary: summary,
                p_parent_job_id: parentJobId,
            }),
        onSuccess: onBooked,
    })

    return (
        <Stack gap="4">
            <Text fontWeight="bold">Review and confirm</Text>
            <Box borderWidth="1px" borderRadius="md" p="4">
                <Text><strong>Customer:</strong> {customer.first_name} {customer.last_name}</Text>
                <Text><strong>Property:</strong> {property.address_line1}, {property.city}, {property.state} {property.postal_code}</Text>
                <Text><strong>Job type:</strong> {jobType}</Text>
                <Text><strong>Tech:</strong> {slot.technicianName}</Text>
                <Text><strong>When:</strong> {slot.start.toLocaleString()}</Text>
            </Box>

            <Box>
                <Text fontSize="sm" mb="1">What's the issue? (shows on the tech's job)</Text>
                <Input value={summary} onChange={(e) => setSummary(e.target.value)} required />
            </Box>

            {mutation.isError && (
                <Text color="red.500" fontSize="sm">
                    {mutation.error instanceof Error ? mutation.error.message : 'Something went wrong'}
                </Text>
            )}

            <Button
                colorPalette="blue"
                alignSelf="start"
                disabled={!summary.trim()}
                loading={mutation.isPending}
                onClick={() => mutation.mutate()}
            >
                Confirm booking
            </Button>
        </Stack>
    )
}
