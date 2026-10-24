import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

interface BackupConfig {
  databaseUrl: string
  backupDir: string
  retentionDays: number
  compress: boolean
}

const DEFAULT_CONFIG: BackupConfig = {
  databaseUrl: process.env.DATABASE_URL || '',
  backupDir: path.join(process.cwd(), 'backups'),
  retentionDays: 30,
  compress: true
}

async function cleanupOldBackups(config: BackupConfig) {
  if (!fs.existsSync(config.backupDir)) return

  const now = Date.now()
  const cutoff = now - (config.retentionDays * 24 * 60 * 60 * 1000)

  const entries = fs.readdirSync(config.backupDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory() || entry.name.endsWith('.zip')) {
      const fullPath = path.join(config.backupDir, entry.name)
      const stats = fs.statSync(fullPath)
      if (stats.mtimeMs < cutoff) {
        fs.rmSync(fullPath, { recursive: true, force: true })
        console.log(`Cleaned up old backup: ${entry.name}`)
      }
    }
  }
}

async function createBackup(config: BackupConfig) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.join(config.backupDir, `backup-${timestamp}`)

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  console.log(`[${new Date().toISOString()}] Starting backup to: ${backupDir}`)

  const models = [
    'customer',
    'card',
    'order',
    'employee',
    'admin',
    'commissionRule',
    'cardDesign',
    'walletTransaction',
    'redemptionRequest',
    'cardTemplate',
    'cardBuilderConfig',
    'galleryAlbum',
    'mediaItem',
    'productCategory',
    'product',
    'catalogueDocument',
    'emiConfig',
    'emiCalculation',
    'analyticsEvent',
    'enquiry',
    'leadNote',
    'activityLog',
    'storedFile',
    'storedFileChunk'
  ]

  let totalRecords = 0
  const modelStats: Record<string, number> = {}

  for (const model of models) {
    try {
      // @ts-ignore
      const data = await prisma[model].findMany()
      const filePath = path.join(backupDir, `${model}.json`)
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
      modelStats[model] = data.length
      totalRecords += data.length
      console.log(`  ✓ ${model}: ${data.length} records`)
    } catch (error) {
      console.error(`  ✗ ${model}: ${error}`)
      modelStats[model] = -1
    }
  }

  const manifest = {
    timestamp: new Date().toISOString(),
    databaseUrl: config.databaseUrl.replace(/:[^:@]+@/, ':****@'),
    totalRecords,
    models: Object.entries(modelStats).map(([name, count]) => ({
      name,
      file: `${name}.json`,
      records: count
    }))
  }

  fs.writeFileSync(
    path.join(backupDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  )

  let archivePath: string | null = null
  if (config.compress) {
    const archiver = await import('archiver')
    const archive = archiver.default('zip', { zlib: { level: 9 } })
    archivePath = path.join(config.backupDir, `backup-${timestamp}.zip`)
    const output = fs.createWriteStream(archivePath)

    await new Promise<void>((resolve, reject) => {
      output.on('close', resolve)
      output.on('error', reject)
      archive.pipe(output)
      archive.directory(backupDir, false)
      archive.finalize()
    })

    console.log(`  ✓ Archive created: ${archivePath}`)
  }

  console.log(`[${new Date().toISOString()}] Backup complete! Total records: ${totalRecords}`)
  return { backupDir, archivePath, manifest }
}

async function main() {
  const config: BackupConfig = {
    ...DEFAULT_CONFIG,
    databaseUrl: process.env.DATABASE_URL || '',
    backupDir: process.env.BACKUP_DIR ? path.resolve(process.env.BACKUP_DIR) : DEFAULT_CONFIG.backupDir,
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    compress: process.env.BACKUP_COMPRESS !== 'false'
  }

  if (!config.databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is required')
    process.exit(1)
  }

  try {
    await cleanupOldBackups(config)
    await createBackup(config)
  } catch (error) {
    console.error('Backup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()