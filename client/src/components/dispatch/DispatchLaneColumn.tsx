import { useDroppable } from '@dnd-kit/core'
import { Box, Heading, Stack, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import type { DispatchLane } from '@flowops/shared'

interface Props {
    lane: DispatchLane
    title: string
    count: number
    children: ReactNode
}

export default function DispatchLaneColumn({ lane, title, count, children }: Props) {
    const { setNodeRef, isOver } = useDroppable({ id: lane })

    return (
        <Box
            ref={setNodeRef}
            flex="1"
            minW="260px"
            bg={isOver ? 'bg.emphasized' : 'bg.subtle'}
            borderRadius="md"
            p="3"
            minH="200px"
        >
            <Heading size="sm" mb="3">
                {title} <Text as="span" color="gray.500" fontWeight="normal">({count})</Text>
            </Heading>
            <Stack gap="0">{children}</Stack>
        </Box>
    )
}
