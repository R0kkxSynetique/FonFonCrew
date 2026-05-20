import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const addContact = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { user_id, purpose, contact_info } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
      include: { members: { where: { userId: req.user.userId } } }
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const isOwner = event.members[0]?.role === 'OWNER';
    const isSuperAdmin = req.user.role === 'SUPERADMIN';

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const newContact = await prisma.eventContact.create({
      data: {
        eventId: parseInt(eventId),
        userId: parseInt(user_id),
        purpose,
        contactInfo: contact_info
      },
      include: {
        user: { select: { id: true, firstname: true, lastname: true, email: true, phone: true } }
      }
    });

    res.status(201).json(newContact);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This user is already a contact for this event' });
    }
    res.status(500).json({ error: 'Failed to add contact' });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { eventId, contactId } = req.params;
    const { purpose, contact_info } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
      include: { members: { where: { userId: req.user.userId } } }
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const isOwner = event.members[0]?.role === 'OWNER';
    const isSuperAdmin = req.user.role === 'SUPERADMIN';

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedContact = await prisma.eventContact.update({
      where: { id: parseInt(contactId) },
      data: {
        purpose,
        contactInfo: contact_info
      },
      include: {
        user: { select: { id: true, firstname: true, lastname: true, email: true, phone: true } }
      }
    });

    res.json(updatedContact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { eventId, contactId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
      include: { members: { where: { userId: req.user.userId } } }
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const isOwner = event.members[0]?.role === 'OWNER';
    const isSuperAdmin = req.user.role === 'SUPERADMIN';

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.eventContact.delete({
      where: { id: parseInt(contactId) }
    });

    res.json({ message: 'Contact removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};
