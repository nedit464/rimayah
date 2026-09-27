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

import { prisma } from '../lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Creating new admin...')
  
  const passwordHash = await bcrypt.hash('password123', 12)
  
  const newAdmin = await prisma.admin.create({
    data: {
      username: 'admin_baru',
      passwordHash: passwordHash,
    }
  })
  
  console.log('Success! Created new admin:')
  console.log('Username:', newAdmin.username)
  console.log('Password: password123')
}

main()
  .catch(e => {
    console.error('Error:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
