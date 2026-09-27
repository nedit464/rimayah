import * as fs from 'fs'
import * as path from 'path'

// Parse .env.local manually
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=')
      if (parts.length >= 2) {
        const key = parts[0].trim()
        let val = parts.slice(1).join('=').trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1)
        }
        process.env[key] = val
      }
    }
  })
}

import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
})

let idCounter = Date.now()
function genId(): string {
  return 'c' + (idCounter++).toString(36) + Math.random().toString(36).slice(2, 7)
}

function getMonthName(month: number): string {
  const date = new Date(2025, month - 1)
  return new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(date)
}

const memberData = [
  // AKTIF - lama (bergabung Des 2025)
  { name: "Lalu Muhammad Faarih As'ad", type: 'lama', memberStatus: 'AKTIF', paidUntil: { month: 12, year: 2025 }, leftAt: null },
  { name: 'Maulky Hisyam Al Mughny',    type: 'lama', memberStatus: 'AKTIF', paidUntil: { month: 2, year: 2026 },  leftAt: null },
  { name: 'M. Khikam Muzadi',           type: 'lama', memberStatus: 'AKTIF', paidUntil: { month: 1, year: 2026 },  leftAt: null },
  { name: 'Abdurrahman azzaid',          type: 'lama', memberStatus: 'AKTIF', paidUntil: null,                      leftAt: null },
  { name: 'Fathirul Malik. K',           type: 'lama', memberStatus: 'AKTIF', paidUntil: { month: 5, year: 2026 },  leftAt: null },
  { name: 'yusuf abdilah',              type: 'lama', memberStatus: 'AKTIF', paidUntil: { month: 1, year: 2026 },  leftAt: null },
  { name: 'Deska Alhafis',              type: 'lama', memberStatus: 'AKTIF', paidUntil: { month: 5, year: 2026 },  leftAt: null },
  { name: 'Fadillah Irsyad Al Faridz',  type: 'lama', memberStatus: 'AKTIF', paidUntil: { month: 10, year: 2026 }, leftAt: null },
  // AKTIF - baru (bergabung Mei 2026)
  { name: 'Moch. Ilham Adeli',          type: 'baru', memberStatus: 'AKTIF', paidUntil: { month: 5, year: 2026 },  leftAt: null },
  { name: 'Salman Ali Kurnia Putra',    type: 'baru', memberStatus: 'AKTIF', paidUntil: null,                      leftAt: null },
  { name: 'Ubaidillah',                 type: 'baru', memberStatus: 'AKTIF', paidUntil: null,                      leftAt: null },
  { name: 'Alfian Hilal Nugrahadi',     type: 'baru', memberStatus: 'AKTIF', paidUntil: { month: 5, year: 2026 },  leftAt: null },
  { name: 'Rashif Aunur Rasyid',        type: 'baru', memberStatus: 'AKTIF', paidUntil: null,                      leftAt: null },
  // NONAKTIF - berhenti (semua lama)
  { name: 'Heru Saputra',               type: 'lama', memberStatus: 'NONAKTIF', paidUntil: { month: 12, year: 2025 }, leftAt: { month: 12, year: 2025 } },
  { name: 'Zaidil',                     type: 'lama', memberStatus: 'NONAKTIF', paidUntil: { month: 12, year: 2025 }, leftAt: { month: 12, year: 2025 } },
  { name: 'Haedar',                     type: 'lama', memberStatus: 'NONAKTIF', paidUntil: { month: 2, year: 2026 },  leftAt: { month: 2, year: 2026 } },
]

const billingMonths = [
  { month: 12, year: 2025 },
  { month: 1,  year: 2026 },
  { month: 2,  year: 2026 },
  { month: 3,  year: 2026 },
  { month: 4,  year: 2026 },
  { month: 5,  year: 2026 },
  { month: 6,  year: 2026 },
  { month: 7,  year: 2026 },
  { month: 8,  year: 2026 },
  { month: 9,  year: 2026 },
  { month: 10, year: 2026 },
]

const CURRENT_MONTH = new Date(2026, 4, 1) // May 2026 (index 4)

async function main() {
  console.log('🌱 Seeding Supabase database with 16 members...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Found' : '❌ Missing')

  // ─── 1. Clear existing data (dependency order) ───
  await pool.query('DELETE FROM "IncomeTransaction"')
  await pool.query('DELETE FROM "ExpenseTransaction"')
  await pool.query('DELETE FROM "MemberBilling"')
  await pool.query('DELETE FROM "Billing"')
  await pool.query('DELETE FROM "Member"')
  await pool.query('DELETE FROM "Fund"')
  await pool.query('DELETE FROM "AdminSession"')
  await pool.query('DELETE FROM "Admin"')
  await pool.query('DELETE FROM "Announcement"')
  await pool.query('DELETE FROM "Settings"')
  console.log('✅ Cleared existing data')

  // ─── 2. Admin ───
  const passwordHash = await bcrypt.hash('admin123', 12)
  const adminId = genId()
  await pool.query(
    `INSERT INTO "Admin" (id, username, "passwordHash", "createdAt") VALUES ($1, $2, $3, NOW())`,
    [adminId, 'bendahara', passwordHash]
  )
  console.log('✅ Admin created: bendahara / admin123')

  // ─── 3. Funds ───
  const kasUtamaId = genId()
  const danaPeralatanId = genId()
  const danaEventId = genId()

  await pool.query(
    `INSERT INTO "Fund" (id, name, description, balance, color, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
    [kasUtamaId, 'Kas Utama', 'Dana kas utama organisasi dari iuran bulanan anggota', 0, '#059669']
  )
  await pool.query(
    `INSERT INTO "Fund" (id, name, description, balance, color, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
    [danaPeralatanId, 'Dana Peralatan', 'Dana untuk pembelian dan perawatan peralatan', 50000, '#d97706']
  )
  await pool.query(
    `INSERT INTO "Fund" (id, name, description, balance, color, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
    [danaEventId, 'Dana Event', 'Dana untuk penyelenggaraan acara dan kegiatan', 70000, '#3b82f6']
  )
  console.log('✅ Funds created')

  // ─── 4. Members ───
  const memberIds: string[] = []
  for (const m of memberData) {
    const id = genId()
    memberIds.push(id)
    const joinDate = m.type === 'lama' ? new Date(2025, 11, 1) : new Date(2026, 4, 1)
    await pool.query(
      `INSERT INTO "Member" (id, name, "joinDate", status, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW())`,
      [id, m.name, joinDate, m.memberStatus]
    )
  }
  console.log(`✅ Members created: ${memberIds.length}`)

  // ─── 5. Billings & Member Billings ───
  let totalLunasPayments = 0

  for (const b of billingMonths) {
    const dueDate = new Date(b.year, b.month - 1, 10)
    const billingDate = new Date(b.year, b.month - 1, 1)
    const monthName = getMonthName(b.month)

    const billingId = genId()
    await pool.query(
      `INSERT INTO "Billing" (id, title, type, amount, "dueDate", month, year, "fundId", "isActive", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())`,
      [billingId, `Iuran Kas ${monthName} ${b.year}`, 'MONTHLY_KAS', 8000, dueDate, b.month, b.year, kasUtamaId, true]
    )

    for (let i = 0; i < memberData.length; i++) {
      const mInfo = memberData[i]
      const memberId = memberIds[i]
      const joinDate = mInfo.type === 'lama' ? new Date(2025, 11, 1) : new Date(2026, 4, 1)

      // Only assign if billing month >= join date
      if (billingDate.getTime() < joinDate.getTime()) continue

      // For NONAKTIF members, only bill up to leftAt month
      if (mInfo.leftAt) {
        const leftAtDate = new Date(mInfo.leftAt.year, mInfo.leftAt.month - 1, 1)
        if (billingDate.getTime() > leftAtDate.getTime()) continue
      }

      let status: 'LUNAS' | 'MENUNGGAK' | 'BELUM_BAYAR' = 'BELUM_BAYAR'

      if (mInfo.paidUntil) {
        const paidUntilDate = new Date(mInfo.paidUntil.year, mInfo.paidUntil.month - 1, 1)
        if (billingDate.getTime() <= paidUntilDate.getTime()) {
          status = 'LUNAS'
        } else {
          status = billingDate.getTime() <= CURRENT_MONTH.getTime() ? 'MENUNGGAK' : 'BELUM_BAYAR'
        }
      } else {
        // No payment at all
        status = billingDate.getTime() <= CURRENT_MONTH.getTime() ? 'MENUNGGAK' : 'BELUM_BAYAR'
      }

      const mbId = genId()
      await pool.query(
        `INSERT INTO "MemberBilling" (id, "memberId", "billingId", status, "paidAt", "verifiedAt", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`,
        [mbId, memberId, billingId, status, status === 'LUNAS' ? dueDate : null, status === 'LUNAS' ? dueDate : null]
      )

      if (status === 'LUNAS') {
        totalLunasPayments++
        const txId = genId()
        await pool.query(
          `INSERT INTO "IncomeTransaction" (id, "fundId", "memberBillingId", title, amount, date, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
          [txId, kasUtamaId, mbId, `Pembayaran Iuran Kas ${monthName} ${b.year} - ${mInfo.name}`, 8000, dueDate]
        )
      }
    }
  }
  console.log(`✅ Billings & member billings created. Total LUNAS: ${totalLunasPayments}`)

  // ─── 6. Extra Cash (sebelum Des 2025) ───
  const extraCashId = genId()
  await pool.query(
    `INSERT INTO "IncomeTransaction" (id, "fundId", title, amount, date, description, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
    [extraCashId, kasUtamaId, 'Uang Kas Tambahan (Sebelum Des 2025)', 14000, new Date(2025, 10, 30), 'Kas tambahan yang dikumpulkan sebelum masa pendataan dimulai.']
  )
  console.log('✅ Extra cash (Rp14.000) created')

  // ─── 7. Expense Transactions ───
  await pool.query(
    `INSERT INTO "ExpenseTransaction" (id, "fundId", title, amount, category, date, description, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
    [genId(), kasUtamaId, 'Pembelian ATK', 25000, 'OPERASIONAL', new Date(2026, 0, 15), 'Pembelian buku tulis dan pulpen untuk administrasi']
  )
  await pool.query(
    `INSERT INTO "ExpenseTransaction" (id, "fundId", title, amount, category, date, description, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
    [genId(), danaPeralatanId, 'Perawatan Peralatan Berkuda', 50000, 'PERALATAN', new Date(2026, 1, 20), 'Service pelana dan tali kekang']
  )
  await pool.query(
    `INSERT INTO "ExpenseTransaction" (id, "fundId", title, amount, category, date, description, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
    [genId(), danaEventId, 'Konsumsi Rapat Bulanan', 30000, 'KONSUMSI', new Date(2026, 2, 10), 'Snack dan minuman untuk rapat bulanan Maret']
  )
  console.log('✅ Expense transactions created')

  // ─── 8. Update Kas Utama balance ───
  const kasUtamaBalance = totalLunasPayments * 8000 + 14000 - 25000
  await pool.query(`UPDATE "Fund" SET balance = $1, "updatedAt" = NOW() WHERE id = $2`, [kasUtamaBalance, kasUtamaId])
  console.log(`✅ Kas Utama balance: Rp${kasUtamaBalance.toLocaleString('id-ID')}`)

  // ─── 9. Announcements ───
  await pool.query(
    `INSERT INTO "Announcement" (id, title, content, type, "isPinned", "isVisible", "publishedAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
    [genId(), 'Pembayaran Kas Mei 2026',
     "Assalamu'alaikum, mengingatkan kepada seluruh anggota untuk segera melakukan pembayaran kas bulan Mei 2026 sebesar Rp 8.000. Batas waktu pembayaran: 10 Mei 2026. Jazakumullahu khairan.",
     'PAYMENT_REMINDER', true, true, new Date(2026, 4, 1)]
  )
  await pool.query(
    `INSERT INTO "Announcement" (id, title, content, type, "isPinned", "isVisible", "publishedAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
    [genId(), 'Laporan Keuangan Triwulan I 2026',
     'Alhamdulillah, laporan keuangan triwulan I (Januari-Maret 2026) telah selesai disusun. Rincian dapat dilihat di halaman Transparansi.',
     'FINANCE_NOTICE', false, true, new Date(2026, 3, 5)]
  )
  console.log('✅ Announcements created')

  // ─── 10. Settings ───
  for (const s of [
    { key: 'org_name', value: "Sa'ad Al-Furusiyah" },
    { key: 'whatsapp_number', value: '6281234567890' },
    { key: 'monthly_kas_amount', value: '8000' },
    { key: 'default_due_day', value: '10' },
  ]) {
    await pool.query(
      `INSERT INTO "Settings" (id, key, value) VALUES ($1,$2,$3) ON CONFLICT (key) DO UPDATE SET value = $3`,
      [genId(), s.key, s.value]
    )
  }
  console.log('✅ Settings created')

  // ─── Final summary ───
  const memberCount = await pool.query('SELECT COUNT(*) FROM "Member"')
  const aktifCount = await pool.query('SELECT COUNT(*) FROM "Member" WHERE status = \'AKTIF\'')
  const nonaktifCount = await pool.query('SELECT COUNT(*) FROM "Member" WHERE status = \'NONAKTIF\'')
  const billingCount = await pool.query('SELECT COUNT(*) FROM "MemberBilling" WHERE status = \'LUNAS\'')

  console.log(`
🎉 Seeding selesai!
   Total anggota   : ${memberCount.rows[0].count}
   Anggota aktif   : ${aktifCount.rows[0].count}
   Anggota berhenti: ${nonaktifCount.rows[0].count}
   Total LUNAS     : ${billingCount.rows[0].count} pembayaran
   Login           : bendahara / admin123
  `)

  await pool.end()
}

main().catch(async (e) => {
  console.error('❌ Seeding gagal:', e.message)
  await pool.end()
  process.exit(1)
})
