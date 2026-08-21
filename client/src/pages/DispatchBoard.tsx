import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Button, HStack, Text } from '@chakra-ui/react'
import { laneForJob, type DispatchJob, type DispatchLane } from '@flowops/shared'
import {
    listTodaysJobs, laneJobs, emergencyUnassignedJobs,
    assignTech, sendEtaNotification, moveJobToLane,
} from '../lib/dispatch'
import DispatchLaneColumn from '../components/dispatch/DispatchLaneColumn'
import JobCard from '../components/dispatch/JobCard'
import EmergencyPanel from '../components/dispatch/EmergencyPanel'
import { toaster } from '../components/ui/toaster'

const LANES: { id: DispatchLane; title: string }[] = [
    { id: 'unassigned', title: 'Unassigned' },
    { id: 'en_route', title: 'En Route' },
    { id: 'on_site', title: 'On Site' },
    { id: 'complete', title: 'Complete' },
]

export default function DispatchBoard() {
    const queryClient = useQueryClient()
    const jobsQuery = useQuery({ queryKey: ['dispatchJobs'], queryFn: listTodaysJobs, refetchInterval: 30_000 })
    const [showEmergency, setShowEmergency] = useState(false)

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dispatchJobs'] })

    const assignMutation = useMutation({
        mutationFn: ({ jobId, technicianId }: { jobId: string; technicianId: string }) => assignTech(jobId, technicianId),
        onSuccess: invalidate,
        onError: () => toaster.create({ title: "Couldn't assign that tech", type: 'error' }),
    })

    const etaMutation = useMutation({
        mutationFn: (jobId: string) => sendEtaNotification(jobId),
        onSuccess: (result) => {
            toaster.create({ title: result.message, type: result.ok ? 'success' : 'warning' })
            if (result.ok) invalidate()
        },
        onError: () => toaster.create({ title: "Couldn't send the notification", type: 'error' }),
    })

    const moveMutation = useMutation({
        mutationFn: ({ job, lane }: { job: DispatchJob; lane: DispatchLane }) => moveJobToLane(job, lane),
        onSuccess: invalidate,
        onError: () => toaster.create({ title: "Couldn't move that job", type: 'error' }),
    })

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over) return
        const job = active.data.current?.job as DispatchJob | undefined
        if (!job) return
        const targetLane = over.id as DispatchLane
        if (laneForJob(job) === targetLane) return
        moveMutation.mutate({ job, lane: targetLane })
    }

    const jobs = jobsQuery.data ?? []
    const emergencies = emergencyUnassignedJobs(jobs)

    return (
        <Box maxW="7xl" mx="auto" mt="8" p="6">
            <HStack justify="space-between" mb="4">
                <Text fontSize="xl" fontWeight="bold">Dispatch board</Text>
                <HStack>
                    {emergencies.length > 0 && (
                        <Button colorPalette="red" size="sm" onClick={() => setShowEmergency((v) => !v)}>
                            {emergencies.length} emergency job{emergencies.length === 1 ? '' : 's'} unassigned
                        </Button>
                    )}
                    <RouterLink to="/">
                        <Button variant="surface" size="sm">Back to dashboard</Button>
                    </RouterLink>
                </HStack>
            </HStack>

            {jobsQuery.isLoading && <Text color="gray.500">Loading today's jobs…</Text>}
            {jobsQuery.isError && <Text color="red.500">Couldn't load today's jobs.</Text>}

            {showEmergency && (
                <EmergencyPanel
                    jobs={emergencies}
                    onAssign={(jobId, technicianId) => assignMutation.mutate({ jobId, technicianId })}
                    assigning={assignMutation.isPending}
                />
            )}

            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <HStack align="start" gap="4" overflowX="auto">
                    {LANES.map((lane) => (
                        <DispatchLaneColumn
                            key={lane.id}
                            lane={lane.id}
                            title={lane.title}
                            count={laneJobs(jobs, lane.id).length}
                        >
                            {laneJobs(jobs, lane.id).map((job) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    draggable={lane.id !== 'unassigned'}
                                    onAssign={(technicianId) => assignMutation.mutate({ jobId: job.id, technicianId })}
                                    assigning={assignMutation.isPending}
                                    onSendEta={() => etaMutation.mutate(job.id)}
                                    sendingEta={etaMutation.isPending}
                                />
                            ))}
                        </DispatchLaneColumn>
                    ))}
                </HStack>
            </DndContext>
        </Box>
    )
}
