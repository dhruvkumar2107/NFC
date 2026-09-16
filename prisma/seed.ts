import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 12);
  const employeePassword = await bcrypt.hash('employee123', 12);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@mysmartcard.net' },
    update: {},
    create: {
      email: 'admin@mysmartcard.net',
      name: 'System Admin',
      passwordHash: adminPassword,
    },
  });
  console.log('Admin created:', admin.email);

  const employees = [
    { employeeId: 'MSC-SE-001', name: 'Rahul Sharma', email: 'rahul@mysmartcard.net', referralLinkCode: 'rahul-ref' },
    { employeeId: 'MSC-SE-002', name: 'Priya Patel', email: 'priya@mysmartcard.net', referralLinkCode: 'priya-ref' },
    { employeeId: 'MSC-SE-003', name: 'Amit Singh', email: 'amit@mysmartcard.net', referralLinkCode: 'amit-ref' },
  ];

  for (const emp of employees) {
    const employee = await prisma.employee.upsert({
      where: { employeeId: emp.employeeId },
      update: {},
      create: {
        ...emp,
        passwordHash: employeePassword,
        mobile: '+91' + Math.floor(1000000000 + Math.random() * 9000000000),
        territory: 'All India',
      },
    });
    console.log('Employee created:', employee.employeeId, employee.name);
  }

  // Update/create designs with correct images and ₹699 price
  const designs = [
    { id: 'design-velvet', name: 'Velvet Premium Pvc Card', price: 699, imageUrl: '/photos/velvet-front.jpeg', backImage: '/photos/velvet-back.jpeg' },
    { id: 'design-pink-butterfly', name: 'Pink Butterfly Premium Pvc Card', price: 699, imageUrl: '/photos/pink-butterfly-front.jpeg', backImage: '/photos/pink-butterfly-back.jpeg' },
    { id: 'design-green-leaf', name: 'Green Leaf Glass Premium Pvc Card', price: 699, imageUrl: '/photos/green-leaf-glass-front.jpeg', backImage: '/photos/green-leaf-glass-back.jpeg' },
    { id: 'design-glass-transparent', name: 'Glass Transparent Premium Pvc Card', price: 699, imageUrl: '/photos/glass-transparent-front.jpeg', backImage: '/photos/glass-transparent-back.jpeg' },
    { id: 'design-wooden', name: 'Wooden Premium Pvc Card', price: 699, imageUrl: '/photos/wooden-front.jpeg', backImage: '/photos/wooden-back.jpeg' },
    { id: 'design-golden-car', name: 'Golden Car Premium Pvc Card', price: 699, imageUrl: '/photos/golden-car-front.jpeg', backImage: '/photos/golden-car-back.jpeg' },
    { id: 'design-fire-lion', name: 'Fire Lion Premium Pvc Card', price: 699, imageUrl: '/photos/fire-lion-front.jpeg', backImage: '/photos/fire-lion-back.jpeg' },
    { id: 'design-fish-aquarium', name: 'Fish Aquarium Premium Pvc Card', price: 699, imageUrl: '/photos/fish-aquarium-front.jpeg', backImage: '/photos/fish-aquarium-back.jpeg' },
    { id: 'design-silver', name: 'Silver Premium Pvc Card', price: 699, imageUrl: '/photos/silver-front.jpeg', backImage: '/photos/silver-back.jpeg' },
    { id: 'design-golden-lion', name: 'Golden Lion Premium Pvc Card', price: 699, imageUrl: '/photos/golden-lion-front.jpeg', backImage: '/photos/golden-lion-back.jpeg' },
    { id: 'design-diamond', name: 'Diamond Premium Pvc Card', price: 699, imageUrl: '/photos/diamond-front.jpeg', backImage: '/photos/diamond-back.jpeg' },
  ];

  // Deactivate old designs first
  await prisma.cardDesign.updateMany({ where: { active: true }, data: { active: false } });

  for (const design of designs) {
    const cardDesign = await prisma.cardDesign.upsert({
      where: { id: design.id },
      update: { ...design, active: true },
      create: { ...design, active: true },
    });
    console.log('Card design upserted:', cardDesign.name, '₹' + cardDesign.price);
  }

  await prisma.commissionRule.updateMany({ where: { active: true }, data: { active: false } });
  const rules = [
    { minCards: 1, maxCards: null, commissionPerCard: 100, pointsPerCard: 100 },
  ];

  for (const rule of rules) {
    const existing = await prisma.commissionRule.findFirst({ where: { minCards: rule.minCards } });
    if (existing) {
      await prisma.commissionRule.update({ where: { id: existing.id }, data: { ...rule, active: true } });
      console.log('Commission rule updated:', `${rule.minCards}-${rule.maxCards || '∞'} cards: ₹${rule.commissionPerCard}`);
    } else {
      const commissionRule = await prisma.commissionRule.create({ data: { ...rule, active: true } });
      console.log('Commission rule created:', `${rule.minCards}-${rule.maxCards || '∞'} cards: ₹${rule.commissionPerCard}`);
    }
  }

  console.log('\nSeeding completed!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
