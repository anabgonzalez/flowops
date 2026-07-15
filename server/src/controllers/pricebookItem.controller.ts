import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import type { Prisma } from '../generated/prisma/client.js'
import { PricebookItemType } from '../generated/prisma/enums.js'
import { AppError } from '../utils/AppError.js'

const itemInclude = {
  category: true,
  components: { include: { componentItem: true } },
}

function parseType(value: unknown): PricebookItemType | undefined {
  return typeof value === 'string' && value in PricebookItemType ? (value as PricebookItemType) : undefined
}

// Mirrors the rule in pricebookCategory.controller.ts: a category with
// subcategories is a "folder" and can't hold items directly.
async function assertCategoryCanHoldItems(categoryId: string) {
  const childCount = await prisma.pricebookCategory.count({ where: { parentId: categoryId } })
  if (childCount > 0) {
    throw new AppError(400, 'This category has subcategories - assign the item to one of them instead')
  }
}

// All the editable fields, shared by create/update so both accept the
// same shape - Express req.body is untyped, so this just narrows it.
function pickFields(body: Record<string, unknown>) {
  return {
    code: body.code as string | undefined,
    name: body.name as string | undefined,
    description: body.description as string | undefined,
    type: body.type as PricebookItemType | undefined,
    categoryId: body.categoryId === undefined ? undefined : (body.categoryId as string | null) || null,
    costCents: body.costCents as number | undefined,
    priceCents: body.priceCents as number | undefined,
    memberPriceCents: body.memberPriceCents as number | null | undefined,
    addOnPriceCents: body.addOnPriceCents as number | null | undefined,
    markupPercent: body.markupPercent as number | null | undefined,
    pricingMethod: body.pricingMethod as 'FLAT_RATE' | 'TIME_AND_MATERIALS' | undefined,
    laborRateCents: body.laborRateCents as number | null | undefined,
    estimatedDurationMinutes: body.estimatedDurationMinutes as number | null | undefined,
    unitOfMeasure: body.unitOfMeasure as string | undefined,
    taxable: body.taxable as boolean | undefined,
    nonDiscountable: body.nonDiscountable as boolean | undefined,
    warrantyDurationMonths: body.warrantyDurationMonths as number | null | undefined,
    warrantyTerms: body.warrantyTerms as string | null | undefined,
    vendorName: body.vendorName as string | null | undefined,
    vendorPartNumber: body.vendorPartNumber as string | null | undefined,
    imageUrl: body.imageUrl as string | null | undefined,
    active: body.active as boolean | undefined,
  }
}

export async function listPricebookItems(req: Request, res: Response) {
  const activeOnly = req.query.active === 'true'
  const type = parseType(req.query.type)
  const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined
  const items = await prisma.pricebookItem.findMany({
    where: {
      active: activeOnly ? true : undefined,
      type,
      categoryId,
    },
    include: itemInclude,
    orderBy: { name: 'asc' },
  })
  res.json(items)
}

export async function getPricebookItem(req: Request, res: Response) {
  const item = await prisma.pricebookItem.findUnique({
    where: { id: req.params.id },
    include: itemInclude,
  })
  if (!item) throw new AppError(404, 'Pricebook item not found')
  res.json(item)
}

export async function createPricebookItem(req: Request, res: Response) {
  const fields = pickFields(req.body)
  if (!fields.code || !fields.name || !fields.type || fields.costCents == null || fields.priceCents == null) {
    throw new AppError(400, 'code, name, type, costCents, and priceCents are required')
  }
  if (fields.categoryId) {
    await assertCategoryCanHoldItems(fields.categoryId)
  }
  const item = await prisma.pricebookItem.create({
    data: fields as Prisma.PricebookItemUncheckedCreateInput,
    include: itemInclude,
  })
  res.status(201).json(item)
}

export async function updatePricebookItem(req: Request, res: Response) {
  const fields = pickFields(req.body)
  if (fields.categoryId) {
    await assertCategoryCanHoldItems(fields.categoryId)
  }
  const item = await prisma.pricebookItem.update({
    where: { id: req.params.id },
    data: fields as Prisma.PricebookItemUncheckedUpdateInput,
    include: itemInclude,
  })
  res.json(item)
}

export async function deletePricebookItem(req: Request, res: Response) {
  await prisma.pricebookItem.delete({ where: { id: req.params.id } })
  res.status(204).send()
}
