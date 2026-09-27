import { prisma } from '../lib/db'

async function main() {
  const result = await prisma.paymentRequest.updateMany({
    where: {
      status: 'PENDING'
    },
    data: {
      status: 'EXPIRED'
    }
  })
  console.log(`Successfully expired ${result.count} pending payment requests.`)
  
  // Close the database pool
  const globalForPrisma = require('../lib/db').globalForPrisma
  if (globalForPrisma && globalForPrisma.pool) {
    await globalForPrisma.pool.end()
  }
}

main()
  .catch(console.error)
