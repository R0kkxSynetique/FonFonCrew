import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a schedule slot for an event
export const createScheduleSlot = async (req, res) => {
  try {
    const { event_id, title, description, location, start_time, end_time, capacity, requirements } = req.body;
    
    // Verify event ownership
    const event = await prisma.event.findUnique({ where: { id: parseInt(event_id) } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizer_id !== req.user.userId && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const slot = await prisma.scheduleSlot.create({
      data: {
        event_id: parseInt(event_id),
        title: title || 'Volunteer Shift',
        description: description || null,
        location: location || null,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        capacity: parseInt(capacity),
        requirements: requirements || null
      }
    });
    res.status(201).json(slot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create schedule slot' });
  }
};

// Volunteer subscribing to a slot
export const subscribeToSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const userId = req.user.userId;

    const slot = await prisma.scheduleSlot.findUnique({
      where: { id: parseInt(slotId) },
      include: { subscriptions: true }
    });

    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    if (slot.subscriptions.length >= slot.capacity) {
      return res.status(400).json({ error: 'Slot is full' });
    }

    const existingSub = await prisma.subscription.findUnique({
      where: { user_id_schedule_slot_id: { user_id: userId, schedule_slot_id: parseInt(slotId) } }
    });
    
    if (existingSub) {
      return res.status(400).json({ error: 'Already subscribed to this slot' });
    }

    const subscription = await prisma.subscription.create({
      data: {
        user_id: userId,
        schedule_slot_id: parseInt(slotId)
      }
    });

    res.status(201).json(subscription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
};

// Volunteer unsubscribing from a slot
export const unsubscribeFromSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const userId = req.user.userId;

    await prisma.subscription.delete({
      where: { user_id_schedule_slot_id: { user_id: userId, schedule_slot_id: parseInt(slotId) } }
    });

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).json({ error: error.message || 'Failed to unsubscribe' });
  }
};

// Organizer fetching volunteers for a slot
export const getSlotAttendees = async (req, res) => {
  try {
    const { slotId } = req.params;
    
    const slot = await prisma.scheduleSlot.findUnique({
      where: { id: parseInt(slotId) },
      include: { event: true }
    });

    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    
    // Check auth
    if (slot.event.organizer_id !== req.user.userId && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { schedule_slot_id: parseInt(slotId) },
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

// Organizer updating a schedule slot
export const updateScheduleSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { title, description, location, start_time, end_time, capacity, requirements } = req.body;
    
    const slot = await prisma.scheduleSlot.findUnique({
      where: { id: parseInt(slotId) },
      include: { event: true }
    });

    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    if (slot.event.organizer_id !== req.user.userId && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedSlot = await prisma.scheduleSlot.update({
      where: { id: parseInt(slotId) },
      data: {
        title,
        description,
        location,
        start_time: start_time ? new Date(start_time) : undefined,
        end_time: end_time ? new Date(end_time) : undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
        requirements
      }
    });

    res.json(updatedSlot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update schedule slot' });
  }
};

// Organizer deleting a schedule slot
export const deleteScheduleSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    
    const slot = await prisma.scheduleSlot.findUnique({
      where: { id: parseInt(slotId) },
      include: { event: true }
    });

    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    if (slot.event.organizer_id !== req.user.userId && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.scheduleSlot.delete({ where: { id: parseInt(slotId) } });
    
    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete schedule slot' });
  }
};
