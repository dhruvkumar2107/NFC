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

  // Update/create designs with new images and ₹599 price
  const designs = [
    { id: 'premium-pvc-1', name: 'Premium PVC Card', price: 599, imageUrl: '/photos/design1-front.jpeg', backImage: '/photos/design1-back.jpeg' },
    { id: 'premium-pvc-2', name: 'Classic Matte Card', price: 599, imageUrl: '/photos/design2-front.jpeg', backImage: '/photos/design2-back.jpeg' },
    { id: 'premium-pvc-3', name: 'Royal Gold Card', price: 599, imageUrl: '/photos/design3-front.jpeg', backImage: '/photos/design3-back.jpeg' },
    { id: 'premium-pvc-4', name: 'Sleek Black Card', price: 599, imageUrl: '/photos/design4-front.jpeg', backImage: '/photos/design4-back.jpeg' },
    { id: 'premium-pvc-5', name: 'Wood Finish Card', price: 599, imageUrl: '/photos/design5-front.jpeg', backImage: '/photos/design5-back.jpeg' },
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
    { minCards: 1, maxCards: 20, commissionPerCard: 50, pointsPerCard: 50 },
    { minCards: 21, maxCards: 50, commissionPerCard: 75, pointsPerCard: 75 },
    { minCards: 51, maxCards: 100, commissionPerCard: 100, pointsPerCard: 100 },
    { minCards: 101, maxCards: null, commissionPerCard: 125, pointsPerCard: 125 },
  ];

  for (const rule of rules) {
    const existing = await prisma.commissionRule.findFirst({ where: { minCards: rule.minCards } });
    if (existing) {
      await prisma.commissionRule.update({ where: { id: existing.id }, data: { ...rule, active: true } });
      console.log('Commission rule updated:', `${rule.minCards}-${rule.maxCards || '∞'} cards`);
    } else {
      const commissionRule = await prisma.commissionRule.create({ data: { ...rule, active: true } });
      console.log('Commission rule created:', `${rule.minCards}-${rule.maxCards || '∞'} cards`);
    }
  }

  console.log('\nSeeding completed!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
