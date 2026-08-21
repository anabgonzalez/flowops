import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Box, Button, Grid, Input, Stack, Text } from '@chakra-ui/react'
import type { Customer, Property } from '@flowops/shared'
import { createCustomer, createPropertyForCustomer } from '../../lib/booking'

interface Props {
    initialPhone: string
    onCreated: (customer: Customer, property: Property) => void
}

export default function NewCustomerForm({ initialPhone, onCreated }: Props) {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState(initialPhone)
    const [email, setEmail] = useState('')
    const [addressLine1, setAddressLine1] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [postalCode, setPostalCode] = useState('')

    const mutation = useMutation({
        mutationFn: async () => {
            const customer = await createCustomer({ firstName, lastName, phone, email: email || undefined })
            const property = await createPropertyForCustomer(customer.id, { addressLine1, city, state, postalCode })
            return { customer, property }
        },
        onSuccess: ({ customer, property }) => onCreated(customer, property),
    })

    function handleSubmit(event: FormEvent) {
        event.preventDefault()
        mutation.mutate()
    }

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <Text fontWeight="bold" mb="3">No match — create a new customer</Text>
            <Stack gap="3">
                <Grid templateColumns="1fr 1fr" gap="3">
                    <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </Grid>
                <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <Input placeholder="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input placeholder="Street address" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required />
                <Grid templateColumns="2fr 1fr 1fr" gap="3">
                    <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
                    <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} required />
                    <Input placeholder="ZIP" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
                </Grid>
                {mutation.isError && (
                    <Text color="red.500" fontSize="sm">
                        {mutation.error instanceof Error ? mutation.error.message : 'Something went wrong'}
                    </Text>
                )}
                <Button type="submit" colorPalette="blue" loading={mutation.isPending} alignSelf="start">
                    Create and continue
                </Button>
            </Stack>
        </Box>
    )
}
