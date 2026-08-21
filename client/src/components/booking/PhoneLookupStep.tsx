import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box, Button, HStack, Input, RadioGroup, Stack, Text } from '@chakra-ui/react'
import type { Customer, Property } from '@flowops/shared'
import { searchCustomersByPhone, formatPhone } from '../../lib/booking'
import NewCustomerForm from './NewCustomerForm'

interface Props {
    onSelect: (customer: Customer, property: Property) => void
}

export default function PhoneLookupStep({ onSelect }: Props) {
    const [phoneInput, setPhoneInput] = useState('')
    const [submittedPhone, setSubmittedPhone] = useState('')
    const [selectedPropertyId, setSelectedPropertyId] = useState<Record<string, string>>({})

    const searchQuery = useQuery({
        queryKey: ['customerSearch', submittedPhone],
        queryFn: () => searchCustomersByPhone(submittedPhone),
        enabled: submittedPhone.length >= 7,
    })

    function handleSearch(event: FormEvent) {
        event.preventDefault()
        setSubmittedPhone(phoneInput)
    }

    const results = searchQuery.data ?? []
    const hasSearched = submittedPhone.length >= 7 && searchQuery.isFetched

    return (
        <Stack gap="4">
            <Box as="form" onSubmit={handleSearch}>
                <Text fontWeight="bold" mb="2">Look up by phone number</Text>
                <HStack>
                    <Input
                        placeholder="(512) 555-1234"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                    />
                    <Button type="submit" loading={searchQuery.isFetching} colorPalette="blue">
                        Search
                    </Button>
                </HStack>
            </Box>

            {results.map(({ customer, properties }) => (
                <Box key={customer.id} borderWidth="1px" borderRadius="md" p="4">
                    <Text fontWeight="bold">{customer.first_name} {customer.last_name}</Text>
                    <Text fontSize="sm" color="gray.500">{formatPhone(customer.phone)}</Text>

                    {properties.length === 0 ? (
                        <Text fontSize="sm" mt="2" color="gray.500">No properties on file for this customer.</Text>
                    ) : (
                        <RadioGroup.Root
                            mt="3"
                            value={selectedPropertyId[customer.id] ?? ''}
                            onValueChange={({ value }) => setSelectedPropertyId((prev) => ({ ...prev, [customer.id]: value ?? '' }))}
                        >
                            <Stack gap="2">
                                {properties.map((property) => (
                                    <RadioGroup.Item key={property.id} value={property.id}>
                                        <RadioGroup.ItemHiddenInput />
                                        <RadioGroup.ItemIndicator />
                                        <RadioGroup.ItemText>
                                            {property.address_line1}, {property.city}, {property.state} {property.postal_code}
                                        </RadioGroup.ItemText>
                                    </RadioGroup.Item>
                                ))}
                            </Stack>
                        </RadioGroup.Root>
                    )}

                    <Button
                        mt="3"
                        size="sm"
                        colorPalette="blue"
                        disabled={!selectedPropertyId[customer.id]}
                        onClick={() => {
                            const property = properties.find((p) => p.id === selectedPropertyId[customer.id])
                            if (property) onSelect(customer, property)
                        }}
                    >
                        Continue with this property
                    </Button>
                </Box>
            ))}

            {hasSearched && results.length === 0 && (
                <NewCustomerForm initialPhone={phoneInput} onCreated={onSelect} />
            )}
        </Stack>
    )
}
