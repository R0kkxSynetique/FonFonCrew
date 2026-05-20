import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createEvent = async (req, res) => {
  try {
    if (!['ORGANIZER', 'SUPERADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, description, start_date, end_date, location_name, location_lat, location_lng, show_volunteers } = req.body;
    const event = await prisma.event.create({
      data: {
        name,
        description,
        startDate: new Date(start_date),
        endDate: new Date(end_date),
        locationName: location_name,
        locationLat: location_lat ? parseFloat(location_lat) : null,
        locationLng: location_lng ? parseFloat(location_lng) : null,
        settings: {
          showVolunteers: show_volunteers ?? false
        },
        members: {
          create: {
            userId: req.user.userId,
            role: 'OWNER'
          }
        }
      }
    });
    
    res.status(201).json({
      id: event.id,
      name: event.name,
      description: event.description,
      start_date: event.startDate,
      end_date: event.endDate,
      location_name: event.locationName,
      location_lat: event.locationLat,
      location_lng: event.locationLng,
      show_volunteers: event.settings?.showVolunteers ?? false,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        members: {
          where: { role: 'OWNER' },
          include: {
            user: { select: { firstname: true, lastname: true } }
          }
        },
        schedules: true
      },
      orderBy: { startDate: 'asc' }
    });
    
    const mappedEvents = events.map(event => {
      const ownerMember = event.members[0];
      const organizer = ownerMember ? {
        firstname: ownerMember.user.firstname,
        lastname: ownerMember.user.lastname
      } : null;

      return {
        id: event.id,
        name: event.name,
        description: event.description,
        start_date: event.startDate,
        end_date: event.endDate,
        location_name: event.locationName,
        location_lat: event.locationLat,
        location_lng: event.locationLng,
        show_volunteers: event.settings?.showVolunteers ?? false,
        organizer: organizer,
        organizer_id: ownerMember ? ownerMember.userId : null,
        schedules: event.schedules.map(slot => ({
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
          createdAt: slot.createdAt
        })),
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      };
    });

    res.json(mappedEvents);
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
        members: {
          where: { role: 'OWNER' },
          include: {
            user: { select: { firstname: true, lastname: true, email: true, phone: true } }
          }
        },
        schedules: { 
          orderBy: { startTime: 'asc' },
          include: {
            subscriptions: { 
              include: {
                user: { select: { id: true, firstname: true, lastname: true, email: true } }
              }
            }
          }
        }
      }
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const ownerMember = event.members[0];
    const organizer = ownerMember ? {
      firstname: ownerMember.user.firstname,
      lastname: ownerMember.user.lastname,
      email: ownerMember.user.email,
      phone: ownerMember.user.phone
    } : null;

    res.json({
      id: event.id,
      name: event.name,
      description: event.description,
      start_date: event.startDate,
      end_date: event.endDate,
      location_name: event.locationName,
      location_lat: event.locationLat,
      location_lng: event.locationLng,
      show_volunteers: event.settings?.showVolunteers ?? false,
      organizer: organizer,
      organizer_id: ownerMember ? ownerMember.userId : null,
      schedules: event.schedules.map(slot => ({
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
        subscriptions: slot.subscriptions.map(sub => ({
          id: sub.id,
          userId: sub.userId,
          scheduleSlotId: sub.scheduleSlotId,
          createdAt: sub.createdAt,
          user: sub.user
        })),
        createdAt: slot.createdAt
      })),
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, start_date, end_date, location_name, location_lat, location_lng, show_volunteers } = req.body;
    
    const event = await prisma.event.findUnique({ 
      where: { id: parseInt(id) },
      include: {
        members: {
          where: { userId: req.user.userId }
        }
      }
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const userMembership = event.members[0];
    const isOwner = userMembership?.role === 'OWNER';
    const isSuperAdmin = req.user.role === 'SUPERADMIN';

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedSettings = {
      ...(event.settings || {}),
      ...(show_volunteers !== undefined ? { showVolunteers: show_volunteers } : {})
    };

    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        startDate: start_date ? new Date(start_date) : undefined,
        endDate: end_date ? new Date(end_date) : undefined,
        locationName: location_name,
        locationLat: location_lat !== undefined ? parseFloat(location_lat) : undefined,
        locationLng: location_lng !== undefined ? parseFloat(location_lng) : undefined,
        settings: updatedSettings
      }
    });

    res.json({
      id: updatedEvent.id,
      name: updatedEvent.name,
      description: updatedEvent.description,
      start_date: updatedEvent.startDate,
      end_date: updatedEvent.endDate,
      location_name: updatedEvent.locationName,
      location_lat: updatedEvent.locationLat,
      location_lng: updatedEvent.locationLng,
      show_volunteers: updatedEvent.settings?.showVolunteers ?? false,
      createdAt: updatedEvent.createdAt,
      updatedAt: updatedEvent.updatedAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await prisma.event.findUnique({ 
      where: { id: parseInt(id) },
      include: {
        members: {
          where: { userId: req.user.userId }
        }
      }
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const userMembership = event.members[0];
    const isOwner = userMembership?.role === 'OWNER';
    const isSuperAdmin = req.user.role === 'SUPERADMIN';

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.event.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};
