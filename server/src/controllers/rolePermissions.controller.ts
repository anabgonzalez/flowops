import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../utils/AppError.js'
import { Role } from '../generated/prisma/enums.js'
import { sanitizePermissionsMap } from '../permissions.js'

export async function listRolePermissions(_req: Request, res: Response) {
  const rows = await prisma.rolePermissions.findMany({ orderBy: { role: 'asc' } })
  res.json(rows)
}

export async function updateRolePermissions(req: Request, res: Response) {
  const role = req.params.role
  if (!(role in Role)) throw new AppError(400, 'Unknown role')

  const permissions = sanitizePermissionsMap(req.body.permissions)
  const row = await prisma.rolePermissions.upsert({
    where: { role: role as Role },
    create: { role: role as Role, permissions },
    update: { permissions },
  })
  res.json(row)
}
