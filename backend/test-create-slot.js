import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst();
  if (!event) {
    console.log("No events found");
    return;
  }
  await prisma.scheduleSlot.create({
    data: {
      event_id: event.id,
      title: "Test title",
      description: null,
      start_time: new Date(),
      end_time: new Date(),
      capacity: 5,
      requirements: null
    }
  });
  console.log("Slot created successfully");
}

main().catch(e => {
  console.error("Error connecting to DB or Prisma Validation:", e);
}).finally(() => prisma.$disconnect());
