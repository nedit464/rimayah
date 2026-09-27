const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

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

const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 })

const MONTHLY_AMOUNT = 8000

// Members data from user
const members = [
  { name: "Lalu Muhammad Faarih As'ad", tag: 'lama', paidUntil: '2025-12' },
  { name: 'Maulky Hisyam Al Mughny', tag: 'lama', paidUntil: '2026-02' },
  { name: 'Moch. Ilham Adeli', tag: 'baru', paidUntil: '2026-05' },
  { name: 'M. Khikam Muzadi', tag: 'lama', paidUntil: '2026-01' },
  { name: 'Abdurrahman azzaid', tag: 'lama', paidUntil: null },
  { name: 'Salman Ali Kurnia Putra', tag: 'baru', paidUntil: null },
  { name: 'Ubaidillah', tag: 'baru', paidUntil: null },
  { name: 'Fathirul Malik. K', tag: 'lama', paidUntil: '2026-05' },
  { name: 'Alfian Hilal Nugrahadi', tag: 'baru', paidUntil: '2026-05' },
  { name: 'yusuf abdilah', tag: 'lama', paidUntil: '2026-01' },
  { name: 'Rashif Aunur Rasyid', tag: 'baru', paidUntil: null },
  { name: 'Deska Alhafis', tag: 'lama', paidUntil: '2026-05' },
  { name: 'Fadillah Irsyad Al Faridz', tag: 'lama', paidUntil: '2026-10' },
  { name: 'Heru Saputra', tag: 'Berhenti', paidUntil: '2025-12' },
  { name: 'Zaidil', tag: 'Berhenti', paidUntil: '2025-12' },
  { name: 'Haedar', tag: 'Berhenti', paidUntil: '2026-02' }
]

function parseYearMonth(str) {
  if (!str) return null
  const [y, m] = str.split('-')
  return { year: parseInt(y, 10), month: parseInt(m, 10) }
}

async function findOrCreateMember(name, tag) {
  const nameLower = name.toLowerCase()
  const res = await pool.query(`SELECT id, name FROM "Member" WHERE lower(name) = $1 LIMIT 1`, [nameLower])
  if (res.rows.length > 0) return res.rows[0]

  // create
  const joinDate = tag === 'baru' ? new Date(2026, 4, 1) : new Date(2025, 0, 1)
  const status = tag === 'Berhenti' ? 'NONAKTIF' : 'AKTIF'
  const id = require('crypto').randomUUID()
  const insert = await pool.query(`INSERT INTO "Member" (id, name, "joinDate", status, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, name`, [id, name, joinDate, status])
  return insert.rows[0]
}

async function setMemberStatus(memberId, tag) {
  if (tag === 'Berhenti') {
    await pool.query(`UPDATE "Member" SET status = 'NONAKTIF', "updatedAt" = NOW() WHERE id = $1`, [memberId])
  } else {
    await pool.query(`UPDATE "Member" SET status = 'AKTIF', "updatedAt" = NOW() WHERE id = $1`, [memberId])
  }
}

async function ensureExtraCash() {
  const res = await pool.query(`SELECT id FROM "IncomeTransaction" WHERE title ILIKE '%Tambahan%' AND amount = 14000 LIMIT 1`)
  if (res.rows.length > 0) return
  // find fund
  const f = await pool.query(`SELECT id FROM "Fund" ORDER BY "createdAt" LIMIT 1`)
  if (f.rows.length === 0) return
  const fundId = f.rows[0].id
  await pool.query(`INSERT INTO "IncomeTransaction" (id, "fundId", title, amount, date, description, "createdAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`, [fundId, 'Uang Kas Tambahan (Sebelum Des 2025)', 14000, new Date(2025, 10, 30), 'Kas tambahan sebelum Desember 2025'])
}

async function processMemberPayments() {
  // find fund id
  const fundRes = await pool.query(`SELECT id, name FROM "Fund" ORDER BY "createdAt" LIMIT 1`)
  if (fundRes.rows.length === 0) throw new Error('No Fund found')
  const fundId = fundRes.rows[0].id

  for (const m of members) {
    console.log('Processing', m.name)
    const member = await findOrCreateMember(m.name, m.tag)
    await setMemberStatus(member.id, m.tag)

    if (!m.paidUntil) {
      console.log('  no paidUntil; skipping payments')
      continue
    }

    const ym = parseYearMonth(m.paidUntil)
    if (!ym) continue

    // iterate from Dec 2025 to ym
    let start = { year: 2025, month: 12 }
    let curY = start.year, curM = start.month
    while (curY < ym.year || (curY === ym.year && curM <= ym.month)) {
      // find billing
      const bRes = await pool.query(`SELECT id, "dueDate" FROM "Billing" WHERE type = 'MONTHLY_KAS' AND month = $1 AND year = $2 LIMIT 1`, [curM, curY])
      if (bRes.rows.length === 0) {
        // billing missing: skip creating billing to avoid side-effects
        console.log(`  billing missing for ${curM}/${curY} — skipping`)
      } else {
        const billingId = bRes.rows[0].id
        // find memberBilling
        const mbRes = await pool.query(`SELECT id, status FROM "MemberBilling" WHERE "billingId" = $1 AND "memberId" = $2 LIMIT 1`, [billingId, member.id])
        let mbId
        if (mbRes.rows.length === 0) {
          // create memberBilling as LUNAS
          const paidAt = new Date(curY, curM - 1, 10)
          const mbIdGen = require('crypto').randomUUID()
          const ins = await pool.query(`INSERT INTO "MemberBilling" (id, "memberId", "billingId", status, "paidAt", "verifiedAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, 'LUNAS', $4, $4, NOW(), NOW()) RETURNING id`, [mbIdGen, member.id, billingId, paidAt])
          mbId = ins.rows[0].id
          console.log(`  created memberBilling and marked LUNAS for ${curM}/${curY}`)
        } else {
          mbId = mbRes.rows[0].id
          if (mbRes.rows[0].status !== 'LUNAS') {
            const paidAt = new Date(curY, curM - 1, 10)
            await pool.query(`UPDATE "MemberBilling" SET status = 'LUNAS', "paidAt" = $1, "verifiedAt" = $1, notes = NULL, "updatedAt" = NOW() WHERE id = $2`, [paidAt, mbId])
            console.log(`  updated memberBilling ${mbId} -> LUNAS for ${curM}/${curY}`)
          } else {
            // already LUNAS
          }
        }

        // ensure income transaction linked
        const incRes = await pool.query(`SELECT id FROM "IncomeTransaction" WHERE "memberBillingId" = $1 LIMIT 1`, [mbId])
        if (incRes.rows.length === 0) {
          const amount = MONTHLY_AMOUNT
          const date = new Date(curY, curM - 1, 10)
          const title = `Iuran Kas ${curM}/${curY} - ${m.name}`
          const incId = require('crypto').randomUUID()
          await pool.query(`INSERT INTO "IncomeTransaction" (id, "fundId", "memberBillingId", title, amount, date, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [incId, fundId, mbId, title, amount, date])
          console.log(`    created IncomeTransaction for ${m.name} ${curM}/${curY}`)
        }
      }

      // increment month
      curM++
      if (curM > 12) { curM = 1; curY++ }
    }
  }

  // ensure extra cash
  await ensureExtraCash()
}

async function main() {
  try {
    await processMemberPayments()
    console.log('Done')
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await pool.end()
  }
}

main()
