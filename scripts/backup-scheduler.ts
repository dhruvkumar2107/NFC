#!/usr/bin/env node
/**
 * Automated backup scheduler using node-cron
 * Run this as a persistent process on a server/VM
 * 
 * Usage:
 *   npx tsx scripts/backup-scheduler.ts
 * 
 * Or with PM2:
 *   pm2 start scripts/backup-scheduler.ts --name "db-backup-scheduler"
 */

import cron from 'node-cron'
import { spawn } from 'child_process'
import * as path from 'path'

const CRON_SCHEDULE = process.env.BACKUP_CRON || '0 2 * * *' // Default: 2 AM daily
const SCRIPT_PATH = path.join(__dirname, 'automated-backup.ts')

console.log(`[${new Date().toISOString()}] Starting backup scheduler`)
console.log(`Schedule: ${CRON_SCHEDULE}`)
console.log(`Script: ${SCRIPT_PATH}`)

function runBackup() {
  console.log(`[${new Date().toISOString()}] Running scheduled backup...`)
  
  const child = spawn('npx', ['tsx', SCRIPT_PATH], {
    stdio: 'inherit',
    env: { ...process.env }
  })

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`[${new Date().toISOString()}] Backup completed successfully`)
    } else {
      console.error(`[${new Date().toISOString()}] Backup failed with code ${code}`)
    }
  })

  child.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Backup process error:`, err)
  })
}

// Validate cron expression
try {
  cron.validate(CRON_SCHEDULE)
} catch (e) {
  console.error(`Invalid cron expression: ${CRON_SCHEDULE}`)
  process.exit(1)
}

// Schedule the backup
const task = cron.schedule(CRON_SCHEDULE, runBackup, {
  scheduled: true,
  timezone: process.env.TZ || 'UTC'
})

console.log(`[${new Date().toISOString()}] Scheduler started. Next run: ${task.nextDate()?.toISOString() || 'unknown'}`)

// Run immediately on startup if requested
if (process.env.BACKUP_RUN_ON_START === 'true') {
  runBackup()
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] Shutting down scheduler...`)
  task.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] Shutting down scheduler...`)
  task.stop()
  process.exit(0)
})