import { getPublicBillingSummary, getMonthlyChartData, getRecentTransactions } from '../lib/services/dashboard.service'
import { getAllFunds } from '../lib/services/fund.service'

async function main() {
  try {
    console.log('Fetching getPublicBillingSummary...')
    await getPublicBillingSummary()
    console.log('Fetching getMonthlyChartData...')
    await getMonthlyChartData()
    console.log('Fetching getRecentTransactions...')
    await getRecentTransactions(20)
    console.log('Fetching getAllFunds...')
    await getAllFunds()
    console.log('All succeed')
  } catch (err) {
    console.error('Error occurred:', err)
  }
}

main()
