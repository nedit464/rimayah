import { prisma } from '@/lib/db'

export async function createPaymentRequest(
  memberBillingId: string,
  paymentMethod: 'BANK_TRANSFER' | 'QRIS',
  bankCode: string
) {
  // 1. Cari tagihan
  const mb = await prisma.memberBilling.findUnique({
    where: { id: memberBillingId },
    include: { billing: true, member: true }
  })

  if (!mb) throw new Error('Data tagihan tidak ditemukan')
  if (mb.status === 'LUNAS') throw new Error('Tagihan ini sudah lunas')

  const now = new Date()
  const activeWindow = new Date(now.getTime() + 5 * 60 * 1000) // Batas toleransi 5 menit ke depan

  // 2. Cek apakah sudah ada request pembayaran PENDING yang masih aktif dengan metode yang sama
  // Jika ada, gunakan kembali agar kode unik tetap sama dan tidak menumpuk
  const existingPending = await prisma.paymentRequest.findFirst({
    where: {
      memberBillingId,
      paymentMethod,
      bankCode,
      status: 'PENDING',
      expiredAt: { gt: activeWindow }
    }
  })

  if (existingPending) {
    return existingPending
  }

  // 3. Tandai request pending lainnya untuk tagihan ini sebagai EXPIRED
  await prisma.paymentRequest.updateMany({
    where: {
      memberBillingId,
      status: 'PENDING'
    },
    data: {
      status: 'EXPIRED'
    }
  })

  // 4. No unique code needed for manual payments. Set to 0.
  const baseAmount = mb.billing.amount.toNumber()
  const uniqueCode = 0
  const amountTotal = baseAmount
  const expiredAt = new Date(now.getTime() + 2 * 60 * 60 * 1000) // Expired dalam 2 jam

  // 5. Simpan PaymentRequest baru
  const paymentRequest = await prisma.paymentRequest.create({
    data: {
      memberBillingId,
      amountOriginal: mb.billing.amount,
      amountUnique: uniqueCode,
      amountTotal,
      paymentMethod,
      bankCode,
      expiredAt,
      status: 'PENDING'
    }
  })

  return paymentRequest
}

