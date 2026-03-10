import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createEvent = async (req, res) => {
  try {
    const { name, description, start_date, end_date, location_name, location_lat, location_lng } = req.body;
    const event = await prisma.event.create({
      data: {
        name,
        description,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        location_name,
        location_lat,
        location_lng,
        organizer_id: req.user.userId
      }
    });
    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        organizer: { select: { firstname: true, lastname: true } },
        schedules: true
      },
      orderBy: { start_date: 'asc' }
    });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        organizer: { select: { firstname: true, lastname: true, email: true, phone: true } },
        schedules: { orderBy: { start_time: 'asc' } }
      }
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, start_date, end_date, location_name, location_lat, location_lng } = req.body;
    
    // Check if user is organizer or admin
    const event = await prisma.event.findUnique({ where: { id: parseInt(id) } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.organizer_id !== req.user.userId && req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        location_name,
        location_lat,
        location_lng
      }
    });
    res.json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.event.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};
