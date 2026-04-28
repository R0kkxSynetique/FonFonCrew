import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { getAllUsers, createUser, updateUser, updateUserRole, deleteUser } from '../controllers/userController.js';

const router = Router();

// Protect all /api/users routes with SUPERADMIN role requirement
router.use(verifyToken);
router.use(requireRole(['SUPERADMIN']));

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:userId', updateUser);
router.put('/:userId/role', updateUserRole);
router.delete('/:userId', deleteUser);

export default router;
