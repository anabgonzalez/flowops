import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'

const customerInclude = {
  locations: { include: { tags: true, contacts: true } },
  tags: true,
}

export async function listCustomers(_req: Request, res: Response) {
  const customers = await prisma.customer.findMany({
    include: customerInclude,
    orderBy: { name: 'asc' },
  })
  res.json(customers)
}

export async function getCustomer(req: Request, res: Response) {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: customerInclude,
  })
  if (!customer) throw new AppError(404, 'Customer not found')
  res.json(customer)
}

export async function createCustomer(req: Request, res: Response) {
  const { name, email, phone, type, notes, tagIds } = req.body
  if (!name) throw new AppError(400, 'name is required')
  const customer = await prisma.customer.create({
    data: {
      name,
      email,
      phone,
      type,
      notes,
      tags: tagIds && tagIds.length > 0 ? { connect: tagIds.map((id: string) => ({ id })) } : undefined,
    },
    include: customerInclude,
  })
  res.status(201).json(customer)
}

export async function updateCustomer(req: Request, res: Response) {
  const { name, email, phone, type, notes, tagIds } = req.body
  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: {
      name,
      email,
      phone,
      type,
      notes,
      tags: tagIds ? { set: tagIds.map((id: string) => ({ id })) } : undefined,
    },
    include: customerInclude,
  })
  res.json(customer)
}

export async function deleteCustomer(req: Request, res: Response) {
  await prisma.customer.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
