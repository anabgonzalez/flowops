import { useQuery } from '@tanstack/react-query'
import { Button, HStack, Spinner, Stack, Text } from '@chakra-ui/react'
import type { DispatchJob } from '@flowops/shared'
import { rankCandidateTechs } from '../../lib/dispatch'

interface Props {
    job: DispatchJob
    onAssign: (technicianId: string) => void
    assigning: boolean
}

/** Ranked candidate list for (re)assigning a job -- zip coverage and
 * role/division match are hard filters (Phase C's rules), the ranking
 * itself is just "fewest jobs already on their plate today." */
export default function AssignTechPicker({ job, onAssign, assigning }: Props) {
    const candidatesQuery = useQuery({
        queryKey: ['candidateTechs', job.job_type, job.postal_code],
        queryFn: () => rankCandidateTechs(job.job_type, job.postal_code),
    })

    if (candidatesQuery.isLoading) return <Spinner size="sm" />
    if (candidatesQuery.isError) {
        return <Text fontSize="sm" color="red.500">Couldn't load candidate techs.</Text>
    }
    if (!candidatesQuery.data || candidatesQuery.data.length === 0) {
        return <Text fontSize="sm" color="gray.500">No active tech covers this zip for this job type.</Text>
    }

    return (
        <Stack gap="1" mt="2" borderTopWidth="1px" pt="2">
            {candidatesQuery.data.map((tech, i) => (
                <HStack key={tech.id} justify="space-between">
                    <Text fontSize="sm">
                        {i === 0 && '⭐ '}
                        {tech.full_name}
                        <Text as="span" color="gray.500">
                            {' '}— {tech.todays_job_count} job{tech.todays_job_count === 1 ? '' : 's'} today
                        </Text>
                    </Text>
                    <Button size="xs" variant="surface" loading={assigning} onClick={() => onAssign(tech.id)}>
                        Assign
                    </Button>
                </HStack>
            ))}
        </Stack>
    )
}
