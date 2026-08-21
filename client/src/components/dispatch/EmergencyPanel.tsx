import { Badge, Box, Heading, Stack, Text } from '@chakra-ui/react'
import type { DispatchJob } from '@flowops/shared'
import { formatLabel, JOB_TYPE_COLOR } from '../../lib/dispatchColors'
import AssignTechPicker from './AssignTechPicker'

interface Props {
    jobs: DispatchJob[]
    onAssign: (jobId: string, technicianId: string) => void
    assigning: boolean
}

/** Emergency reshuffle: same-day emergency-priority jobs with no tech yet.
 * Ranked suggestions only (lightest load first) -- not a schedule
 * optimizer, per the confirmed Phase D scope. */
export default function EmergencyPanel({ jobs, onAssign, assigning }: Props) {
    if (jobs.length === 0) {
        return (
            <Box borderWidth="1px" borderColor="red.500" borderRadius="md" p="4" mb="4">
                <Text color="gray.500">No unassigned emergency jobs right now.</Text>
            </Box>
        )
    }

    return (
        <Stack borderWidth="1px" borderColor="red.500" borderRadius="md" p="4" mb="4" gap="3">
            <Heading size="sm">Emergency reshuffle</Heading>
            {jobs.map((job) => (
                <Box key={job.id} borderWidth="1px" borderRadius="md" p="3">
                    <Badge colorPalette={JOB_TYPE_COLOR[job.job_type]} size="sm" mb="1">
                        {formatLabel(job.job_type)}
                    </Badge>
                    <Text fontWeight="bold">{job.customer_name}</Text>
                    <Text fontSize="sm" color="gray.500">{job.property_address}</Text>
                    <Text fontSize="sm">{job.summary}</Text>
                    <AssignTechPicker
                        job={job}
                        onAssign={(technicianId) => onAssign(job.id, technicianId)}
                        assigning={assigning}
                    />
                </Box>
            ))}
        </Stack>
    )
}
