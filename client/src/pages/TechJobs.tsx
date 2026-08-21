import { useQuery } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import { Badge, Box, Button, HStack, Stack, Text } from '@chakra-ui/react'
import { listMyAssignedJobs } from '../lib/tech'
import { JOB_TYPE_COLOR, formatLabel } from '../lib/dispatchColors'
import { useOutboxSync } from '../hooks/useOutboxSync'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function TechJobs() {
    const jobsQuery = useQuery({ queryKey: ['myAssignedJobs'], queryFn: listMyAssignedJobs })
    const pending = useOutboxSync()
    const online = useOnlineStatus()

    return (
        <Box maxW="md" mx="auto" mt="6" p="4" pb="12">
            <HStack justify="space-between" mb="4">
                <Text fontSize="xl" fontWeight="bold">My jobs</Text>
                <RouterLink to="/">
                    <Button variant="surface" size="sm">Dashboard</Button>
                </RouterLink>
            </HStack>

            {!online && (
                <Box bg="orange.subtle" borderRadius="md" p="2" mb="3">
                    <Text fontSize="sm">Offline -- actions will save locally and sync automatically.</Text>
                </Box>
            )}
            {pending > 0 && (
                <Box bg="blue.subtle" borderRadius="md" p="2" mb="3">
                    <Text fontSize="sm">{pending} action{pending === 1 ? '' : 's'} waiting to sync.</Text>
                </Box>
            )}

            {jobsQuery.isLoading && <Text color="gray.500">Loading…</Text>}
            {jobsQuery.isError && <Text color="red.500">Couldn't load your jobs.</Text>}
            {jobsQuery.data?.length === 0 && <Text color="gray.500">No jobs assigned right now.</Text>}

            <Stack gap="3">
                {jobsQuery.data?.map((job) => (
                    <RouterLink key={job.id} to={`/tech/jobs/${job.id}`}>
                        <Box borderWidth="1px" borderLeftWidth="4px" borderLeftColor={`${JOB_TYPE_COLOR[job.job_type]}.500`} borderRadius="md" p="3">
                            <HStack justify="space-between" mb="1">
                                <Badge colorPalette={JOB_TYPE_COLOR[job.job_type]} size="sm">{formatLabel(job.job_type)}</Badge>
                                {job.priority === 'emergency' && <Badge colorPalette="red" size="sm">Emergency</Badge>}
                            </HStack>
                            <Text fontWeight="bold">{job.customer_name}</Text>
                            <Text fontSize="sm" color="gray.500">{job.property_address}</Text>
                            <Text fontSize="sm">{job.summary}</Text>
                            {job.scheduled_start && (
                                <Text fontSize="xs" color="gray.500" mt="1">
                                    {new Date(job.scheduled_start).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                                </Text>
                            )}
                        </Box>
                    </RouterLink>
                ))}
            </Stack>
        </Box>
    )
}
