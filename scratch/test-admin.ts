import * as fs from 'fs'
import * as path from 'path'

// Parse .env.local manually to set environment variables BEFORE importing lib/db
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
        // Remove quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1)
        }
        process.env[key] = val
      }
    }
  })
}

import { prisma } from '../lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Querying Admin table...')
  const admins = await prisma.admin.findMany()
  if (admins.length === 0) {
    console.log('No admins found in DB!')
    return
  }
  
  const admin = admins[0]
  console.log('Found Admin:', admin.username)
  console.log('Password hash:', admin.passwordHash)
  
  const isMatch = await bcrypt.compare('admin123', admin.passwordHash)
  console.log('Does "admin123" match hash?', isMatch)
}

main()
  .catch(e => {
    console.error('Error:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
