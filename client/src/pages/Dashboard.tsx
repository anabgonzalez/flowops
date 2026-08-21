import { Link as RouterLink } from 'react-router-dom'
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

                <RouterLink to="/booking/new">
                    <Button colorPalette="blue" alignSelf="start">New booking</Button>
                </RouterLink>

                {profile && ['owner', 'gm', 'office_manager', 'dispatcher'].includes(profile.role) && (
                    <RouterLink to="/dispatch">
                        <Button variant="surface" alignSelf="start">Dispatch board</Button>
                    </RouterLink>
                )}

                {profile && ['service_technician', 'comfort_advisor', 'install_crew_lead', 'install_helper'].includes(profile.role) && (
                    <RouterLink to="/tech/jobs">
                        <Button variant="surface" alignSelf="start">My jobs</Button>
                    </RouterLink>
                )}

                {profile && (profile.role === 'owner' || profile.role === 'gm') && (
                    <RouterLink to="/team">
                        <Button variant="surface" alignSelf="start">Team</Button>
                    </RouterLink>
                )}

                <Button onClick={() => signOut()} variant="surface" alignSelf="start">
                    Sign out
                </Button>
            </Stack>
        </Box>
    )
}
