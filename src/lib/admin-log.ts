import { prisma } from './db'

export interface LogInput {
  actorId?: string | null
  actorRole?: string | null
  action: string
  target?: string | null
  metadata?: Record<string, unknown>
}

/** Best-effort audit log write. */
export async function logActivity(input: LogInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        actorId: input.actorId || null,
        actorRole: input.actorRole || null,
        action: input.action.slice(0, 80),
        target: input.target ? input.target.slice(0, 120) : null,
        metadata: JSON.stringify(input.metadata || {}).slice(0, 4000),
      },
    })
  } catch {
    // auditing must never break the main action
  }
}
