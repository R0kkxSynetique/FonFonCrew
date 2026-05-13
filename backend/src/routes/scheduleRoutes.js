import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { createScheduleSlot, subscribeToSlot, unsubscribeFromSlot, getSlotAttendees, updateScheduleSlot, deleteScheduleSlot } from '../controllers/scheduleController.js';

const router = Router();

// Organizers / Admin
router.post('/', verifyToken, requireRole(['ORGANIZER', 'SUPERADMIN']), createScheduleSlot);
router.get('/:slotId/attendees', verifyToken, requireRole(['ORGANIZER', 'SUPERADMIN']), getSlotAttendees);
router.put('/:slotId', verifyToken, requireRole(['ORGANIZER', 'SUPERADMIN']), updateScheduleSlot);
router.delete('/:slotId', verifyToken, requireRole(['ORGANIZER', 'SUPERADMIN']), deleteScheduleSlot);

// Any authenticated user can sign up/down
router.post('/:slotId/subscriptions', verifyToken, subscribeToSlot);
router.delete('/:slotId/subscriptions', verifyToken, unsubscribeFromSlot);

export default router;
