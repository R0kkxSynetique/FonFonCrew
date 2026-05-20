import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { addContact, updateContact, deleteContact } from '../controllers/contactController.js';

const router = Router();

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected Organizer/Admin routes
router.post('/', verifyToken, createEvent);
router.put('/:id', verifyToken, updateEvent);
router.delete('/:id', verifyToken, deleteEvent);

router.post('/:eventId/contacts', verifyToken, addContact);
router.put('/:eventId/contacts/:contactId', verifyToken, updateContact);
router.delete('/:eventId/contacts/:contactId', verifyToken, deleteContact);

export default router;
