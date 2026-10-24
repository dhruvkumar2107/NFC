import Database from 'better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
  const db = new Database(dbPath, { readonly: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(process.cwd(), 'backups', `sqlite-backup-${timestamp}`)

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  console.log(`Starting SQLite backup to: ${backupDir}`)

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'").all() as { name: string }[]

  for (const { name } of tables) {
    try {
      console.log(`Backing up ${name}...`)
      const quotedName = name.includes(' ') || ['Order', 'Group', 'User', 'Index', 'Key', 'Table'].includes(name) ? `"${name}"` : name
      const rows = db.prepare(`SELECT * FROM ${quotedName}`).all()
      const filePath = path.join(backupDir, `${name}.json`)
      fs.writeFileSync(filePath, JSON.stringify(rows, null, 2))
      console.log(`  ✓ ${name}: ${rows.length} records`)
    } catch (error) {
      console.error(`  ✗ ${name}: ${error}`)
    }
  }

  const manifest = {
    timestamp: new Date().toISOString(),
    databaseType: 'sqlite',
    databasePath: './prisma/dev.db',
    tables: tables.map(t => ({ name: t.name, file: `${t.name}.json` }))
  }

  fs.writeFileSync(
    path.join(backupDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  )

  fs.copyFileSync(dbPath, path.join(backupDir, 'dev.db'))
  console.log(`  ✓ Raw SQLite file copied`)

  const archiver = await import('archiver')
  const archive = archiver.default('zip', { zlib: { level: 9 } })
  const output = fs.createWriteStream(path.join(process.cwd(), 'backups', `sqlite-backup-${timestamp}.zip`))

  archive.pipe(output)
  archive.directory(backupDir, false)
  await archive.finalize()

  console.log(`\nBackup complete!`)
  console.log(`Directory: ${backupDir}`)
  console.log(`Archive: ${path.join(process.cwd(), 'backups', `sqlite-backup-${timestamp}.zip`)}`)

  db.close()
}

main().catch(console.error)