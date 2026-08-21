import { Badge, Box, Button, Heading, Stack, Text } from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../lib/auth'

export default function Dashboard() {
    const { session, profile } = useAuth()

    return (
        <Box maxW="lg" mx="auto" mt="20" p="6">
            <Stack gap="4">
                <Heading size="lg">FlowOps</Heading>

                <Box borderWidth="1px" borderRadius="md" p="4">
                    <Text fontSize="sm" color="gray.500">Signed in as</Text>
                    <Text fontWeight="bold">{session?.user.email}</Text>

                    {profile ? (
                        <Stack direction="row" gap="2" mt="3">
                            <Badge colorPalette="blue">{profile.role}</Badge>
                            <Badge colorPalette="purple">
                                {profile.division ?? 'company-wide'}
                            </Badge>
                        </Stack>
                    ) : (
                        <Text mt="3" color="gray.500">Loading profile…</Text>
                    )}
                </Box>

                <Button onClick={() => signOut()} variant="outline" alignSelf="start">
                    Sign out
                </Button>
            </Stack>
        </Box>
    )
}
