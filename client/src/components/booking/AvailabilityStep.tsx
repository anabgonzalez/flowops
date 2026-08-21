import { useQuery } from '@tanstack/react-query'
import { Box, Button, Grid, Stack, Text } from '@chakra-ui/react'
import type { AvailableSlot, JobType } from '@flowops/shared'
import { fetchAvailableSlots } from '../../lib/booking'

interface Props {
    jobType: JobType
    postalCode: string
    onSelect: (slot: AvailableSlot) => void
}

function dayLabel(date: Date): string {
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function timeLabel(date: Date): string {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export default function AvailabilityStep({ jobType, postalCode, onSelect }: Props) {
    const slotsQuery = useQuery({
        queryKey: ['availableSlots', jobType, postalCode],
        queryFn: () => fetchAvailableSlots(jobType, postalCode),
    })

    if (slotsQuery.isLoading) return <Text color="gray.500">Finding open slots…</Text>

    if (slotsQuery.isError) {
        return <Text color="red.500">Couldn't load availability. Try again.</Text>
    }

    const slots = slotsQuery.data ?? []

    if (slots.length === 0) {
        return (
            <Stack gap="2">
                <Text fontWeight="bold">No open slots in the next few days</Text>
                <Text fontSize="sm" color="gray.500">
                    No techs cover ZIP {postalCode} for this job type, or they're fully booked. Check with dispatch directly.
                </Text>
            </Stack>
        )
    }

    const byDay = new Map<string, AvailableSlot[]>()
    for (const slot of slots) {
        const key = dayLabel(slot.start)
        byDay.set(key, [...(byDay.get(key) ?? []), slot])
    }

    return (
        <Stack gap="4">
            <Text fontWeight="bold">Pick a time</Text>
            {[...byDay.entries()].map(([day, daySlots]) => (
                <Box key={day}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.500" mb="2">{day}</Text>
                    <Grid templateColumns="repeat(auto-fit, minmax(180px, 1fr))" gap="2">
                        {daySlots.map((slot, i) => (
                            <Button
                                key={`${slot.technicianId}-${slot.start.toISOString()}-${i}`}
                                variant="outline"
                                onClick={() => onSelect(slot)}
                                height="auto"
                                py="2"
                                whiteSpace="normal"
                                textAlign="center"
                            >
                                {timeLabel(slot.start)} · {slot.technicianName}
                            </Button>
                        ))}
                    </Grid>
                </Box>
            ))}
        </Stack>
    )
}
