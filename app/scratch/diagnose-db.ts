import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { Pool } from 'pg'

async function run() {
  const connectionString = process.env.DATABASE_URL
  const pool = new Pool({ connectionString })
  
  try {
    console.log('Test 1: SELECT FROM "PaymentRequest" (Quotes, Capital P, Capital R)')
    try {
      const res = await pool.query('SELECT COUNT(*) FROM "PaymentRequest";')
      console.log('-> Success! Count:', res.rows[0].count)
    } catch (err: any) {
      console.log('-> Failed:', err.message)
    }

    console.log('Test 5: SELECT FROM "public"."PaymentRequest" (Public schema prefix, Quotes, Capital P, Capital R)')
    try {
      const res = await pool.query('SELECT COUNT(*) FROM "public"."PaymentRequest";')
      console.log('-> Success! Count:', res.rows[0].count)
    } catch (err: any) {
      console.log('-> Failed:', err.message)
    }

    console.log('Test 2: SELECT FROM "paymentrequest" (Quotes, Lowercase)')
    try {
      const res = await pool.query('SELECT COUNT(*) FROM "paymentrequest";')
      console.log('-> Success! Count:', res.rows[0].count)
    } catch (err: any) {
      console.log('-> Failed:', err.message)
    }

    console.log('Test 3: SELECT FROM PaymentRequest (No Quotes, Capital P, Capital R)')
    try {
      const res = await pool.query('SELECT COUNT(*) FROM PaymentRequest;')
      console.log('-> Success! Count:', res.rows[0].count)
    } catch (err: any) {
      console.log('-> Failed:', err.message)
    }

    console.log('Test 4: SELECT FROM paymentrequest (No Quotes, Lowercase)')
    try {
      const res = await pool.query('SELECT COUNT(*) FROM paymentrequest;')
      console.log('-> Success! Count:', res.rows[0].count)
    } catch (err: any) {
      console.log('-> Failed:', err.message)
    }
  } finally {
    await pool.end()
  }
}

run().catch(console.error)
