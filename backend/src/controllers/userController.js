import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        globalRole: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(users.map(user => ({
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.globalRole,
      createdAt: user.createdAt
    })));
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { firstname, lastname, email, password, role } = req.body;
    
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const globalRole = role === 'SUPERADMIN' ? 'SUPERADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        firstname,
        lastname,
        email,
        passwordHash,
        globalRole,
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        globalRole: true,
        createdAt: true,
      }
    });

    res.status(201).json({
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.globalRole,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstname, lastname, email, role, password } = req.body;

    const dataToUpdate = {};
    if (firstname) dataToUpdate.firstname = firstname;
    if (lastname) dataToUpdate.lastname = lastname;
    if (email) dataToUpdate.email = email;
    if (role) {
      const validRoles = ['VOLUNTEER', 'ORGANIZER', 'SUPERADMIN'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role provided' });
      }
      dataToUpdate.globalRole = role === 'SUPERADMIN' ? 'SUPERADMIN' : 'USER';
    }
    
    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: dataToUpdate,
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        globalRole: true,
      }
    });

    res.json({
      id: updatedUser.id,
      firstname: updatedUser.firstname,
      lastname: updatedUser.lastname,
      email: updatedUser.email,
      role: updatedUser.globalRole
    });
  } catch (error) {
    console.error("Error updating user:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['VOLUNTEER', 'ORGANIZER', 'SUPERADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role provided' });
    }

    const globalRole = role === 'SUPERADMIN' ? 'SUPERADMIN' : 'USER';

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { globalRole },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        globalRole: true,
      }
    });

    res.json({
      id: updatedUser.id,
      firstname: updatedUser.firstname,
      lastname: updatedUser.lastname,
      email: updatedUser.email,
      role: updatedUser.globalRole
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (parseInt(userId) === req.user.userId) {
       return res.status(400).json({ error: "You cannot delete your own account this way." });
    }

    await prisma.user.delete({
      where: { id: parseInt(userId) },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
