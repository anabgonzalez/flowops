import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Heading, Input, Stack, Text } from '@chakra-ui/react'
import { signInWithPassword, signUpWithPassword } from '../lib/auth'

export default function Login() {
    const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [info, setInfo] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const navigate = useNavigate()

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        setError(null)
        setInfo(null)
        setSubmitting(true)

        try {
            if (mode === 'sign_in') {
                await signInWithPassword(email, password)
                navigate('/')
            } else {
                const { session } = await signUpWithPassword(email, password, fullName)
                if (session) {
                    navigate('/')
                } else {
                    setInfo('Account created. Check your email to confirm before signing in.')
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Box maxW="sm" mx="auto" mt="20" p="6">
            <Heading size="lg" mb="6">
                {mode === 'sign_in' ? 'Sign in to FlowOps' : 'Create your FlowOps account'}
            </Heading>

            <form onSubmit={handleSubmit}>
                <Stack gap="4">
                    {mode === 'sign_up' && (
                        <Box>
                            <Text fontSize="sm" mb="1">Full name</Text>
                            <Input
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </Box>
                    )}

                    <Box>
                        <Text fontSize="sm" mb="1">Email</Text>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </Box>

                    <Box>
                        <Text fontSize="sm" mb="1">Password</Text>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </Box>

                    {error && <Text color="red.500" fontSize="sm">{error}</Text>}
                    {info && <Text color="green.600" fontSize="sm">{info}</Text>}

                    <Button type="submit" loading={submitting} colorPalette="blue">
                        {mode === 'sign_in' ? 'Sign in' : 'Sign up'}
                    </Button>
                </Stack>
            </form>

            <Text fontSize="sm" mt="4">
                {mode === 'sign_in' ? "Don't have an account? " : 'Already have an account? '}
                <Button
                    variant="surface"
                    size="sm"
                    onClick={() => {
                        setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')
                        setError(null)
                        setInfo(null)
                    }}
                >
                    {mode === 'sign_in' ? 'Sign up' : 'Sign in'}
                </Button>
            </Text>
        </Box>
    )
}
