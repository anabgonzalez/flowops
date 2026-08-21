import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link as RouterLink } from 'react-router-dom'
import { Badge, Box, Button, HStack, NativeSelect, Stack, Switch, Text } from '@chakra-ui/react'
import { userRoleSchema, divisionSchema, type UserProfile, type UserRole, type Division } from '@flowops/shared'
import { useAuth } from '../context/AuthContext'
import { listTeamMembers, updateTeamMember } from '../lib/team'

function formatLabel(value: string): string {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

type Updates = Partial<Pick<UserProfile, 'role' | 'division' | 'is_active'>>

export default function Team() {
    const { session } = useAuth()
    const queryClient = useQueryClient()
    const membersQuery = useQuery({ queryKey: ['teamMembers'], queryFn: listTeamMembers })

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Updates }) => updateTeamMember(id, updates),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teamMembers'] }),
    })

    return (
        <Box maxW="2xl" mx="auto" mt="12" p="6">
            <HStack justify="space-between" mb="6">
                <Text fontSize="xl" fontWeight="bold">Team</Text>
                <RouterLink to="/">
                    <Button variant="surface" size="sm">Back to dashboard</Button>
                </RouterLink>
            </HStack>

            {membersQuery.isLoading && <Text color="gray.500">Loading…</Text>}
            {membersQuery.isError && <Text color="red.500">Couldn't load the team.</Text>}

            <Stack gap="3">
                {membersQuery.data?.map((member) => {
                    const isSelf = member.id === session?.user.id

                    return (
                        <Box key={member.id} borderWidth="1px" borderRadius="md" p="4">
                            <HStack justify="space-between" wrap="wrap" gap="3">
                                <Box>
                                    <Text fontWeight="bold">
                                        {member.full_name}
                                        {isSelf && <Badge ml="2" colorPalette="blue">You</Badge>}
                                    </Text>
                                    <Text fontSize="sm" color="gray.500">{member.email}</Text>
                                    {member.phone && <Text fontSize="sm" color="gray.500">{member.phone}</Text>}
                                    {!member.is_active && <Badge colorPalette="red" mt="1">Inactive</Badge>}
                                </Box>

                                {isSelf ? (
                                    <Text fontSize="sm" color="gray.500">
                                        Can't edit your own role or status here — ask another Owner/GM.
                                    </Text>
                                ) : (
                                    <HStack gap="3">
                                        <NativeSelect.Root size="sm" width="200px">
                                            <NativeSelect.Field
                                                value={member.role}
                                                onChange={(e) =>
                                                    updateMutation.mutate({
                                                        id: member.id,
                                                        updates: { role: e.target.value as UserRole },
                                                    })
                                                }
                                            >
                                                {userRoleSchema.options.map((role) => (
                                                    <option key={role} value={role}>{formatLabel(role)}</option>
                                                ))}
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>

                                        <NativeSelect.Root size="sm" width="160px">
                                            <NativeSelect.Field
                                                value={member.division ?? ''}
                                                onChange={(e) =>
                                                    updateMutation.mutate({
                                                        id: member.id,
                                                        updates: { division: (e.target.value || null) as Division | null },
                                                    })
                                                }
                                            >
                                                <option value="">Company-wide</option>
                                                {divisionSchema.options.map((division) => (
                                                    <option key={division} value={division}>{formatLabel(division)}</option>
                                                ))}
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>

                                        <Switch.Root
                                            checked={member.is_active}
                                            onCheckedChange={({ checked }) =>
                                                updateMutation.mutate({ id: member.id, updates: { is_active: checked } })
                                            }
                                        >
                                            <Switch.HiddenInput />
                                            <Switch.Control />
                                            <Switch.Label>Active</Switch.Label>
                                        </Switch.Root>
                                    </HStack>
                                )}
                            </HStack>
                        </Box>
                    )
                })}
            </Stack>
        </Box>
    )
}
