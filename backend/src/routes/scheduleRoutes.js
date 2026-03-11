import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { createScheduleSlot, subscribeToSlot, unsubscribeFromSlot, getSlotAttendees, updateScheduleSlot, deleteScheduleSlot } from '../controllers/scheduleController.js';

const router = Router();

// Organizers / Admin
router.post('/', verifyToken, requireRole(['ORGANIZER', 'SUPERADMIN']), createScheduleSlot);
router.get('/:slotId/attendees', verifyToken, requireRole(['ORGANIZER', 'SUPERADMIN']), getSlotAttendees);
router.put('/:slotId', verifyToken, requireRole(['ORGANIZER', 'SUPERADMIN']), updateScheduleSlot);
router.delete('/:slotId', verifyToken, requireRole(['ORGANIZER', 'SUPERADMIN']), deleteScheduleSlot);

// Accessible by any authenticated user for signing up/down
router.post('/:slotId/subscribe', verifyToken, subscribeToSlot);
router.delete('/:slotId/unsubscribe', verifyToken, unsubscribeFromSlot);

export default router;
