import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { createScheduleSlot, subscribeToSlot, unsubscribeFromSlot, getSlotAttendees } from '../controllers/scheduleController.js';

const router = Router();

// Organizers / Admin
router.post('/', verifyToken, requireRole(['ORGANIZER', 'SUPERADMIN']), createScheduleSlot);
router.get('/:slotId/attendees', verifyToken, requireRole(['ORGANIZER', 'SUPERADMIN']), getSlotAttendees);

// Accessible by any authenticated user for signing up/down
router.post('/:slotId/subscribe', verifyToken, subscribeToSlot);
router.delete('/:slotId/unsubscribe', verifyToken, unsubscribeFromSlot);

export default router;
