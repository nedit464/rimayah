import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { prisma } from '../lib/db'
import bcrypt from 'bcryptjs'

const memberData = [
  // AKTIF - lama (bergabung Des 2025)
  { name: "Lalu Muhammad Faarih As'ad", type: 'lama', memberStatus: 'AKTIF' as const, paidUntil: { month: 12, year: 2025 }, leftAt: null },
  { name: 'Maulky Hisyam Al Mughny',    type: 'lama', memberStatus: 'AKTIF' as const, paidUntil: { month: 2, year: 2026 },  leftAt: null },
  { name: 'M. Khikam Muzadi',           type: 'lama', memberStatus: 'AKTIF' as const, paidUntil: { month: 1, year: 2026 },  leftAt: null },
  { name: 'Abdurrahman azzaid',          type: 'lama', memberStatus: 'AKTIF' as const, paidUntil: null,                      leftAt: null },
  { name: 'Fathirul Malik. K',           type: 'lama', memberStatus: 'AKTIF' as const, paidUntil: { month: 5, year: 2026 },  leftAt: null },
  { name: 'yusuf abdilah',              type: 'lama', memberStatus: 'AKTIF' as const, paidUntil: { month: 1, year: 2026 },  leftAt: null },
  { name: 'Deska Alhafis',              type: 'lama', memberStatus: 'AKTIF' as const, paidUntil: { month: 5, year: 2026 },  leftAt: null },
  { name: 'Fadillah Irsyad Al Faridz',  type: 'lama', memberStatus: 'AKTIF' as const, paidUntil: { month: 10, year: 2026 }, leftAt: null },
  // AKTIF - baru (bergabung Mei 2026)
  { name: 'Moch. Ilham Adeli',          type: 'baru', memberStatus: 'AKTIF' as const, paidUntil: { month: 5, year: 2026 },  leftAt: null },
  { name: 'Salman Ali Kurnia Putra',    type: 'baru', memberStatus: 'AKTIF' as const, paidUntil: null,                      leftAt: null },
  { name: 'Ubaidillah',                 type: 'baru', memberStatus: 'AKTIF' as const, paidUntil: null,                      leftAt: null },
  { name: 'Alfian Hilal Nugrahadi',     type: 'baru', memberStatus: 'AKTIF' as const, paidUntil: { month: 5, year: 2026 },  leftAt: null },
  { name: 'Rashif Aunur Rasyid',        type: 'baru', memberStatus: 'AKTIF' as const, paidUntil: null,                      leftAt: null },
  // NONAKTIF - berhenti (semua lama, hanya dibill sampai leftAt)
  { name: 'Heru Saputra', type: 'lama', memberStatus: 'NONAKTIF' as const, paidUntil: { month: 12, year: 2025 }, leftAt: { month: 12, year: 2025 } },
  { name: 'Zaidil',       type: 'lama', memberStatus: 'NONAKTIF' as const, paidUntil: { month: 12, year: 2025 }, leftAt: { month: 12, year: 2025 } },
  { name: 'Haedar',       type: 'lama', memberStatus: 'NONAKTIF' as const, paidUntil: { month: 2, year: 2026 },  leftAt: { month: 2, year: 2026 } },
]

function getMonthName(month: number): string {
  const date = new Date(2025, month - 1)
  return new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date)
}

async function main() {
  console.log('🌱 Seeding database with real UKM data (fixing timezone comparisons)...')

  // Clean existing data
  await prisma.incomeTransaction.deleteMany()
  await prisma.expenseTransaction.deleteMany()
  await prisma.memberBilling.deleteMany()
  await prisma.billing.deleteMany()
  await prisma.member.deleteMany()
  await prisma.fund.deleteMany()
  await prisma.adminSession.deleteMany()
  await prisma.admin.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.settings.deleteMany()

  // ─── Admin ───
  const passwordHash = await bcrypt.hash('admin123', 12)
  const admin = await prisma.admin.create({
    data: {
      username: 'bendahara',
      passwordHash,
    },
  })
  console.log(`✅ Admin created: ${admin.username}`)

  // ─── Funds ───
  const kasUtama = await prisma.fund.create({
    data: {
      name: 'Kas Utama',
      description: 'Dana kas utama organisasi dari iuran bulanan anggota',
      color: '#059669',
      balance: 0, // Will update later based on payments and expenses
    },
  })

  const danaPeralatan = await prisma.fund.create({
    data: {
      name: 'Dana Peralatan',
      description: 'Dana untuk pembelian dan perawatan peralatan',
      color: '#d97706',
      balance: 50000, // 100k starting minus 50k expense
    },
  })

  const danaEvent = await prisma.fund.create({
    data: {
      name: 'Dana Event',
      description: 'Dana untuk penyelenggaraan acara dan kegiatan',
      color: '#3b82f6',
      balance: 70000, // 100k starting minus 30k expense
    },
  })
  console.log('✅ Funds created')

  // ─── Members ───
  const members = await Promise.all(
    memberData.map((m) => {
      const joinDate = m.type === 'lama' ? new Date(2025, 11, 1) : new Date(2026, 4, 1)
      return prisma.member.create({
        data: {
          name: m.name,
          joinDate,
          status: 'AKTIF',
        },
      })
    })
  )
  console.log(`✅ Members created: ${members.length}`)

  // ─── Monthly Billings (Dec 2025 - Oct 2026) ───
  const billingsList = [
    { month: 12, year: 2025 },
    { month: 1, year: 2026 },
    { month: 2, year: 2026 },
    { month: 3, year: 2026 },
    { month: 4, year: 2026 },
    { month: 5, year: 2026 },
    { month: 6, year: 2026 },
    { month: 7, year: 2026 },
    { month: 8, year: 2026 },
    { month: 9, year: 2026 },
    { month: 10, year: 2026 },
  ]

  let totalLunasPayments = 0

  for (const b of billingsList) {
    const dueDate = new Date(b.year, b.month - 1, 10)
    const monthName = getMonthName(b.month)
    const billing = await prisma.billing.create({
      data: {
        title: `Iuran Kas ${monthName} ${b.year}`,
        type: 'MONTHLY_KAS',
        amount: 8000,
        dueDate,
        month: b.month,
        year: b.year,
        fundId: kasUtama.id,
      },
    })

    // Assign billing to eligible members
    for (let i = 0; i < memberData.length; i++) {
      const mInfo = memberData[i]
      const member = members[i]
      const joinDate = mInfo.type === 'lama' ? new Date(2025, 11, 1) : new Date(2026, 4, 1)
      const billingDate = new Date(b.year, b.month - 1, 1)

      // Only assign if billing month is >= join date
      if (billingDate.getTime() >= joinDate.getTime()) {
        let status: 'LUNAS' | 'MENUNGGAK' | 'BELUM_BAYAR' = 'BELUM_BAYAR'
        const currentMonthLimit = new Date(2026, 4, 1) // May 2026

        if (mInfo.paidUntil) {
          const paidUntilDate = new Date(mInfo.paidUntil.year, mInfo.paidUntil.month - 1, 1)
          if (billingDate.getTime() <= paidUntilDate.getTime()) {
            status = 'LUNAS'
          } else {
            status = billingDate.getTime() <= currentMonthLimit.getTime() ? 'MENUNGGAK' : 'BELUM_BAYAR'
          }
        } else {
          status = billingDate.getTime() <= currentMonthLimit.getTime() ? 'MENUNGGAK' : 'BELUM_BAYAR'
        }

        const mb = await prisma.memberBilling.create({
          data: {
            memberId: member.id,
            billingId: billing.id,
            status,
            paidAt: status === 'LUNAS' ? dueDate : null,
            verifiedAt: status === 'LUNAS' ? dueDate : null,
          },
        })

        if (status === 'LUNAS') {
          totalLunasPayments++
          await prisma.incomeTransaction.create({
            data: {
              fundId: kasUtama.id,
              memberBillingId: mb.id,
              title: `Pembayaran Iuran Kas ${monthName} ${b.year} - ${member.name}`,
              amount: 8000,
              date: dueDate,
            },
          })
        }
      }
    }
  }
  console.log(`✅ Monthly billings & member assignments created. Total Lunas: ${totalLunasPayments}`)

  // ─── Extra Cash (Sebelum Desember 2025) ───
  const extraCashAmount = 14000
  await prisma.incomeTransaction.create({
    data: {
      fundId: kasUtama.id,
      title: 'Uang Kas Tambahan (Sebelum Des 2025)',
      amount: extraCashAmount,
      date: new Date(2025, 10, 30),
      description: 'Kas tambahan yang dikumpulkan sebelum masa pendataan dimulai.',
    },
  })
  console.log('✅ Extra cash transaction created')

  // ─── Expense Transactions ───
  await prisma.expenseTransaction.create({
    data: {
      fundId: kasUtama.id,
      title: 'Pembelian ATK',
      amount: 25000,
      category: 'OPERASIONAL',
      date: new Date(2026, 0, 15),
      description: 'Pembelian buku tulis dan pulpen untuk administrasi',
    },
  })

  await prisma.expenseTransaction.create({
    data: {
      fundId: danaPeralatan.id,
      title: 'Perawatan Peralatan Berkuda',
      amount: 50000,
      category: 'PERALATAN',
      date: new Date(2026, 1, 20),
      description: 'Service pelana dan tali kekang',
    },
  })

  await prisma.expenseTransaction.create({
    data: {
      fundId: danaEvent.id,
      title: 'Konsumsi Rapat Bulanan',
      amount: 30000,
      category: 'KONSUMSI',
      date: new Date(2026, 2, 10),
      description: 'Snack dan minuman untuk rapat bulanan Maret',
    },
  })
  console.log('✅ Expense transactions created')

  // ─── Update Fund Balances ───
  const kasUtamaBalance = totalLunasPayments * 8000 + extraCashAmount - 25000
  await prisma.fund.update({
    where: { id: kasUtama.id },
    data: { balance: kasUtamaBalance },
  })
  console.log(`✅ Kas Utama balance set to: ${kasUtamaBalance}`)

  // ─── Announcements ───
  await prisma.announcement.create({
    data: {
      title: 'Pembayaran Kas Mei 2026',
      content:
        'Assalamu\'alaikum, mengingatkan kepada seluruh anggota untuk segera melakukan pembayaran kas bulan Mei 2026 sebesar Rp 8.000. Pembayaran dapat dilakukan melalui QRIS yang tersedia di portal keuangan. Batas waktu pembayaran: 10 Mei 2026. Jazakumullahu khairan.',
      type: 'PAYMENT_REMINDER',
      isPinned: true,
      isVisible: true,
      publishedAt: new Date(2026, 4, 1),
    },
  })

  await prisma.announcement.create({
    data: {
      title: 'Laporan Keuangan Triwulan I 2026',
      content:
        'Alhamdulillah, laporan keuangan triwulan I (Januari-Maret 2026) telah selesai disusun. Total pemasukan kas iuran lunas dan iuran tambahan tercatat secara transparan di sistem. Rincian dapat dilihat di halaman Transparansi.',
      type: 'FINANCE_NOTICE',
      isPinned: false,
      isVisible: true,
      publishedAt: new Date(2026, 3, 5),
    },
  })
  console.log('✅ Announcements created')

  // ─── Settings ───
  await prisma.settings.createMany({
    data: [
      { key: 'org_name', value: "Sa'ad Al-Furusiyah" },
      { key: 'whatsapp_number', value: '6281234567890' },
      { key: 'monthly_kas_amount', value: '8000' },
      { key: 'default_due_day', value: '10' },
    ],
  })
  console.log('✅ Settings created')

  console.log('\n🎉 Seed completed successfully with real UKM data!')
  console.log('   Admin login: bendahara / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
