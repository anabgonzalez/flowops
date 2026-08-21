import { useParams, Link as RouterLink } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Box, Button, HStack, Heading, Separator, Stack, Text } from '@chakra-ui/react'
import { getJobDetail, listJobLineItems, uploadSignature } from '../lib/tech'
import { JOB_TYPE_COLOR, formatLabel } from '../lib/dispatchColors'
import { useOutboxSync } from '../hooks/useOutboxSync'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import PropertyHistoryPanel from '../components/tech/PropertyHistoryPanel'
import PricebookPackages from '../components/tech/PricebookPackages'
import MediaCapture from '../components/tech/MediaCapture'
import ActionButtons from '../components/tech/ActionButtons'
import SignaturePad from '../components/tech/SignaturePad'
import PaymentPanel from '../components/tech/PaymentPanel'
import { toaster } from '../components/ui/toaster'

export default function TechJobDetail() {
    const { jobId } = useParams<{ jobId: string }>()
    const queryClient = useQueryClient()
    const pending = useOutboxSync()
    const online = useOnlineStatus()

    const jobQuery = useQuery({
        queryKey: ['techJob', jobId],
        queryFn: () => getJobDetail(jobId!),
        enabled: Boolean(jobId),
    })
    const lineItemsQuery = useQuery({
        queryKey: ['jobLineItems', jobId],
        queryFn: () => listJobLineItems(jobId!),
        enabled: Boolean(jobId),
    })

    const signatureMutation = useMutation({
        mutationFn: (payload: { blob: Blob; signerName: string }) =>
            uploadSignature({ jobId: jobId!, signerName: payload.signerName, blob: payload.blob }),
        onSuccess: (outcome) => {
            queryClient.invalidateQueries({ queryKey: ['jobSignatures', jobId] })
            toaster.create({
                title: outcome === 'sent' ? 'Signature saved' : 'Saved locally -- will upload when back online',
                type: outcome === 'sent' ? 'success' : 'info',
            })
        },
        onError: () => toaster.create({ title: "Couldn't save the signature", type: 'error' }),
    })

    if (!jobId) return null
    if (jobQuery.isLoading) return <Text color="gray.500" p="4">Loading…</Text>
    if (jobQuery.isError || !jobQuery.data) return <Text color="red.500" p="4">Couldn't load this job.</Text>

    const job = jobQuery.data

    return (
        <Box maxW="md" mx="auto" mt="6" p="4" pb="16">
            <HStack justify="space-between" mb="3">
                <RouterLink to="/tech/jobs">
                    <Button variant="surface" size="sm">Back</Button>
                </RouterLink>
                {!online && <Badge colorPalette="orange">Offline</Badge>}
                {pending > 0 && <Badge colorPalette="blue">{pending} pending</Badge>}
            </HStack>

            <Badge colorPalette={JOB_TYPE_COLOR[job.job_type]} mb="1">{formatLabel(job.job_type)}</Badge>
            <Heading size="md">{job.customer_name}</Heading>
            <Text color="gray.500">{job.property_address}</Text>
            {job.customer_phone && <Text color="gray.500">{job.customer_phone}</Text>}
            <Text mt="2">{job.summary}</Text>
            {job.description && <Text fontSize="sm" color="gray.500">{job.description}</Text>}

            <Separator my="4" />
            <PropertyHistoryPanel propertyId={job.property_id} currentJobId={job.id} />

            <Separator my="4" />
            <PricebookPackages jobId={job.id} jobType={job.job_type} />

            {lineItemsQuery.data && lineItemsQuery.data.length > 0 && (
                <Box mt="3">
                    <Heading size="sm" mb="2">On this job</Heading>
                    <Stack gap="1">
                        {lineItemsQuery.data.map((li) => (
                            <HStack key={li.id} justify="space-between" fontSize="sm">
                                <Text>{li.description} {!li.is_approved && <Text as="span" color="gray.500">(pending)</Text>}</Text>
                                <Text>${li.total.toFixed(2)}</Text>
                            </HStack>
                        ))}
                    </Stack>
                </Box>
            )}

            <Separator my="4" />
            <MediaCapture jobId={job.id} propertyId={job.property_id} />

            <Separator my="4" />
            <Heading size="sm" mb="2">Actions</Heading>
            <ActionButtons jobId={job.id} />

            <Separator my="4" />
            <SignaturePad
                capturing={signatureMutation.isPending}
                onCapture={(blob, signerName) => signatureMutation.mutate({ blob, signerName })}
            />

            <Separator my="4" />
            <PaymentPanel jobId={job.id} />
        </Box>
    )
}
