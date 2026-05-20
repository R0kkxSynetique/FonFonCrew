import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent } from '../controllers/eventController.js';

const router = Router();

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected Organizer/Admin routes
router.post('/', verifyToken, createEvent);
router.put('/:id', verifyToken, updateEvent);
router.delete('/:id', verifyToken, deleteEvent);

export default router;
