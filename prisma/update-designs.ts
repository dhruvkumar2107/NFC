import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const newDesigns = [
  { name: 'Velvet Premium Pvc Card', imageUrl: '/photos/velvet-front.jpeg', backImage: '/photos/velvet-back.jpeg' },
  { name: 'Pink Butterfly Premium Pvc Card', imageUrl: '/photos/pink-butterfly-front.jpeg', backImage: '/photos/pink-butterfly-back.jpeg' },
  { name: 'Green Leaf Glass Premium Pvc Card', imageUrl: '/photos/green-leaf-glass-front.jpeg', backImage: '/photos/green-leaf-glass-back.jpeg' },
  { name: 'Glass Transparent Premium Pvc Card', imageUrl: '/photos/glass-transparent-front.jpeg', backImage: '/photos/glass-transparent-back.jpeg' },
  { name: 'Wooden Premium Pvc Card', imageUrl: '/photos/wooden-front.jpeg', backImage: '/photos/wooden-back.jpeg' },
  { name: 'Golden Car Premium Pvc Card', imageUrl: '/photos/golden-car-front.jpeg', backImage: '/photos/golden-car-back.jpeg' },
  { name: 'Fire Lion Premium Pvc Card', imageUrl: '/photos/fire-lion-front.jpeg', backImage: '/photos/fire-lion-back.jpeg' },
  { name: 'Fish Aquarium Premium Pvc Card', imageUrl: '/photos/fish-aquarium-front.jpeg', backImage: '/photos/fish-aquarium-back.jpeg' },
  { name: 'Silver Premium Pvc Card', imageUrl: '/photos/silver-front.jpeg', backImage: '/photos/silver-back.jpeg' },
  { name: 'Golden Lion Premium Pvc Card', imageUrl: '/photos/golden-lion-front.jpeg', backImage: '/photos/golden-lion-back.jpeg' },
  { name: 'Diamond Premium Pvc Card', imageUrl: '/photos/diamond-front.jpeg', backImage: '/photos/diamond-back.jpeg' },
]

async function main() {
  console.log('Deactivating all existing designs...')
  await prisma.cardDesign.updateMany({ where: { active: true }, data: { active: false } })

  for (const design of newDesigns) {
    const existing = await prisma.cardDesign.findFirst({ where: { name: design.name } })
    if (existing) {
      await prisma.cardDesign.update({
        where: { id: existing.id },
        data: { ...design, price: 699, active: true },
      })
      console.log(`Updated: ${design.name}`)
    } else {
      await prisma.cardDesign.create({
        data: { ...design, price: 699, active: true },
      })
      console.log(`Created: ${design.name}`)
    }
  }

  const all = await prisma.cardDesign.findMany({ orderBy: { createdAt: 'asc' } })
  console.log(`\nAll designs in database (${all.length}):`)
  for (const d of all) {
    console.log(`  [${d.active ? 'ACTIVE' : 'INACTIVE'}] ${d.name} - ₹${d.price} - Front: ${d.imageUrl} - Back: ${d.backImage}`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
