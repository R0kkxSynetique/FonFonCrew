import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const superadminEmail = 'admin@test.com';
  const superadminPasswordHash = await bcrypt.hash('Pa$$w0rd', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: superadminEmail },
    update: {
      firstname: 'Admin',
      lastname: 'User',
      passwordHash: superadminPasswordHash,
      globalRole: 'SUPERADMIN',
    },
    create: {
      firstname: 'Admin',
      lastname: 'User',
      email: superadminEmail,
      passwordHash: superadminPasswordHash,
      globalRole: 'SUPERADMIN',
    },
  });
  console.log(`✅ Superadmin user upserted: ${adminUser.email}`);

  const volunteer1Email = 'alice@test.com';
  const volunteerPasswordHash = await bcrypt.hash('Pa$$w0rd', 10);

  const volunteer1 = await prisma.user.upsert({
    where: { email: volunteer1Email },
    update: {
      firstname: 'Alice',
      lastname: 'Smith',
      passwordHash: volunteerPasswordHash,
      globalRole: 'USER',
    },
    create: {
      firstname: 'Alice',
      lastname: 'Smith',
      email: volunteer1Email,
      passwordHash: volunteerPasswordHash,
      globalRole: 'USER',
    },
  });
  console.log(`✅ Volunteer user upserted: ${volunteer1.email}`);

  const volunteer2Email = 'bob@test.com';
  const volunteer2 = await prisma.user.upsert({
    where: { email: volunteer2Email },
    update: {
      firstname: 'Bob',
      lastname: 'Jones',
      passwordHash: volunteerPasswordHash,
      globalRole: 'USER',
    },
    create: {
      firstname: 'Bob',
      lastname: 'Jones',
      email: volunteer2Email,
      passwordHash: volunteerPasswordHash,
      globalRole: 'USER',
    },
  });
  console.log(`✅ Volunteer user upserted: ${volunteer2.email}`);

  const eventName = 'Baptême de l\'air pour Doudous 2026';
  const startDate = new Date('2026-08-22T08:00:00Z');
  const endDate = new Date('2026-08-22T18:00:00Z');

  let event = await prisma.event.findFirst({
    where: { name: eventName },
  });

  if (!event) {
    event = await prisma.event.create({
      data: {
        name: eventName,
        description: 'Événement de découverte du monde de l\'aviation pour les enfants',
        startDate,
        endDate,
        locationName: 'Aérodrome de Prangins, LSGP',
        locationLat: 46.406147062956556,
        locationLng: 6.258203859767248,
        settings: {
          showVolunteers: true,
        },
      },
    });
    console.log(`✅ Event created: "${event.name}"`);
  } else {
    console.log(`ℹ️ Event "${event.name}" already exists, skipping creation.`);
  }

  await prisma.eventMembership.upsert({
    where: {
      userId_eventId: {
        userId: adminUser.id,
        eventId: event.id,
      },
    },
    update: { role: 'OWNER' },
    create: {
      userId: adminUser.id,
      eventId: event.id,
      role: 'OWNER',
    },
  });

  await prisma.eventMembership.upsert({
    where: {
      userId_eventId: {
        userId: volunteer1.id,
        eventId: event.id,
      },
    },
    update: { role: 'COORDINATOR' },
    create: {
      userId: volunteer1.id,
      eventId: event.id,
      role: 'COORDINATOR',
    },
  });

  await prisma.eventMembership.upsert({
    where: {
      userId_eventId: {
        userId: volunteer2.id,
        eventId: event.id,
      },
    },
    update: { role: 'VOLUNTEER' },
    create: {
      userId: volunteer2.id,
      eventId: event.id,
      role: 'VOLUNTEER',
    },
  });
  console.log(`✅ Event memberships upserted for core users.`);

  const shifts = [
    {
      title: 'Mise en place des postes',
      description: 'Mise en place des stands pour l\'événement',
      startTime: new Date('2026-08-22T07:00:00Z'),
      endTime: new Date('2026-08-22T10:00:00Z'),
      capacity: 5,
      requirements: 'Être capable de soulever 15kg.',
    },
    {
      title: 'Accueil des enfants et famille',
      description: 'Accueil des enfants et famille',
      startTime: new Date('2026-08-22T07:00:00Z'),
      endTime: new Date('2026-08-22T16:00:00Z'),
      capacity: 3,
      requirements: 'Aisance relationnelle, contact enfant',
    },
    {
      title: 'Restauration équipage',
      description: 'Restauration équipage',
      startTime: new Date('2026-08-22T18:00:00Z'),
      endTime: new Date('2026-08-22T22:00:00Z'),
      capacity: 4,
      requirements: 'Sens du service',
    },
  ];

  for (const shift of shifts) {
    const existingSlot = await prisma.scheduleSlot.findFirst({
      where: {
        eventId: event.id,
        title: shift.title,
        startTime: shift.startTime,
      },
    });

    if (!existingSlot) {
      await prisma.scheduleSlot.create({
        data: {
          eventId: event.id,
          title: shift.title,
          description: shift.description,
          startTime: shift.startTime,
          endTime: shift.endTime,
          capacity: shift.capacity,
          requirements: shift.requirements,
        },
      });
      console.log(`✅ Schedule slot created: "${shift.title}"`);
    }
  }

  const slotPostes = await prisma.scheduleSlot.findFirst({ where: { title: "Mise en place des postes", eventId: event.id } });
  const slotAccueil = await prisma.scheduleSlot.findFirst({ where: { title: "Accueil des enfants et famille", eventId: event.id } });
  const slotResto = await prisma.scheduleSlot.findFirst({ where: { title: "Restauration équipage", eventId: event.id } });

  const subscriptionsToSeed = [
    { userId: volunteer1.id, scheduleSlotId: slotAccueil.id, createdAt: new Date("2026-05-20T08:57:16.000Z") },
    { userId: volunteer2.id, scheduleSlotId: slotPostes.id, createdAt: new Date("2026-05-20T08:57:34.000Z") },
    { userId: volunteer2.id, scheduleSlotId: slotResto.id, createdAt: new Date("2026-05-20T08:57:39.000Z") },
  ];

  for (const sub of subscriptionsToSeed) {
    if (sub.userId && sub.scheduleSlotId) {
      await prisma.subscription.upsert({
        where: {
          userId_scheduleSlotId: {
            userId: sub.userId,
            scheduleSlotId: sub.scheduleSlotId
          }
        },
        update: {},
        create: {
          userId: sub.userId,
          scheduleSlotId: sub.scheduleSlotId,
          createdAt: sub.createdAt
        }
      });
      console.log(`✅ Subscription created: User ${sub.userId} to Slot ${sub.scheduleSlotId}`);
    }
  }

  console.log('🌱 Seeding process complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
