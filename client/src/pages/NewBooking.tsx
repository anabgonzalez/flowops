import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, HStack, Stack, Text } from '@chakra-ui/react'
import type { AvailableSlot, Customer, Job, JobType, Property } from '@flowops/shared'
import PhoneLookupStep from '../components/booking/PhoneLookupStep'
import JobTypeStep from '../components/booking/JobTypeStep'
import AvailabilityStep from '../components/booking/AvailabilityStep'
import ConfirmStep from '../components/booking/ConfirmStep'
import MembershipPitch from '../components/booking/MembershipPitch'

type Step = 'lookup' | 'job_type' | 'availability' | 'confirm' | 'done'

export default function NewBooking() {
    const [step, setStep] = useState<Step>('lookup')
    const [customer, setCustomer] = useState<Customer | null>(null)
    const [property, setProperty] = useState<Property | null>(null)
    const [jobType, setJobType] = useState<JobType | null>(null)
    const [parentJobId, setParentJobId] = useState<string | null>(null)
    const [slot, setSlot] = useState<AvailableSlot | null>(null)
    const [bookedJob, setBookedJob] = useState<Job | null>(null)

    function reset() {
        setStep('lookup')
        setCustomer(null)
        setProperty(null)
        setJobType(null)
        setParentJobId(null)
        setSlot(null)
        setBookedJob(null)
    }

    return (
        <Box maxW="2xl" mx="auto" mt="12" p="6">
            <HStack justify="space-between" mb="6">
                <Text fontSize="xl" fontWeight="bold">New booking</Text>
                <RouterLink to="/">
                    <Button variant="surface" size="sm">Back to dashboard</Button>
                </RouterLink>
            </HStack>

            {customer && step !== 'lookup' && step !== 'done' && (
                <Box mb="4">
                    <MembershipPitch customerId={customer.id} />
                </Box>
            )}

            {step === 'lookup' && (
                <PhoneLookupStep
                    onSelect={(c, p) => {
                        setCustomer(c)
                        setProperty(p)
                        setStep('job_type')
                    }}
                />
            )}

            {step === 'job_type' && customer && (
                <JobTypeStep
                    customerId={customer.id}
                    onSelect={(jt, parentId) => {
                        setJobType(jt)
                        setParentJobId(parentId)
                        setStep('availability')
                    }}
                />
            )}

            {step === 'availability' && property && jobType && (
                <AvailabilityStep
                    jobType={jobType}
                    postalCode={property.postal_code}
                    onSelect={(s) => {
                        setSlot(s)
                        setStep('confirm')
                    }}
                />
            )}

            {step === 'confirm' && customer && property && jobType && slot && (
                <ConfirmStep
                    customer={customer}
                    property={property}
                    jobType={jobType}
                    parentJobId={parentJobId}
                    slot={slot}
                    onBooked={(job) => {
                        setBookedJob(job)
                        setStep('done')
                    }}
                />
            )}

            {step === 'done' && bookedJob && (
                <Stack gap="4">
                    <Text fontWeight="bold" color="green.600">Booking confirmed</Text>
                    <Text fontSize="sm" color="gray.500">
                        Job scheduled for {slot?.start.toLocaleString()} with {slot?.technicianName}.
                    </Text>
                    <Button onClick={reset} alignSelf="start" colorPalette="blue">
                        Book another
                    </Button>
                </Stack>
            )}
        </Box>
    )
}
