import { prisma } from '../db'
import type { MemberWithBillings, MemberPaymentSummary } from '@/types'
import type { CreateMemberInput, UpdateMemberInput } from '../validations/member.schema'

export async function createMember(data: CreateMemberInput) {
  const member = await prisma.member.create({
    data: {
      name: data.name,
      joinDate: data.joinDate,
      status: data.status,
      role: data.role ?? 'ANGGOTA'
    }
  })

  // Auto-generate current active billings for new member
  const billings = await prisma.billing.findMany({
    where: { isActive: true }
  })

  if (billings.length > 0) {
    const now = new Date()
    await prisma.memberBilling.createMany({
      data: billings.map(b => ({
        memberId: member.id,
        billingId: b.id,
        status: b.dueDate < now ? 'MENUNGGAK' : 'BELUM_BAYAR'
      }))
    })
  }

  return member
}

export async function updateMember(id: string, data: UpdateMemberInput) {
  return prisma.member.update({ where: { id }, data })
}

export async function deleteMember(id: string) {
  return prisma.member.delete({ where: { id } })
}

export async function getAllMembers() {
  return prisma.member.findMany({
    orderBy: { name: 'asc' },
    include: {
      memberBillings: {
        include: { billing: true },
        orderBy: { billing: { dueDate: 'desc' } }
      }
    }
  })
}

export async function getMemberById(id: string) {
  return prisma.member.findUnique({
    where: { id },
    include: {
      memberBillings: {
        include: { billing: true },
        orderBy: { billing: { dueDate: 'desc' } }
      }
    }
  })
}

export async function searchMembersByName(query: string): Promise<MemberWithBillings[]> {
  const members = await prisma.member.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' }
    },
    include: {
      memberBillings: {
        include: {
          billing: {
            select: {
              id: true,
              title: true,
              type: true,
              amount: true,
              dueDate: true,
              validUntil: true,
              month: true,
              year: true
            }
          }
        },
        orderBy: { billing: { dueDate: 'desc' } }
      }
    },
    take: 10
  })

  const now = new Date()
  const filtered = members.map(m => ({
    ...m,
    memberBillings: m.memberBillings.filter(mb => {
      const isExpired = (mb.billing as any)?.validUntil && now > new Date((mb.billing as any).validUntil)
      // If billing has expired and is unpaid, member is no longer burdened and it does not show on screen
      if (isExpired && mb.status !== 'LUNAS') {
        return false
      }
      return true
    })
  }))

  return filtered as unknown as MemberWithBillings[]
}

export async function getMemberPaymentSummary(memberId: string): Promise<MemberPaymentSummary | null> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      memberBillings: {
        include: { billing: true }
      }
    }
  })

  if (!member) return null

  const now = new Date()
  const activeBillings = member.memberBillings.filter(mb => {
    const isExpired = mb.billing?.validUntil && now > new Date(mb.billing.validUntil)
    if (isExpired && mb.status !== 'LUNAS') {
      return false
    }
    return true
  })

  const totalBillings = activeBillings.length
  const totalPaid = activeBillings.filter(mb => mb.status === 'LUNAS').length
  const arrearsBillings = activeBillings.filter(mb => mb.status === 'MENUNGGAK' || mb.status === 'BELUM_BAYAR')
  const totalArrears = arrearsBillings.length
  const totalAmount = activeBillings.reduce((sum, mb) => sum + mb.billing.amount.toNumber(), 0)
  const totalPaidAmount = activeBillings
    .filter(mb => mb.status === 'LUNAS')
    .reduce((sum, mb) => sum + mb.billing.amount.toNumber(), 0)

  return {
    memberId: member.id,
    memberName: member.name,
    totalBillings,
    totalPaid,
    totalArrears,
    totalAmount,
    totalPaidAmount
  }
}

export async function getActiveMembers() {
  return prisma.member.findMany({
    where: { status: 'AKTIF' },
    orderBy: { name: 'asc' }
  })
}

export async function getActiveMemberCount() {
  return prisma.member.count({ where: { status: 'AKTIF' } })
}
