import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

// Wipes the entire pricebook: all items (Services, Materials, Equipment,
// Other) and all categories/subcategories. Existing estimate/invoice line
// items are untouched - they store their own description/price snapshot,
// they just lose their backlink to a pricebook item (pricebookItemId ->
// null), same as deleting a single item already does.
export async function resetPricebook(_req: Request, res: Response) {
  await prisma.pricebookItem.deleteMany({})
  await prisma.pricebookCategory.deleteMany({})
  res.status(204).send()
}
