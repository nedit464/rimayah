import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { prisma } from '../lib/db'
import { createPaymentRequest, handleIncomingMutation } from '../lib/services/payment-gate.service'

async function run() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : 'UNDEFINED')
  console.log('--- SIMULASI PEMBAYARAN & MUTASI OTOMATIS ---')

  // 1. Temukan tagihan anggota yang belum lunas
  const unpaidBilling = await prisma.memberBilling.findFirst({
    where: {
      status: {
        in: ['BELUM_BAYAR', 'MENUNGGAK']
      }
    },
    include: {
      billing: true,
      member: true
    }
  })

  if (!unpaidBilling) {
    console.log('Tidak ditemukan tagihan anggota yang berstatus BELUM_BAYAR atau MENUNGGAK.')
    console.log('Silakan buat tagihan baru atau jalankan seeder terlebih dahulu.')
    return
  }

  console.log(`\nDitemukan tagihan belum lunas:`)
  console.log(`- Nama Anggota: ${unpaidBilling.member.name}`)
  console.log(`- Tagihan: ${unpaidBilling.billing.title}`)
  console.log(`- Nominal Dasar: Rp ${unpaidBilling.billing.amount}`)

  // 2. Buat Payment Request baru
  console.log(`\nMembuat request pembayaran...`)
  const request = await createPaymentRequest(unpaidBilling.id, 'BANK_TRANSFER', 'BSI')

  console.log(`Request Pembayaran Berhasil Dibuat:`)
  console.log(`- ID Request: ${request.id}`)
  console.log(`- Kode Unik: ${request.amountUnique}`)
  console.log(`- Total Harus Ditransfer: Rp ${request.amountTotal}`)
  console.log(`- Status Request: ${request.status}`)

  // Ambil saldo dana kas sebelum pembayaran
  const fundBefore = await prisma.fund.findUnique({
    where: { id: unpaidBilling.billing.fundId }
  })
  console.log(`\nSaldo Kas ${fundBefore?.name} Sebelum Transfer: Rp ${fundBefore?.balance}`)

  // 3. Simulasikan penerimaan mutasi dari Moota
  console.log(`\nMensimulasikan masuknya transfer ke Bank BSI sebesar Rp ${request.amountTotal}...`)
  
  // Memanggil handleIncomingMutation secara langsung untuk mensimulasikan logika backend
  const result = await handleIncomingMutation(
    'BSI',
    Number(request.amountTotal),
    `TRSF DR ANGGOTA - ${unpaidBilling.member.name}`
  )

  if (result && result.status === 'SUCCESS') {
    console.log('\n>>> SIMULASI BERHASIL! <<<')
    
    // Verifikasi pembaruan di database
    const updatedBilling = await prisma.memberBilling.findUnique({
      where: { id: unpaidBilling.id }
    })
    const fundAfter = await prisma.fund.findUnique({
      where: { id: unpaidBilling.billing.fundId }
    })
    const incomeTx = await prisma.incomeTransaction.findFirst({
      where: { memberBillingId: unpaidBilling.id }
    })

    console.log(`\nVerifikasi Hasil Database:`)
    console.log(`- Status MemberBilling baru: ${updatedBilling?.status} (Ekspektasi: LUNAS)`)
    console.log(`- Catatan MemberBilling: "${updatedBilling?.notes}"`)
    console.log(`- Saldo Kas ${fundAfter?.name} Setelah Transfer: Rp ${fundAfter?.balance} (Ekspektasi bertambah Rp ${request.amountTotal})`)
    console.log(`- Transaksi Pemasukan Terbentuk: "${incomeTx?.title}" dengan nominal Rp ${incomeTx?.amount}`)
  } else {
    console.log('\n>>> SIMULASI GAGAL: Mutasi tidak cocok atau tidak terproses. <<<')
  }
}

run()
  .catch(e => {
    console.error('Error saat menjalankan simulasi:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
