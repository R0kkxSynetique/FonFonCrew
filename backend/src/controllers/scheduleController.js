import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to check if a user is an Owner or Coordinator for a given event, or a global SUPERADMIN
async function checkEventPermission(userId, globalRole, eventId) {
  if (globalRole === 'SUPERADMIN') return true;

  const membership = await prisma.eventMembership.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId
      }
    }
  });

  return membership && (membership.role === 'OWNER' || membership.role === 'COORDINATOR');
}

export const createScheduleSlot = async (req, res) => {
  try {
    const { event_id, title, description, location, start_time, end_time, capacity, requirements, buffer_before, buffer_after, show_buffer } = req.body;
    const parsedEventId = parseInt(event_id);

    const event = await prisma.event.findUnique({ where: { id: parsedEventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const hasPermission = await checkEventPermission(req.user.userId, req.user.role, parsedEventId);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const slot = await prisma.scheduleSlot.create({
      data: {
        eventId: parsedEventId,
        title: title || 'Volunteer Shift',
        description: description || null,
        location: location || null,
        startTime: new Date(start_time),
        endTime: new Date(end_time),
        capacity: parseInt(capacity),
        requirements: requirements || null,
        bufferBefore: buffer_before ? parseInt(buffer_before) : 0,
        bufferAfter: buffer_after ? parseInt(buffer_after) : 0,
        showBuffer: show_buffer !== undefined ? Boolean(show_buffer) : false
      }
    });

    res.status(201).json({
      id: slot.id,
      eventId: slot.eventId,
      title: slot.title,
      description: slot.description,
      location: slot.location,
      start_time: slot.startTime,
      end_time: slot.endTime,
      capacity: slot.capacity,
      requirements: slot.requirements,
      buffer_before: slot.bufferBefore,
      buffer_after: slot.bufferAfter,
      show_buffer: slot.showBuffer,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create schedule slot' });
  }
};

export const subscribeToSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const userId = req.user.userId;
    const parsedSlotId = parseInt(slotId);

    const slot = await prisma.scheduleSlot.findUnique({
      where: { id: parsedSlotId },
      include: { subscriptions: true }
    });

    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    if (slot.subscriptions.length >= slot.capacity) {
      return res.status(400).json({ error: 'Slot is full' });
    }

    const existingSub = await prisma.subscription.findUnique({
      where: {
        userId_scheduleSlotId: {
          userId,
          scheduleSlotId: parsedSlotId
        }
      }
    });
    
    if (existingSub) {
      return res.status(400).json({ error: 'Already subscribed to this slot' });
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        scheduleSlotId: parsedSlotId
      }
    });

    res.status(201).json({
      id: subscription.id,
      userId: subscription.userId,
      schedule_slot_id: subscription.scheduleSlotId,
      createdAt: subscription.createdAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
};

export const unsubscribeFromSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const userId = req.user.userId;
    const parsedSlotId = parseInt(slotId);

    await prisma.subscription.delete({
      where: {
        userId_scheduleSlotId: {
          userId,
          scheduleSlotId: parsedSlotId
        }
      }
    });

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).json({ error: error.message || 'Failed to unsubscribe' });
  }
};

export const getSlotAttendees = async (req, res) => {
  try {
    const { slotId } = req.params;
    const parsedSlotId = parseInt(slotId);
    
    const slot = await prisma.scheduleSlot.findUnique({
      where: { id: parsedSlotId }
    });

    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    
    const hasPermission = await checkEventPermission(req.user.userId, req.user.role, slot.eventId);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { scheduleSlotId: parsedSlotId },
      include: {
        user: { select: { id: true, firstname: true, lastname: true, email: true, phone: true } }
      }
    });

    res.json(subscriptions.map(sub => sub.user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch attendees' });
  }
};

export const updateScheduleSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { title, description, location, start_time, end_time, capacity, requirements, buffer_before, buffer_after, show_buffer } = req.body;
    const parsedSlotId = parseInt(slotId);
    
    const slot = await prisma.scheduleSlot.findUnique({
      where: { id: parsedSlotId }
    });

    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    const hasPermission = await checkEventPermission(req.user.userId, req.user.role, slot.eventId);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedSlot = await prisma.scheduleSlot.update({
      where: { id: parsedSlotId },
      data: {
        title,
        description,
        location,
        startTime: start_time ? new Date(start_time) : undefined,
        endTime: end_time ? new Date(end_time) : undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
        requirements,
        bufferBefore: buffer_before !== undefined ? parseInt(buffer_before) : undefined,
        bufferAfter: buffer_after !== undefined ? parseInt(buffer_after) : undefined,
        showBuffer: show_buffer !== undefined ? Boolean(show_buffer) : undefined
      }
    });

    res.json({
      id: updatedSlot.id,
      eventId: updatedSlot.eventId,
      title: updatedSlot.title,
      description: updatedSlot.description,
      location: updatedSlot.location,
      start_time: updatedSlot.startTime,
      end_time: updatedSlot.endTime,
      capacity: updatedSlot.capacity,
      requirements: updatedSlot.requirements,
      buffer_before: updatedSlot.bufferBefore,
      buffer_after: updatedSlot.bufferAfter,
      show_buffer: updatedSlot.showBuffer,
      createdAt: updatedSlot.createdAt,
      updatedAt: updatedSlot.updatedAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update schedule slot' });
  }
};

export const deleteScheduleSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const parsedSlotId = parseInt(slotId);
    
    const slot = await prisma.scheduleSlot.findUnique({
      where: { id: parsedSlotId }
    });

    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    const hasPermission = await checkEventPermission(req.user.userId, req.user.role, slot.eventId);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.scheduleSlot.delete({ where: { id: parsedSlotId } });
    
    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete schedule slot' });
  }
};
