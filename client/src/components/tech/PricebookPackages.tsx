import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Box, Button, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import type { JobType } from '@flowops/shared'
import { listPricebookPackages, applyPricebookPackage } from '../../lib/tech'
import { toaster } from '../../components/ui/toaster'

const TIER_COLOR: Record<string, string> = { good: 'gray', better: 'blue', best: 'purple' }

interface Props {
    jobId: string
    jobType: JobType
}

/** Good/better/best presentation -- tap a tier to apply it as approved
 * line items on the job. Packages are SQL-seeded for this phase, no
 * authoring UI (see the Phase E plan). */
export default function PricebookPackages({ jobId, jobType }: Props) {
    const queryClient = useQueryClient()
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const packagesQuery = useQuery({
        queryKey: ['pricebookPackages', jobType],
        queryFn: () => listPricebookPackages(jobType),
    })

    const applyMutation = useMutation({
        mutationFn: (packageId: string) => applyPricebookPackage(jobId, packageId),
        onSuccess: (outcome, packageId) => {
            setSelectedId(packageId)
            queryClient.invalidateQueries({ queryKey: ['jobLineItems', jobId] })
            toaster.create({
                title: outcome === 'sent' ? 'Added to the job' : 'Saved locally -- will apply when back online',
                type: outcome === 'sent' ? 'success' : 'info',
            })
        },
        onError: () => toaster.create({ title: "Couldn't apply that package", type: 'error' }),
    })

    if (packagesQuery.isLoading) return <Text color="gray.500">Loading pricing options…</Text>
    if (!packagesQuery.data || packagesQuery.data.length === 0) return null

    return (
        <Box>
            <Heading size="sm" mb="2">Options</Heading>
            <SimpleGrid columns={{ base: 1, sm: 3 }} gap="3">
                {packagesQuery.data.map((pkg) => (
                    <Box
                        key={pkg.id}
                        borderWidth="2px"
                        borderColor={selectedId === pkg.id ? `${TIER_COLOR[pkg.tier]}.500` : 'border'}
                        borderRadius="md"
                        p="3"
                        cursor="pointer"
                        onClick={() => applyMutation.mutate(pkg.id)}
                    >
                        <Stack gap="1">
                            <Badge colorPalette={TIER_COLOR[pkg.tier]} size="sm" alignSelf="start">
                                {pkg.tier.toUpperCase()}
                            </Badge>
                            <Text fontWeight="bold">{pkg.name}</Text>
                            {pkg.description && <Text fontSize="sm" color="gray.500">{pkg.description}</Text>}
                            <Text fontSize="xl" fontWeight="bold">${pkg.total_price.toFixed(2)}</Text>
                            <Button
                                size="sm"
                                colorPalette={TIER_COLOR[pkg.tier]}
                                loading={applyMutation.isPending && applyMutation.variables === pkg.id}
                            >
                                {selectedId === pkg.id ? 'Selected' : 'Select'}
                            </Button>
                        </Stack>
                    </Box>
                ))}
            </SimpleGrid>
        </Box>
    )
}
