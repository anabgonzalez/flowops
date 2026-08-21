import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Badge, Box, Button, HStack, Stack, Text } from '@chakra-ui/react'
import type { DispatchJob } from '@flowops/shared'
import { JOB_TYPE_COLOR, formatLabel } from '../../lib/dispatchColors'
import AssignTechPicker from './AssignTechPicker'

interface Props {
    job: DispatchJob
    draggable: boolean
    onAssign: (technicianId: string) => void
    assigning: boolean
    onSendEta: () => void
    sendingEta: boolean
}

function formatTime(iso: string | null): string {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function JobCard({ job, draggable, onAssign, assigning, onSendEta, sendingEta }: Props) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: job.id,
        data: { job },
        disabled: !draggable,
    })

    const accent = JOB_TYPE_COLOR[job.job_type]
    const isEmergency = job.priority === 'emergency'
    const canNotify = job.assignments.length > 0 && job.status !== 'in_progress' && job.status !== 'completed'

    return (
        <Box
            ref={setNodeRef}
            {...(draggable ? { ...listeners, ...attributes } : {})}
            style={{ transform: CSS.Translate.toString(transform), zIndex: isDragging ? 10 : undefined }}
            borderWidth="1px"
            borderLeftWidth="4px"
            borderLeftColor={`${accent}.500`}
            borderColor={isEmergency ? 'red.500' : undefined}
            borderRadius="md"
            p="3"
            mb="2"
            bg="bg.panel"
            opacity={isDragging ? 0.4 : 1}
            cursor={draggable ? 'grab' : 'default'}
        >
            <Stack gap="1">
                <HStack justify="space-between">
                    <Badge colorPalette={accent} size="sm">{formatLabel(job.job_type)}</Badge>
                    {isEmergency && <Badge colorPalette="red" size="sm">Emergency</Badge>}
                </HStack>

                <Text fontWeight="bold">{job.customer_name}</Text>
                <Text fontSize="sm" color="gray.500">{job.property_address}</Text>
                <Text fontSize="sm">{job.summary}</Text>

                {job.scheduled_start && (
                    <Text fontSize="xs" color="gray.500">
                        {formatTime(job.scheduled_start)}
                        {job.scheduled_end && ` – ${formatTime(job.scheduled_end)}`}
                    </Text>
                )}

                {job.assignments.length > 0 && (
                    <Text fontSize="sm">{job.assignments.map((a) => a.technician_name).join(', ')}</Text>
                )}

                {job.assignments.length === 0 && (
                    <AssignTechPicker job={job} onAssign={onAssign} assigning={assigning} />
                )}

                {canNotify && (
                    job.en_route_at ? (
                        <Text fontSize="xs" color="green.600">Notified at {formatTime(job.en_route_at)}</Text>
                    ) : (
                        <Button size="xs" variant="surface" loading={sendingEta} onClick={onSendEta}>
                            On my way
                        </Button>
                    )
                )}
            </Stack>
        </Box>
    )
}
