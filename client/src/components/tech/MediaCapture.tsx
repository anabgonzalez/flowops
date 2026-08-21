import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Button, HStack, Heading, Image, SimpleGrid, Text } from '@chakra-ui/react'
import { listJobMedia, uploadJobMedia, getSignedMediaUrl } from '../../lib/tech'
import { toaster } from '../../components/ui/toaster'

interface Props {
    jobId: string
    propertyId: string
}

function Thumbnail({ path, mediaType }: { path: string; mediaType: string }) {
    const { data: url } = useQuery({
        queryKey: ['signedMediaUrl', path],
        queryFn: () => getSignedMediaUrl('job-media', path),
        staleTime: 1000 * 60 * 50,
    })
    if (!url) return <Box bg="bg.subtle" borderRadius="md" aspectRatio={1} />
    if (mediaType === 'video') {
        return <video src={url} controls style={{ borderRadius: 6, width: '100%', aspectRatio: '1' }} />
    }
    return <Image src={url} borderRadius="md" objectFit="cover" aspectRatio={1} />
}

export default function MediaCapture({ jobId, propertyId }: Props) {
    const queryClient = useQueryClient()
    const photoInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const [pendingCount, setPendingCount] = useState(0)

    const mediaQuery = useQuery({ queryKey: ['jobMedia', jobId], queryFn: () => listJobMedia(jobId) })

    const uploadMutation = useMutation({
        mutationFn: (payload: { blob: Blob; mediaType: 'photo' | 'video' }) =>
            uploadJobMedia({ jobId, propertyId, mediaType: payload.mediaType, caption: null, blob: payload.blob }),
        onMutate: () => setPendingCount((n) => n + 1),
        onSettled: () => setPendingCount((n) => Math.max(0, n - 1)),
        onSuccess: (outcome) => {
            queryClient.invalidateQueries({ queryKey: ['jobMedia', jobId] })
            toaster.create({
                title: outcome === 'sent' ? 'Saved' : 'Saved locally -- will upload when back online',
                type: outcome === 'sent' ? 'success' : 'info',
            })
        },
        onError: () => toaster.create({ title: "Couldn't save that photo/video", type: 'error' }),
    })

    function handleFile(mediaType: 'photo' | 'video') {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) uploadMutation.mutate({ blob: file, mediaType })
            e.target.value = ''
        }
    }

    return (
        <Box>
            <Heading size="sm" mb="2">Photos &amp; video</Heading>
            <HStack mb="3">
                <Button size="sm" variant="surface" onClick={() => photoInputRef.current?.click()}>
                    Take photo
                </Button>
                <Button size="sm" variant="surface" onClick={() => videoInputRef.current?.click()}>
                    Take video
                </Button>
                {pendingCount > 0 && <Text fontSize="sm" color="gray.500">{pendingCount} saving…</Text>}
            </HStack>
            <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={handleFile('photo')}
            />
            <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                hidden
                onChange={handleFile('video')}
            />

            <SimpleGrid columns={3} gap="2">
                {mediaQuery.data?.map((m) => (
                    <Thumbnail key={m.id} path={m.storage_path} mediaType={m.media_type} />
                ))}
            </SimpleGrid>
        </Box>
    )
}
