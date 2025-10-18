import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create currencies
  const currencies = await Promise.all([
    prisma.currency.upsert({
      where: { code: 'TRY' },
      update: {},
      create: {
        code: 'TRY',
        name: 'الليرة التركية',
        symbol: '₺',
      },
    }),
    prisma.currency.upsert({
      where: { code: 'SYP' },
      update: {},
      create: {
        code: 'SYP',
        name: 'الليرة السورية',
        symbol: 'ل.س',
      },
    }),
    prisma.currency.upsert({
      where: { code: 'USD' },
      update: {},
      create: {
        code: 'USD',
        name: 'الدولار الأمريكي',
        symbol: '$',
      },
    }),
  ]);

  console.log('✅ Currencies created:', currencies.length);

  // Hash passwords
  const hashedPasswords = {
    sanad97: await bcrypt.hash('sanad97', 12),
    pass567: await bcrypt.hash('pass567', 12),
    pass123: await bcrypt.hash('pass123', 12),
    sara123: await bcrypt.hash('sara123', 12),
    ali123: await bcrypt.hash('ali123', 12),
    test1: await bcrypt.hash('test1', 12),
  };

  // Create users with trial system
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 days trial

  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'ibrahem' },
      update: {},
      create: {
        username: 'ibrahem',
        email: 'admin@company.com',
        passwordHash: hashedPasswords.sanad97,
        fullName: 'مدير النظام',
        phone: '770000000',
        role: 'SUPER_ADMIN',
        locale: 'ar',
        isActive: true,
        trialStartDate: new Date(),
        trialEndDate: trialEndDate,
        isTrialActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'iboo2' },
      update: {},
      create: {
        username: 'iboo2',
        email: 'user2@example.com',
        passwordHash: hashedPasswords.pass567,
        fullName: 'انتم تقرون وتعرفون',
        phone: '770000003',
        role: 'ADMIN',
        locale: 'ar',
        isActive: true,
        trialStartDate: new Date(),
        trialEndDate: trialEndDate,
        isTrialActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'ahmed' },
      update: {},
      create: {
        username: 'ahmed',
        email: 'ahmed@example.com',
        passwordHash: hashedPasswords.pass123,
        fullName: 'أحمد علي',
        phone: '987654321',
        role: 'ADMIN',
        locale: 'ar',
        isActive: true,
        trialStartDate: new Date(),
        trialEndDate: trialEndDate,
        isTrialActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'sara' },
      update: {},
      create: {
        username: 'sara',
        email: 'sara@example.com',
        passwordHash: hashedPasswords.sara123,
        fullName: 'سارة محمد',
        phone: '555444333',
        role: 'ACCOUNTANT',
        locale: 'ar',
        isActive: true,
        trialStartDate: new Date(),
        trialEndDate: trialEndDate,
        isTrialActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'ali' },
      update: {},
      create: {
        username: 'ali',
        email: 'ali@example.com',
        passwordHash: hashedPasswords.ali123,
        fullName: 'علي حسن',
        phone: '111222333',
        role: 'USER',
        locale: 'ar',
        isActive: true,
        trialStartDate: new Date(),
        trialEndDate: trialEndDate,
        isTrialActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'tset' },
      update: {},
      create: {
        username: 'tset',
        email: 'test@example.com',
        passwordHash: hashedPasswords.test1,
        fullName: 'صالح يخلي',
        phone: '770000004',
        role: 'USER',
        locale: 'ar',
        isActive: true,
        trialStartDate: new Date(),
        trialEndDate: trialEndDate,
        isTrialActive: true,
      },
    }),
  ]);

  console.log('✅ Users created:', users.length);

  // Create sample partners
  const partners = await Promise.all([
    prisma.partner.create({
      data: {
        type: 'CUSTOMER',
        name: 'شركة النور التجارية',
        phone: '0112345678',
        email: 'info@alnour.com',
        address: 'دمشق - شارع الحمراء',
      },
    }),
    prisma.partner.create({
      data: {
        type: 'VENDOR',
        name: 'مؤسسة الخير للمواد الغذائية',
        phone: '0118765432',
        email: 'sales@alkhair.com',
        address: 'حلب - منطقة الصناعة',
      },
    }),
    prisma.partner.create({
      data: {
        type: 'CUSTOMER',
        name: 'محل الأمل للملابس',
        phone: '0115555555',
        email: 'contact@alamal.com',
        address: 'حمص - شارع الكورنيش',
      },
    }),
  ]);

  console.log('✅ Partners created:', partners.length);

  // Create sample inventory items
  const inventoryItems = await Promise.all([
    prisma.inventoryItem.create({
      data: {
        sku: 'ITEM-001',
        name: 'أرز بسمتي',
        unit: 'كيلو',
        minStock: 50,
        price: 2500,
        currency: 'SYP',
        notes: 'أرز بسمتي عالي الجودة',
      },
    }),
    prisma.inventoryItem.create({
      data: {
        sku: 'ITEM-002',
        name: 'زيت زيتون',
        unit: 'لتر',
        minStock: 20,
        price: 15000,
        currency: 'SYP',
        notes: 'زيت زيتون بكر ممتاز',
      },
    }),
    prisma.inventoryItem.create({
      data: {
        sku: 'ITEM-003',
        name: 'قماش قطني',
        unit: 'متر',
        minStock: 100,
        price: 800,
        currency: 'TRY',
        notes: 'قماش قطني 100%',
      },
    }),
  ]);

  console.log('✅ Inventory items created:', inventoryItems.length);

  // Create sample employees
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        name: 'محمد أحمد',
        baseSalary: 500000,
        currency: 'SYP',
        hireDate: new Date('2023-01-15'),
        status: 'ACTIVE',
        notes: 'موظف مبيعات',
      },
    }),
    prisma.employee.create({
      data: {
        name: 'فاطمة علي',
        baseSalary: 450000,
        currency: 'SYP',
        hireDate: new Date('2023-03-01'),
        status: 'ACTIVE',
        notes: 'محاسبة',
      },
    }),
    prisma.employee.create({
      data: {
        name: 'عبد الرحمن حسن',
        baseSalary: 400000,
        currency: 'SYP',
        hireDate: new Date('2023-06-10'),
        status: 'ACTIVE',
        notes: 'مستودع',
      },
    }),
  ]);

  console.log('✅ Employees created:', employees.length);

  // Create system settings
  const settings = await Promise.all([
    prisma.systemSetting.upsert({
      where: { key: 'trial_duration_days' },
      update: {},
      create: {
        key: 'trial_duration_days',
        value: '30',
        type: 'number',
      },
    }),
    prisma.systemSetting.upsert({
      where: { key: 'trial_enabled' },
      update: {},
      create: {
        key: 'trial_enabled',
        value: 'true',
        type: 'boolean',
      },
    }),
    prisma.systemSetting.upsert({
      where: { key: 'default_currency' },
      update: {},
      create: {
        key: 'default_currency',
        value: 'SYP',
        type: 'string',
      },
    }),
    prisma.systemSetting.upsert({
      where: { key: 'company_name' },
      update: {},
      create: {
        key: 'company_name',
        value: 'نظام إبراهيم للمحاسبة',
        type: 'string',
      },
    }),
  ]);

  console.log('✅ System settings created:', settings.length);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
