import { useQuery } from '@tanstack/react-query'
import { Badge, Box, Heading, Stack, Text } from '@chakra-ui/react'
import { getPropertyEquipment, getPastJobsForProperty } from '../../lib/tech'
import { formatLabel } from '../../lib/dispatchColors'

interface Props {
    propertyId: string
    currentJobId: string
}

/** Pulled up automatically when a tech opens a job -- no action needed
 * from them, per the Phase E ask. */
export default function PropertyHistoryPanel({ propertyId, currentJobId }: Props) {
    const equipmentQuery = useQuery({
        queryKey: ['propertyEquipment', propertyId],
        queryFn: () => getPropertyEquipment(propertyId),
    })
    const historyQuery = useQuery({
        queryKey: ['propertyHistory', propertyId, currentJobId],
        queryFn: () => getPastJobsForProperty(propertyId, currentJobId),
    })

    return (
        <Box borderWidth="1px" borderRadius="md" p="3">
            <Heading size="sm" mb="2">Equipment on site</Heading>
            {equipmentQuery.isLoading && <Text fontSize="sm" color="gray.500">Loading…</Text>}
            {equipmentQuery.data?.length === 0 && <Text fontSize="sm" color="gray.500">No equipment on file.</Text>}
            <Stack gap="2" mb="4">
                {equipmentQuery.data?.map((eq) => (
                    <Box key={eq.id} fontSize="sm">
                        <Text fontWeight="bold">
                            {eq.manufacturer} {eq.model_number} <Text as="span" color="gray.500">({formatLabel(eq.equipment_type)})</Text>
                        </Text>
                        {eq.serial_number && <Text color="gray.500">SN: {eq.serial_number}</Text>}
                        {eq.warranty_expires_on && <Text color="gray.500">Warranty until {eq.warranty_expires_on}</Text>}
                    </Box>
                ))}
            </Stack>

            <Heading size="sm" mb="2">Past jobs at this property</Heading>
            {historyQuery.isLoading && <Text fontSize="sm" color="gray.500">Loading…</Text>}
            {historyQuery.data?.length === 0 && <Text fontSize="sm" color="gray.500">No prior jobs on file.</Text>}
            <Stack gap="2">
                {historyQuery.data?.map((job) => (
                    <Box key={job.id} fontSize="sm">
                        <Badge size="sm" mr="2">{formatLabel(job.job_type)}</Badge>
                        {job.summary}
                        {job.completed_at && <Text as="span" color="gray.500"> — {job.completed_at.slice(0, 10)}</Text>}
                    </Box>
                ))}
            </Stack>
        </Box>
    )
}
