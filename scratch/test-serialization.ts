import { NextResponse } from 'next/server'
import { getAllFunds } from '../lib/services/fund.service'

async function main() {
  try {
    const funds = await getAllFunds()
    const sanitizedFunds = funds.map(f => ({
      id: f.id,
      name: f.name,
      balance: f.balance, // Decimal?
      color: f.color,
      description: f.description
    }))
    
    console.log('balance type:', typeof sanitizedFunds[0].balance, sanitizedFunds[0].balance.constructor.name)
    JSON.stringify(sanitizedFunds)
    console.log('JSON stringify succeeded')
  } catch (err) {
    console.error('Error occurred:', err)
  }
}

main()
