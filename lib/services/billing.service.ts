import { prisma } from '../db'
import { MONTHLY_KAS_AMOUNT, DEFAULT_DUE_DAY } from '../constants'
import { getMonthName } from '../utils'

export async function generateMonthlyBilling(month: number, year: number, roles?: string[], amountOverride?: number) {
  // Check if already exists
  const existing = await prisma.billing.findFirst({
    where: { type: 'MONTHLY_KAS', month, year }
  })

  if (existing) {
    throw new Error(`Tagihan kas bulan ${getMonthName(month)} ${year} sudah dibuat`)
  }

  // Get the default fund (first fund, typically 'Kas Utama')
  const defaultFund = await prisma.fund.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!defaultFund) {
    throw new Error('Belum ada dana yang dibuat. Buat dana terlebih dahulu.')
  }

  const dueDate = new Date(year, month - 1, DEFAULT_DUE_DAY)
  const title = `Kas ${getMonthName(month)} ${year}`

  // Determine billing amount
  const amount = amountOverride !== undefined ? amountOverride : MONTHLY_KAS_AMOUNT

  // Create billing and member billings in a transaction
  return prisma.$transaction(async (tx) => {
    const billing = await tx.billing.create({
      data: {
        title,
        type: 'MONTHLY_KAS',
        amount,
        dueDate,
        month,
        year,
        fundId: defaultFund.id
      }
    })

    // Build member filter
    const memberWhere: any = {
      status: 'AKTIF',
      joinDate: { lte: new Date(year, month - 1, 28) } // joined by end of billing month
    }
    if (roles && roles.length > 0) {
      memberWhere.role = { in: roles }
    }

    // Get active members matching filter
    const members = await tx.member.findMany({ where: memberWhere })

    if (members.length > 0) {
      await tx.memberBilling.createMany({
        data: members.map(member => ({
          memberId: member.id,
          billingId: billing.id,
          status: dueDate < new Date() ? 'MENUNGGAK' : 'BELUM_BAYAR'
        }))
      })
    }

    return billing
  })
}

export async function createCustomBilling(
  title: string,
  amount: number,
  dueDate: Date,
  fundId: string,
  description?: string,
  memberIds?: string[],
  roles?: ('MUASSIS' | 'ANGGOTA')[]
) {
  return prisma.$transaction(async (tx) => {
    const billing = await tx.billing.create({
      data: {
        title,
        type: 'CUSTOM',
        amount,
        dueDate,
        fundId,
        description
      }
    })

    // If specific members, use those; otherwise active members (optionally filtered by roles)
    let targetMemberIds: string[]
    if (memberIds && memberIds.length > 0) {
      targetMemberIds = memberIds
    } else {
      const activeMembersWhere: any = { status: 'AKTIF' }
      if (roles && roles.length > 0) {
        activeMembersWhere.role = { in: roles }
      }
      const activeMembers = await tx.member.findMany({
        where: activeMembersWhere,
        select: { id: true }
      })
      targetMemberIds = activeMembers.map(m => m.id)
    }

    if (targetMemberIds.length > 0) {
      await tx.memberBilling.createMany({
        data: targetMemberIds.map(memberId => ({
          memberId,
          billingId: billing.id,
          status: dueDate < new Date() ? 'MENUNGGAK' : 'BELUM_BAYAR'
        }))
      })
    }

    return billing
  })
}

export async function getAllBillings() {
  const billings = await prisma.billing.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      fund: { select: { id: true, name: true } },
      memberBillings: {
        select: {
          id: true,
          status: true,
          member: {
            select: { id: true, name: true, role: true }
          }
        }
      }
    }
  })

  return billings.map(b => {
    const roles = Array.from(new Set(b.memberBillings.map(mb => mb.member?.role).filter(Boolean)))
    return {
      ...b,
      roles
    }
  })
}

export async function getMonthlyBillings() {
  const billings = await prisma.billing.findMany({
    where: { type: 'MONTHLY_KAS' },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    include: {
      fund: { select: { id: true, name: true } },
      memberBillings: {
        select: {
          id: true,
          status: true,
          member: {
            select: { id: true, name: true, role: true }
          }
        }
      }
    }
  })

  return billings.map(b => {
    const roles = Array.from(new Set(b.memberBillings.map(mb => mb.member?.role).filter(Boolean)))
    return {
      ...b,
      roles
    }
  })
}

export async function getCustomBillings() {
  const billings = await prisma.billing.findMany({
    where: { type: 'CUSTOM' },
    orderBy: { createdAt: 'desc' },
    include: {
      fund: { select: { id: true, name: true } },
      memberBillings: {
        select: {
          id: true,
          status: true,
          member: {
            select: { id: true, name: true, role: true }
          }
        }
      }
    }
  })

  return billings.map(b => {
    const roles = Array.from(new Set(b.memberBillings.map(mb => mb.member?.role).filter(Boolean)))
    return {
      ...b,
      roles
    }
  })
}

export async function checkAndMarkOverdue() {
  const now = new Date()
  await prisma.memberBilling.updateMany({
    where: {
      status: 'BELUM_BAYAR',
      billing: { dueDate: { lt: now } }
    },
    data: { status: 'MENUNGGAK' }
  })
}

export async function updateBilling(id: string, data: {
  title?: string
  amount?: number
  dueDate?: Date
  fundId?: string
  description?: string
  roles?: ('MUASSIS' | 'ANGGOTA')[]
}) {
  return prisma.$transaction(async (tx) => {
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
    if (data.fundId !== undefined) updateData.fundId = data.fundId
    if (data.description !== undefined) updateData.description = data.description

    const billing = await tx.billing.update({
      where: { id },
      data: updateData,
      include: {
        fund: { select: { id: true, name: true } },
        memberBillings: {
          include: {
            member: { select: { id: true, name: true, role: true } }
          }
        }
      }
    })

    // If roles is provided, sync target members
    if (data.roles !== undefined) {
      // Find active members matching target roles
      const activeMembersWhere: any = { status: 'AKTIF' }
      if (data.roles.length > 0) {
        activeMembersWhere.role = { in: data.roles }
      }
      const targetMembers = await tx.member.findMany({
        where: activeMembersWhere,
        select: { id: true, role: true }
      })
      const targetMemberIdSet = new Set(targetMembers.map(m => m.id))

      // Current member billings
      const existingMemberBillings = billing.memberBillings
      const existingMemberIdSet = new Set(existingMemberBillings.map(mb => mb.memberId))

      // 1. Members to remove: existing members not in targetMemberIdSet
      // Only remove if status is NOT LUNAS (preserve paid history)
      const toRemove = existingMemberBillings.filter(mb =>
        !targetMemberIdSet.has(mb.memberId) && mb.status !== 'LUNAS'
      )
      if (toRemove.length > 0) {
        const toRemoveIds = toRemove.map(mb => mb.id)
        await tx.incomeTransaction.deleteMany({
          where: { memberBillingId: { in: toRemoveIds } }
        })
        await tx.paymentRequest.deleteMany({
          where: { memberBillingId: { in: toRemoveIds } }
        })
        await tx.memberBilling.deleteMany({
          where: { id: { in: toRemoveIds } }
        })
      }

      // 2. Members to add: target members not yet in existingMemberIdSet
      const toAdd = targetMembers.filter(m => !existingMemberIdSet.has(m.id))
      if (toAdd.length > 0) {
        const finalDueDate = data.dueDate ?? billing.dueDate
        await tx.memberBilling.createMany({
          data: toAdd.map(m => ({
            memberId: m.id,
            billingId: id,
            status: finalDueDate < new Date() ? 'MENUNGGAK' : 'BELUM_BAYAR'
          }))
        })
      }
    }

    return billing
  })
}

export async function deleteBilling(id: string) {
  if (!id) {
    throw new Error('Missing billing id')
  }

  // Delete related income transactions and member billings in a transaction
  return prisma.$transaction(async (tx) => {
    // Delete income transactions linked to member billings of this billing
    const memberBillings = await tx.memberBilling.findMany({ where: { billingId: id }, select: { id: true } })
    const mbIds = memberBillings.map(mb => mb.id)
    if (mbIds.length > 0) {
      await tx.incomeTransaction.deleteMany({ where: { memberBillingId: { in: mbIds } } })
    }

    // Delete member billings
    await tx.memberBilling.deleteMany({ where: { billingId: id } })

    // Finally delete the billing itself
    return tx.billing.delete({ where: { id } })
  })
}
