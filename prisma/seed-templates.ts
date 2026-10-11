import { PrismaClient } from '@prisma/client'
import { INDUSTRY_TEMPLATES } from '../src/lib/industry-templates'

const prisma = new PrismaClient()

async function main() {
  for (const t of INDUSTRY_TEMPLATES) {
    await prisma.cardTemplate.upsert({
      where: { industry: t.industry },
      update: {
        name: t.name,
        category: t.category,
        description: t.description,
        icon: t.icon,
        config: JSON.stringify(t.config),
        active: true,
        isSystem: true,
      },
      create: {
        name: t.name,
        industry: t.industry,
        category: t.category,
        description: t.description,
        icon: t.icon,
        config: JSON.stringify(t.config),
        active: true,
        isSystem: true,
      },
    })
  }
  const count = await prisma.cardTemplate.count()
  console.log(`Seeded ${INDUSTRY_TEMPLATES.length} industry templates. Total in DB: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
