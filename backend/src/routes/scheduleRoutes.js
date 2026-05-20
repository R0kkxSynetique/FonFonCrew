import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { createScheduleSlot, subscribeToSlot, unsubscribeFromSlot, getSlotAttendees, updateScheduleSlot, deleteScheduleSlot } from '../controllers/scheduleController.js';

const router = Router();

// Organizers / Admin
router.post('/', verifyToken, createScheduleSlot);
router.get('/:slotId/attendees', verifyToken, getSlotAttendees);
router.put('/:slotId', verifyToken, updateScheduleSlot);
router.delete('/:slotId', verifyToken, deleteScheduleSlot);

// Any authenticated user can sign up/down
router.post('/:slotId/subscriptions', verifyToken, subscribeToSlot);
router.delete('/:slotId/subscriptions', verifyToken, unsubscribeFromSlot);

export default router;
