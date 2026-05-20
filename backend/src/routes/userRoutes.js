import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { getAllUsers, createUser, updateUser, updateUserRole, deleteUser, searchUsers } from '../controllers/userController.js';

const router = Router();

router.use(verifyToken);

// Search endpoint accessible to ORGANIZER and SUPERADMIN
router.get('/search', requireRole(['ORGANIZER', 'SUPERADMIN']), searchUsers);

// Protect all other /api/users routes with SUPERADMIN role requirement
router.use(requireRole(['SUPERADMIN']));

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:userId', updateUser);
router.put('/:userId/role', updateUserRole);
router.delete('/:userId', deleteUser);

export default router;
