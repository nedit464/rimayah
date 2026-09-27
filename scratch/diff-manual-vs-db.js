const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

// Load .env.local (simple)
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

// User-provided list (normalized names per month)
// Map keys: '12/2025', '1/2026', etc.
const manual = {
  '12/2025': [
    'Fathir','Hisyam','Irsyad','Zaidil','Farih','Yusuf','Khimak','Deska','Heru','Yusuf'
  ],
  '1/2026': ['Heru','Yusuf','Haedar','Hisyam','Fathir','Deska','Irsyad','Khimak'],
  '2/2026': ['Haedar','Hisyam','Fathir','Deska','Irsyad'],
  '3/2026': ['Deska','Fathir','Irsyad'],
  '4/2026': ['Deska','Fathir','Irsyad'],
  '5/2026': ['Deska','Fathir','Ilham','Alfian','Rashif','Irsyad'],
  '6/2026': ['Irsyad'],
  '7/2026': ['Irsyad'],
  '8/2026': ['Irsyad'],
  '9/2026': ['Irsyad'],
  '10/2026': ['Irsyad'],
  '11/2026': ['Irsyad']
}

function normName(s) {
  return s.toLowerCase().replace(/\./g,'').replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim()
}

function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1
      dp[i][j] = Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost)
    }
  }
  return dp[m][n]
}

function tokenFuzzyMatch(mnorm, dbNorm) {
  if (dbNorm.includes(mnorm)) return true
  const tokens = dbNorm.split(' ')
  for (const t of tokens) {
    if (levenshtein(mnorm, t) <= 1) return true
  }
  return false
}

// Expand manual into list of entries (allow duplicates)
const manualEntries = []
for (const [m, arr] of Object.entries(manual)) {
  for (const n of arr) {
    manualEntries.push({ month: m, name: n, norm: normName(n) })
  }
}

async function main() {
  const res = await pool.query(`SELECT id, title, amount, date FROM "IncomeTransaction" WHERE title ILIKE 'Iuran Kas %' ORDER BY date`)
  const rows = res.rows
  const dbEntries = []
  for (const r of rows) {
    // expect title like: Iuran Kas 12/2025 - Name
    const m = r.title.match(/Iuran Kas\s+(\d{1,2}\/\d{4})\s*-\s*(.+)$/i)
    if (m) {
      const month = m[1]
      const name = m[2]
      dbEntries.push({ id: r.id, date: r.date, month, name, amount: Number(r.amount) })
    } else {
      dbEntries.push({ id: r.id, date: r.date, month: 'UNKNOWN', name: r.title, amount: Number(r.amount) })
    }
  }

  // Count-based matching per (month, manualNorm)
  const manualCountMap = new Map()
  for (const m of manualEntries) {
    const key = `${m.month}||${m.norm}`
    manualCountMap.set(key, (manualCountMap.get(key) || 0) + 1)
  }

  // For DB entries, map each to a manual norm if possible (same month and contains manual token), else to its own norm
  const dbCountMap = new Map()
  const dbIndexMap = new Map() // key -> list of entries

  for (const e of dbEntries) {
    const dbNorm = normName(e.name)
    // try to find a manual norm that is substring for same month
    const found = manualEntries.find(m => m.month === e.month && dbNorm.includes(m.norm))
    const key = found ? `${e.month}||${found.norm}` : `DB||${dbNorm}`
    dbCountMap.set(key, (dbCountMap.get(key) || 0) + 1)
    if (!dbIndexMap.has(key)) dbIndexMap.set(key, [])
    dbIndexMap.get(key).push(e)
  }

  // Compute diffs: for keys present in dbCountMap, subtract manualCountMap (default 0)
  const extrasList = []
  for (const [key, dbc] of dbCountMap.entries()) {
    const manualc = manualCountMap.get(key) || 0
    if (dbc > manualc) {
      const surplus = dbc - manualc
      const entries = dbIndexMap.get(key) || []
      extrasList.push(...entries.slice(0, surplus))
    }
  }

  console.log('DB total Iuran Kas rows:', dbEntries.length)
  console.log('Manual total counted entries:', manualEntries.length)
  console.log('\n--- Extras inferred (DB count > manual count) ---')
  extrasList.forEach(x => console.log(`${x.id.slice(0,12)} | ${x.month} | ${x.date.toISOString().slice(0,10)} | Rp${x.amount.toLocaleString('id-ID')} | ${x.name}`))
  console.log('\nCount extras inferred:', extrasList.length)

  // Show manual keys with zero DB hits
  const missingManual = []
  for (const [key, mc] of manualCountMap.entries()) {
    const dbc = dbCountMap.get(key) || 0
    if (mc > dbc) missingManual.push({ key, need: mc - dbc })
  }
  console.log('\n--- Manual entries not found enough times in DB ---')
  missingManual.forEach(m => console.log(m.key + ' | missingCount=' + m.need))

  // Pair missing manual keys to extras when possible (by substring), to get net extras
  const extrasCopy = extrasList.slice()
  const pairs = []
  for (const mm of missingManual) {
    const [mon, mnorm] = mm.key.split('||')
    const idx = extrasCopy.findIndex(e => tokenFuzzyMatch(mnorm, normName(e.name)) && e.month === mon)
    if (idx !== -1) {
      pairs.push({ missing: mm, extra: extrasCopy[idx] })
      extrasCopy.splice(idx, 1)
    }
  }

  console.log('\n--- Paired missing->extra (treated as same) ---')
  pairs.forEach(p => console.log(`${p.extra.id.slice(0,12)} | ${p.extra.month} | ${p.extra.name}  <= pairs with ${p.missing.key}`))

  console.log('\n--- Net extras (after pairing) ---')
  extrasCopy.forEach(x => console.log(`${x.id.slice(0,12)} | ${x.month} | ${x.date.toISOString().slice(0,10)} | Rp${x.amount.toLocaleString('id-ID')} | ${x.name}`))
  console.log('\nNet extras count:', extrasCopy.length)

  // Auto-select first 7 net extras as candidates for deletion
  const selected = extrasCopy.slice(0,7)
  const out = {
    netExtrasCount: extrasCopy.length,
    selectedCount: selected.length,
    selected: selected.map(s => ({ id: s.id, month: s.month, date: s.date.toISOString().slice(0,10), amount: s.amount, name: s.name }))
  }
  const outPath = path.join(__dirname, 'selected-net-extras.json')
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
  console.log('\nWrote selection to', outPath)

  await pool.end()
}

main().catch(async e => { console.error(e); await pool.end(); process.exit(1) })
