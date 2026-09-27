import { prisma } from '../db'
import type { DashboardStats, MonthlyChartData, TransactionItem } from '@/types'
import { getMonthName } from '../utils'

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const funds = await prisma.fund.findMany({ select: { balance: true } })
  const incomeThisMonth = await prisma.incomeTransaction.aggregate({
    _sum: { amount: true },
    where: { date: { gte: startOfMonth, lte: endOfMonth } }
  })
  const expenseThisMonth = await prisma.expenseTransaction.aggregate({
    _sum: { amount: true },
    where: { date: { gte: startOfMonth, lte: endOfMonth } }
  })
  const currentMonthBillings = await prisma.memberBilling.findMany({
    where: {
      billing: {
        type: 'MONTHLY_KAS',
        month: now.getMonth() + 1,
        year: now.getFullYear()
      }
    },
    select: { status: true }
  })
  const activeMembers = await prisma.member.count({ where: { status: 'AKTIF' } })

  const totalBalance = funds.reduce((sum, f) => sum + f.balance.toNumber(), 0)
  const paidCount = currentMonthBillings.filter(mb => mb.status === 'LUNAS').length
  const overdueCount = currentMonthBillings.filter(mb => mb.status === 'MENUNGGAK').length

  return {
    totalBalance,
    incomeThisMonth: incomeThisMonth._sum.amount?.toNumber() ?? 0,
    expenseThisMonth: expenseThisMonth._sum.amount?.toNumber() ?? 0,
    paidCount,
    totalBilledCount: currentMonthBillings.length,
    overdueCount,
    activeMembers
  }
}

export async function getMonthlyChartData(): Promise<MonthlyChartData[]> {
  const now = new Date()
  const data: MonthlyChartData[] = []

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

    const income = await prisma.incomeTransaction.aggregate({
      _sum: { amount: true },
      where: { date: { gte: date, lte: endDate } }
    })
    const expense = await prisma.expenseTransaction.aggregate({
      _sum: { amount: true },
      where: { date: { gte: date, lte: endDate } }
    })

    data.push({
      month: `${getMonthName(date.getMonth() + 1).slice(0, 3)} ${date.getFullYear()}`,
      income: income._sum.amount?.toNumber() ?? 0,
      expense: expense._sum.amount?.toNumber() ?? 0
    })
  }

  return data
}

export async function getRecentTransactions(limit = 10): Promise<TransactionItem[]> {
  const incomes = await prisma.incomeTransaction.findMany({
    take: limit,
    orderBy: { date: 'desc' },
    include: { fund: { select: { name: true } } }
  })
  const expenses = await prisma.expenseTransaction.findMany({
    take: limit,
    orderBy: { date: 'desc' },
    include: { fund: { select: { name: true } } }
  })

  const transactions: TransactionItem[] = [
    ...incomes.map(i => ({
      id: i.id,
      title: i.title,
      amount: i.amount.toNumber(),
      date: i.date,
      type: 'income' as const,
      fundName: i.fund.name
    })),
    ...expenses.map(e => ({
      id: e.id,
      title: e.title,
      amount: e.amount.toNumber(),
      date: e.date,
      type: 'expense' as const,
      fundName: e.fund.name,
      category: e.category
    }))
  ]

  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return transactions.slice(0, limit)
}

export async function getOverdueMembers() {
  const now = new Date()
  return prisma.memberBilling.findMany({
    where: {
      status: 'MENUNGGAK',
      billing: {
        type: 'MONTHLY_KAS',
        month: now.getMonth() + 1,
        year: now.getFullYear()
      }
    },
    include: {
      member: { select: { name: true } },
      billing: { select: { title: true, amount: true, dueDate: true } }
    },
    orderBy: { member: { name: 'asc' } }
  })
}

export async function getPublicBillingSummary() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const funds = await prisma.fund.findMany({ select: { balance: true } })
  const incomeThisMonth = await prisma.incomeTransaction.aggregate({
    _sum: { amount: true },
    where: { date: { gte: startOfMonth, lte: endOfMonth } }
  })
  const expenseThisMonth = await prisma.expenseTransaction.aggregate({
    _sum: { amount: true },
    where: { date: { gte: startOfMonth, lte: endOfMonth } }
  })
  const activeMembers = await prisma.member.count({ where: { status: 'AKTIF' } })
  const currentMonthBillings = await prisma.memberBilling.findMany({
    where: {
      billing: { type: 'MONTHLY_KAS', month: now.getMonth() + 1, year: now.getFullYear() }
    },
    select: { status: true }
  })

  return {
    totalBalance: funds.reduce((sum, f) => sum + f.balance.toNumber(), 0),
    incomeThisMonth: incomeThisMonth._sum.amount?.toNumber() ?? 0,
    expenseThisMonth: expenseThisMonth._sum.amount?.toNumber() ?? 0,
    activeMembers,
    currentMonthPaid: currentMonthBillings.filter(mb => mb.status === 'LUNAS').length,
    currentMonthTotal: currentMonthBillings.length
  }
}
