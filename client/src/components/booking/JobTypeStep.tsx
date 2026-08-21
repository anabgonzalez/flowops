import { useQuery } from '@tanstack/react-query'
import { Box, Button, Grid, RadioGroup, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import type { JobType } from '@flowops/shared'
import { listRecentJobsForCustomer } from '../../lib/booking'

const JOB_TYPES: { value: JobType; label: string; blurb: string }[] = [
    { value: 'service', label: 'Service call', blurb: 'Something needs fixing' },
    { value: 'maintenance', label: 'Maintenance', blurb: 'Routine tune-up or inspection' },
    { value: 'install', label: 'Install', blurb: 'Books a Comfort Advisor consult' },
    { value: 'callback', label: 'Callback', blurb: 'Follow-up on a previous job' },
    { value: 'commercial', label: 'Commercial', blurb: 'Commercial account service' },
]

interface Props {
    customerId: string
    onSelect: (jobType: JobType, parentJobId: string | null) => void
}

export default function JobTypeStep({ customerId, onSelect }: Props) {
    const [pendingCallback, setPendingCallback] = useState(false)
    const [parentJobId, setParentJobId] = useState('')

    const recentJobsQuery = useQuery({
        queryKey: ['recentJobs', customerId],
        queryFn: () => listRecentJobsForCustomer(customerId),
        enabled: pendingCallback,
    })

    if (pendingCallback) {
        return (
            <Stack gap="4">
                <Text fontWeight="bold">Which job is this a callback for?</Text>
                {recentJobsQuery.isLoading && <Text color="gray.500">Loading recent jobs…</Text>}
                {recentJobsQuery.data?.length === 0 && (
                    <Text color="gray.500">No prior jobs on file for this customer.</Text>
                )}
                <RadioGroup.Root value={parentJobId} onValueChange={({ value }) => setParentJobId(value ?? '')}>
                    <Stack gap="2">
                        {recentJobsQuery.data?.map((job) => (
                            <RadioGroup.Item key={job.id} value={job.id}>
                                <RadioGroup.ItemHiddenInput />
                                <RadioGroup.ItemIndicator />
                                <RadioGroup.ItemText>{job.summary} ({job.job_type})</RadioGroup.ItemText>
                            </RadioGroup.Item>
                        ))}
                    </Stack>
                </RadioGroup.Root>
                <Button
                    colorPalette="blue"
                    disabled={!parentJobId}
                    alignSelf="start"
                    onClick={() => onSelect('callback', parentJobId)}
                >
                    Continue
                </Button>
                <Button variant="plain" size="sm" alignSelf="start" onClick={() => setPendingCallback(false)}>
                    Back
                </Button>
            </Stack>
        )
    }

    return (
        <Stack gap="4">
            <Text fontWeight="bold">What kind of job is this?</Text>
            <Grid templateColumns="repeat(auto-fit, minmax(180px, 1fr))" gap="3">
                {JOB_TYPES.map((jt) => (
                    <Box
                        key={jt.value}
                        as="button"
                        onClick={() => (jt.value === 'callback' ? setPendingCallback(true) : onSelect(jt.value, null))}
                        borderWidth="1px"
                        borderRadius="md"
                        p="4"
                        textAlign="left"
                        _hover={{ borderColor: 'blue.solid' }}
                    >
                        <Text fontWeight="bold">{jt.label}</Text>
                        <Text fontSize="sm" color="gray.500">{jt.blurb}</Text>
                    </Box>
                ))}
            </Grid>
        </Stack>
    )
}
