import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { prisma } from '../lib/db'

async function test() {
  console.log('Running test with prisma...')
  try {
    const rawRes = await prisma.$queryRawUnsafe<any[]>('SELECT COUNT(*) FROM "PaymentRequest";')
    console.log('Success! Raw SQL count:', rawRes)
  } catch (err) {
    console.error('Error during raw query:', err)
  }

  try {
    const prCount = await prisma.paymentRequest.count()
    console.log('Success! PaymentRequest count:', prCount)
  } catch (err) {
    console.error('Error during paymentRequest.count():', err)
  }
}

test().catch(console.error)
