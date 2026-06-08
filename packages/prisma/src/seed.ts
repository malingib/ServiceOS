import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Tenant ──────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'serviceops-kenya' },
    update: {},
    create: {
      name: 'ServiceOps Kenya',
      slug: 'serviceops-kenya',
      country: 'KE',
      currency: 'KES',
      commissionRateBps: 1000,
      settings: {
        brand_name: 'ServiceOps',
        support_phone: '+254700000000',
        support_email: 'support@serviceops.co.ke',
        timezone: 'Africa/Nairobi',
        default_language: 'en',
        require_kyc: true,
        auto_assign_worker: false,
      },
      paymentSettings: {
        mpesa_enabled: true,
        card_payments_enabled: false,
        currency: 'KES',
        mpesa_shortcode: '174379',
        commission_rate: 10.0,
      },
    },
  });
  console.log(`  Tenant: ${tenant.name} (${tenant.id})`);

  // ─── Admin User ──────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { phone: '+254700000001' },
    update: {},
    create: {
      tenantId: tenant.id,
      phone: '+254700000001',
      email: 'admin@serviceops.co.ke',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      verifiedAt: new Date(),
      metadata: { department: 'operations', can_impersonate: true },
    },
  });
  console.log(`  Admin: ${admin.firstName} ${admin.lastName} (${admin.id})`);

  // ─── Customer User ───────────────────────────────────────────────────────
  const customer = await prisma.user.upsert({
    where: { phone: '+254712345678' },
    update: {},
    create: {
      tenantId: tenant.id,
      phone: '+254712345678',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Wanjiku',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      verifiedAt: new Date(),
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      tenantId: tenant.id,
      homeAddress: {
        street: 'Moi Avenue',
        city: 'Nairobi',
        county: 'Nairobi',
        country: 'Kenya',
        label: 'Home',
      },
      preferredPaymentMethod: 'MPESA_STK',
      referralCode: 'JANE20',
      loyaltyPoints: 150,
    },
  });
  console.log(`  Customer: ${customer.firstName} ${customer.lastName} (${customer.id})`);

  // ─── Worker Users ────────────────────────────────────────────────────────
  const workersData = [
    {
      phone: '+254723456789',
      firstName: 'John',
      lastName: 'Kamau',
      skills: ['Deep Cleaning', 'Regular Cleaning', 'Office Cleaning'],
      hourlyRateMinor: BigInt(350),
    },
    {
      phone: '+254734567890',
      firstName: 'Mary',
      lastName: 'Akinyi',
      skills: ['Laundry', 'Ironing', 'Dry Cleaning'],
      hourlyRateMinor: BigInt(300),
    },
    {
      phone: '+254745678901',
      firstName: 'Peter',
      lastName: 'Ochieng',
      skills: ['Plumbing', 'Electrical', 'General Maintenance'],
      hourlyRateMinor: BigInt(500),
    },
    {
      phone: '+254756789012',
      firstName: 'Grace',
      lastName: 'Njeri',
      skills: ['Deep Cleaning', 'Cooking', 'Elder Care'],
      hourlyRateMinor: BigInt(400),
    },
  ];

  const workers = [];
  for (const w of workersData) {
    const user = await prisma.user.upsert({
      where: { phone: w.phone },
      update: {},
      create: {
        tenantId: tenant.id,
        phone: w.phone,
        firstName: w.firstName,
        lastName: w.lastName,
        role: 'WORKER',
        status: 'ACTIVE',
        verifiedAt: new Date(),
      },
    });

    await prisma.workerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        tenantId: tenant.id,
        idNumber: `ID${Math.floor(10000000 + Math.random() * 90000000)}`,
        kycStatus: 'VERIFIED',
        skills: w.skills,
        hourlyRateMinor: w.hourlyRateMinor,
        reliabilityScore: 450 + Math.floor(Math.random() * 50),
        isAvailable: true,
        workingHours: {
          monday: { start: '08:00', end: '18:00' },
          tuesday: { start: '08:00', end: '18:00' },
          wednesday: { start: '08:00', end: '18:00' },
          thursday: { start: '08:00', end: '18:00' },
          friday: { start: '08:00', end: '17:00' },
          saturday: { start: '09:00', end: '15:00' },
          sunday: { start: null, end: null },
        },
      },
    });

    workers.push(user);
    console.log(`  Worker: ${user.firstName} ${user.lastName} (${user.id})`);
  }

  // ─── Service Catalog ─────────────────────────────────────────────────────
  const servicesData = [
    {
      name: 'Regular Cleaning',
      slug: 'regular-cleaning',
      category: 'CLEANING',
      description: 'Standard home cleaning service covering dusting, mopping, bathroom and kitchen cleaning.',
      basePriceMinor: BigInt(2000),
      durationMinutes: 120,
      requirements: ['Cleaning supplies provided by customer', 'Access to water and electricity'],
    },
    {
      name: 'Deep Cleaning',
      slug: 'deep-cleaning',
      category: 'CLEANING',
      description: 'Intensive cleaning including hard-to-reach areas, appliance interiors, and detailed scrubbing.',
      basePriceMinor: BigInt(3500),
      durationMinutes: 240,
      requirements: ['Vacuum cleaner', 'Specialized cleaning agents'],
    },
    {
      name: 'Office Cleaning',
      slug: 'office-cleaning',
      category: 'CLEANING',
      description: 'Commercial cleaning for offices and workspaces.',
      basePriceMinor: BigInt(5000),
      durationMinutes: 180,
      requirements: ['After-hours access', 'Waste disposal area'],
    },
    {
      name: 'Laundry & Ironing',
      slug: 'laundry-ironing',
      category: 'LAUNDRY',
      description: 'Wash, dry, and iron clothing and linens.',
      basePriceMinor: BigInt(1500),
      durationMinutes: 180,
      requirements: ['Washing machine', 'Detergent', 'Ironing board'],
    },
    {
      name: 'Dry Cleaning',
      slug: 'dry-cleaning',
      category: 'LAUNDRY',
      description: 'Professional dry cleaning for delicate fabrics and formal wear.',
      basePriceMinor: BigInt(2500),
      durationMinutes: 120,
      requirements: ['Specialized cleaning solvents'],
    },
    {
      name: 'Plumbing Services',
      slug: 'plumbing-services',
      category: 'MAINTENANCE',
      description: 'Fix leaks, unblock drains, install fixtures, and general plumbing repairs.',
      basePriceMinor: BigInt(3000),
      durationMinutes: 120,
      requirements: ['Basic tools', 'Replacement parts paid separately'],
    },
    {
      name: 'Electrical Services',
      slug: 'electrical-services',
      category: 'MAINTENANCE',
      description: 'Wiring, socket installation, lighting, and electrical fault diagnosis.',
      basePriceMinor: BigInt(3000),
      durationMinutes: 120,
      requirements: ['Certified electrician', 'Safety equipment'],
    },
    {
      name: 'Elder Care Companion',
      slug: 'elder-care-companion',
      category: 'CAREGIVER',
      description: 'Companionship and basic care for elderly family members.',
      basePriceMinor: BigInt(5000),
      durationMinutes: 480,
      requirements: ['First aid certified', 'Patient care training'],
    },
  ];

  const services = [];
  for (const s of servicesData) {
    const service = await prisma.service.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: s.slug } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: s.name,
        slug: s.slug,
        category: s.category,
        description: s.description,
        basePriceMinor: s.basePriceMinor,
        durationMinutes: s.durationMinutes,
        requirements: s.requirements,
        isActive: true,
      },
    });
    services.push(service);
    console.log(`  Service: ${service.name} (KES ${service.basePriceMinor})`);
  }

  // ─── Addresses ───────────────────────────────────────────────────────────
  const address = await prisma.address.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      userId: customer.id,
      tenantId: tenant.id,
      label: 'Home',
      streetAddress: '45 Moi Avenue',
      apartmentSuite: 'Suite 3B',
      city: 'Nairobi',
      county: 'Nairobi',
      country: 'Kenya',
      location: { lat: -1.2921, lng: 36.8219 },
      isDefault: true,
    },
  });
  console.log(`  Address: ${address.streetAddress}, ${address.city}`);

  // ─── Sample Bookings ─────────────────────────────────────────────────────
  const today = new Date();
  const bookingDates = [
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
  ];

  const bookingStatuses = ['CONFIRMED', 'AWAITING_PAYMENT', 'COMPLETED'];

  for (let i = 0; i < bookingDates.length; i++) {
    const service = services[i % services.length];
    const worker = workers[i % workers.length];
    const status = bookingStatuses[i];
    const startHour = 9 + i * 2;

    await prisma.booking.upsert({
      where: { id: `00000000-0000-0000-0000-00000000000${i + 1}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-00000000000${i + 1}`,
        tenantId: tenant.id,
        customerId: customer.id,
        serviceId: service.id,
        addressId: address.id,
        workerId: status !== 'AWAITING_PAYMENT' ? worker.id : null,
        scheduledDate: bookingDates[i],
        scheduledStart: new Date(
          bookingDates[i].getFullYear(),
          bookingDates[i].getMonth(),
          bookingDates[i].getDate(),
          startHour,
          0,
          0,
          0
        ),
        scheduledEnd: new Date(
          bookingDates[i].getFullYear(),
          bookingDates[i].getMonth(),
          bookingDates[i].getDate(),
          startHour + 2,
          0,
          0,
          0
        ),
        status: status,
        baseAmountMinor: service.basePriceMinor,
        discountAmountMinor: BigInt(0),
        totalAmountMinor: service.basePriceMinor,
        currency: 'KES',
        timezone: 'Africa/Nairobi',
      },
    });

    if (status === 'COMPLETED') {
      await prisma.job.upsert({
        where: { id: `00000000-0000-0000-0000-00000000001${i}` },
        update: {},
        create: {
          id: `00000000-0000-0000-0000-00000000001${i}`,
          tenantId: tenant.id,
          bookingId: `00000000-0000-0000-0000-00000000000${i + 1}`,
          workerId: worker.id,
          serviceId: service.id,
          status: 'COMPLETED',
          acceptedAt: new Date(bookingDates[i].getTime() - 86400000),
          startedAt: new Date(bookingDates[i].getTime() + 3600000),
          completedAt: new Date(bookingDates[i].getTime() + 14400000),
          customerRating: 4 + (i % 2),
          customerReview: ['Great service!', 'Very professional.', null][i],
        },
      });
    }

    console.log(`  Booking: ${status} — ${service.name} on ${bookingDates[i].toDateString()}`);
  }

  console.log('\n=== Seed complete! ===');
  console.log(`Tenant:       ${tenant.name}`);
  console.log(`Users:        ${[admin, customer, ...workers].length}`);
  console.log(`Services:     ${services.length}`);
  console.log(`Bookings:     ${bookingDates.length}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
