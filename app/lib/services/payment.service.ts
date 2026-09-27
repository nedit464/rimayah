import { prisma } from '../db'

export async function confirmPaymentByMember(memberBillingId: string) {
  const mb = await prisma.memberBilling.findUnique({
    where: { id: memberBillingId }
  })

  if (!mb) throw new Error('Data tagihan tidak ditemukan')
  if (mb.status === 'LUNAS') throw new Error('Tagihan sudah dibayar')

  return prisma.memberBilling.update({
    where: { id: memberBillingId },
    data: {
      status: 'MENUNGGU_VERIFIKASI',
      paidAt: new Date()
    }
  })
}

export async function verifyPayment(memberBillingId: string) {
  return prisma.$transaction(async (tx) => {
    const mb = await tx.memberBilling.findUnique({
      where: { id: memberBillingId },
      include: {
        billing: true,
        member: true
      }
    })

    if (!mb) throw new Error('Data tagihan tidak ditemukan')
    if (mb.status === 'LUNAS') throw new Error('Tagihan sudah diverifikasi')

    // Update member billing status
    await tx.memberBilling.update({
      where: { id: memberBillingId },
      data: {
        status: 'LUNAS',
        verifiedAt: new Date()
      }
    })

    // Create income transaction
    await tx.incomeTransaction.create({
      data: {
        fundId: mb.billing.fundId,
        memberBillingId: mb.id,
        title: `Pembayaran ${mb.billing.title} - ${mb.member.name}`,
        amount: mb.billing.amount,
        date: new Date()
      }
    })

    // Update fund balance
    await tx.fund.update({
      where: { id: mb.billing.fundId },
      data: {
        balance: { increment: mb.billing.amount }
      }
    })
  })
}

export async function rejectPayment(memberBillingId: string) {
  const mb = await prisma.memberBilling.findUnique({
    where: { id: memberBillingId },
    include: { billing: true }
  })

  if (!mb) throw new Error('Data tagihan tidak ditemukan')

  const newStatus = mb.billing.dueDate < new Date() ? 'MENUNGGAK' : 'BELUM_BAYAR'

  return prisma.memberBilling.update({
    where: { id: memberBillingId },
    data: {
      status: newStatus as 'BELUM_BAYAR' | 'MENUNGGAK',
      paidAt: null
    }
  })
}

export async function getPendingVerifications() {
  return prisma.memberBilling.findMany({
    where: { status: 'MENUNGGU_VERIFIKASI' },
    include: {
      member: { select: { name: true } },
      billing: { select: { title: true, amount: true } }
    },
    orderBy: { paidAt: 'asc' }
  })
}

export async function getAllPayments(filters?: {
  status?: string
  month?: number
  year?: number
  search?: string
}) {
  return prisma.memberBilling.findMany({
    where: {
      ...(filters?.status ? { status: filters.status as 'BELUM_BAYAR' | 'MENUNGGU_VERIFIKASI' | 'MENUNGGAK' | 'LUNAS' } : {}),
      ...(filters?.search ? { member: { name: { contains: filters.search, mode: 'insensitive' as const } } } : {}),
      ...(filters?.month && filters?.year ? { billing: { month: filters.month, year: filters.year } } : {})
    },
    include: {
      member: { select: { name: true } },
      billing: { select: { title: true, amount: true, dueDate: true, month: true, year: true } }
    },
    orderBy: { updatedAt: 'desc' }
  })
}
