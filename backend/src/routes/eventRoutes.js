import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { createEvent, getEvents, getEventById, updateEvent, deleteEvent } from '../controllers/eventController.js';

const router = Router();

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected Organizer/Admin routes
router.post('/', verifyToken, requireRole(['ORGANIZER', 'SUPERADMIN']), createEvent);
router.put('/:id', verifyToken, requireRole(['ORGANIZER', 'SUPERADMIN']), updateEvent);
router.delete('/:id', verifyToken, requireRole(['SUPERADMIN']), deleteEvent);

export default router;
