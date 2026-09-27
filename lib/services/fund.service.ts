import { prisma } from '../db'
import type { CreateFundInput } from '../validations/fund.schema'

export async function createFund(data: CreateFundInput) {
  return prisma.fund.create({ data })
}

export async function updateFund(id: string, data: Partial<CreateFundInput>) {
  return prisma.fund.update({ where: { id }, data })
}

export async function deleteFund(id: string) {
  return prisma.fund.delete({ where: { id } })
}

export async function getAllFunds() {
  return prisma.fund.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      incomeTransactions: {
        select: { amount: true }
      },
      expenseTransactions: {
        select: { amount: true }
      }
    }
  })
}

export async function getFundById(id: string) {
  return prisma.fund.findUnique({
    where: { id },
    include: {
      incomeTransactions: {
        orderBy: { date: 'desc' },
        take: 50
      },
      expenseTransactions: {
        orderBy: { date: 'desc' },
        take: 50
      }
    }
  })
}

export async function getTotalBalance() {
  const funds = await prisma.fund.findMany({ select: { balance: true } })
  return funds.reduce((sum, f) => sum + f.balance.toNumber(), 0)
}

export async function recordExpense(
  fundId: string,
  title: string,
  amount: number,
  category: 'PERALATAN' | 'KONSUMSI' | 'EVENT' | 'OPERASIONAL' | 'TRANSPORTASI' | 'LAINNYA',
  date: Date,
  description?: string
) {
  return prisma.$transaction(async (tx) => {
    const expense = await tx.expenseTransaction.create({
      data: { fundId, title, amount, category, date, description }
    })

    await tx.fund.update({
      where: { id: fundId },
      data: { balance: { decrement: amount } }
    })

    return expense
  })
}

export async function deleteExpense(id: string) {
  return prisma.$transaction(async (tx) => {
    const expense = await tx.expenseTransaction.findUnique({ where: { id } })
    if (!expense) throw new Error('Pengeluaran tidak ditemukan')

    await tx.expenseTransaction.delete({ where: { id } })

    // Restore the amount back to the fund
    await tx.fund.update({
      where: { id: expense.fundId },
      data: { balance: { increment: expense.amount } }
    })

    return expense
  })
}

export async function updateExpense(
  id: string,
  data: {
    title?: string
    amount?: number
    category?: 'PERALATAN' | 'KONSUMSI' | 'EVENT' | 'OPERASIONAL' | 'TRANSPORTASI' | 'LAINNYA'
    date?: Date
    description?: string
    fundId?: string
  }
) {
  return prisma.$transaction(async (tx) => {
    const old = await tx.expenseTransaction.findUnique({ where: { id } })
    if (!old) throw new Error('Pengeluaran tidak ditemukan')

    // Restore old amount to old fund
    await tx.fund.update({
      where: { id: old.fundId },
      data: { balance: { increment: old.amount } }
    })

    const updated = await tx.expenseTransaction.update({ where: { id }, data })

    // Deduct new amount from new (or same) fund
    await tx.fund.update({
      where: { id: updated.fundId },
      data: { balance: { decrement: updated.amount } }
    })

    return updated
  })
}

export async function getExpenses(filters?: {
  fundId?: string
  category?: string
  month?: number
  year?: number
}) {
  const where: Record<string, unknown> = {}
  if (filters?.fundId) where.fundId = filters.fundId
  if (filters?.category) where.category = filters.category
  if (filters?.month !== undefined && filters?.year !== undefined) {
    const start = new Date(filters.year, filters.month - 1, 1)
    const end = new Date(filters.year, filters.month, 0, 23, 59, 59)
    where.date = { gte: start, lte: end }
  }

  return prisma.expenseTransaction.findMany({
    where,
    include: { fund: { select: { name: true, color: true } } },
    orderBy: { date: 'desc' }
  })
}
