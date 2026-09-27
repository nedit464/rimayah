import { Prisma } from '@prisma/client'

export interface MemberWithBillings {
  id: string
  name: string
  joinDate: Date
  status: 'AKTIF' | 'NONAKTIF'
  memberBillings: MemberBillingWithBilling[]
}

export interface MemberBillingWithBilling {
  id: string
  memberId: string
  billingId: string
  status: 'BELUM_BAYAR' | 'MENUNGGU_VERIFIKASI' | 'MENUNGGAK' | 'LUNAS'
  paidAt: Date | null
  verifiedAt: Date | null
  notes: string | null
  billing: {
    id: string
    title: string
    type: 'MONTHLY_KAS' | 'CUSTOM'
    amount: Prisma.Decimal
    dueDate: Date
    month: number | null
    year: number | null
  }
}

export interface FundSummary {
  id: string
  name: string
  balance: Prisma.Decimal
  color: string | null
  description: string | null
  totalIncome: number
  totalExpense: number
}

export interface MemberPaymentSummary {
  memberId: string
  memberName: string
  totalBillings: number
  totalPaid: number
  totalArrears: number
  totalAmount: number
  totalPaidAmount: number
}

export interface DashboardStats {
  totalBalance: number
  incomeThisMonth: number
  expenseThisMonth: number
  paidCount: number
  totalBilledCount: number
  overdueCount: number
  activeMembers: number
}

export interface TransactionItem {
  id: string
  title: string
  amount: number
  date: Date
  type: 'income' | 'expense'
  fundName: string
  category?: string
}

export interface PublicBillingSummary {
  totalBalance: number
  incomeThisMonth: number
  expenseThisMonth: number
  activeMembers: number
  currentMonthPaid: number
  currentMonthTotal: number
}

export interface MonthlyChartData {
  month: string
  income: number
  expense: number
}
