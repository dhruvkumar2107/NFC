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

  const designs = [
    { name: 'Premium PVC', price: 999, imageUrl: '/designs/premium-pvc.png' },
    { name: 'Premium Wood', price: 1499, imageUrl: '/designs/premium-wood.png' },
    { name: 'Premium Metal', price: 2499, imageUrl: '/designs/premium-metal.png' },
  ];

  for (const design of designs) {
    const cardDesign = await prisma.cardDesign.upsert({
      where: { id: design.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: design.name.toLowerCase().replace(/\s+/g, '-'),
        ...design,
      },
    });
    console.log('Card design created:', cardDesign.name, '₹' + cardDesign.price);
  }

  await prisma.commissionRule.deleteMany();
  const rules = [
    { minCards: 1, maxCards: 20, commissionPerCard: 50, pointsPerCard: 50 },
    { minCards: 21, maxCards: 50, commissionPerCard: 75, pointsPerCard: 75 },
    { minCards: 51, maxCards: 100, commissionPerCard: 100, pointsPerCard: 100 },
    { minCards: 101, maxCards: null, commissionPerCard: 125, pointsPerCard: 125 },
  ];

  for (const rule of rules) {
    const commissionRule = await prisma.commissionRule.create({
      data: { ...rule, active: false },
    });
    console.log('Commission rule:', `${commissionRule.minCards}-${commissionRule.maxCards || '∞'} cards`, `₹${commissionRule.commissionPerCard}/card`, `${commissionRule.pointsPerCard} pts`);
  }

  console.log('\nSeeding completed!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
