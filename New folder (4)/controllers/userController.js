import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';



// Get user profile
export const getUsers = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (user) return res.json(user);
  res.status(404).json({ message: 'User not found' });
};

// Update user profile
export const updateUser = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { name, email } = req.body;
  user.name = name || user.name;
  user.email = email || user.email;

  await user.save();
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};

// Admin: Get all users
export const getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

// Admin: Delete user
export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  await user.remove();
  res.json({ message: 'User removed' });
};

// Admin: Ban user
export const banUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.isBanned = true;
  user.banReason = req.body.reason || 'No reason specified';
  user.banDate = new Date();

  await user.save();
  res.json({ message: 'User banned successfully' });
};

// Admin: Unban user
export const unbanUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.isBanned = false;
  user.banReason = null;
  user.banDate = null;

  await user.save();
  res.json({ message: 'User unbanned successfully' });
};

// Admin: Get banned users
export const getBannedUsers = async (req, res) => {
  const bannedUsers = await User.find({ isBanned: true }).select('-password');
  res.json(bannedUsers);
};

// Verify token
export const verifyUserToken = async (req, res) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            console.log('❌ No token in cookies');
            return res.status(401).json({ message: 'No token found' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            console.log('❌ User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isBanned) {
            console.log('❌ User is banned');
            return res.status(403).json({ message: 'User is banned' });
        }

        console.log('✅ User verified:', user._id);
        res.json({ 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('❌ Token verification error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Verify admin
export const verifyAdminRole = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ 
            isAdmin: user.role === 'admin',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(500).json({ message: 'Server error during admin verification' });
    }
};

// Login user
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Check if user is banned
  if (user.isBanned) {
    return res.status(403).json({ message: 'Your account has been banned' });
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Create token with role
  const token = jwt.sign(
    { 
      id: user._id,
      role: user.role,
      isAdmin: user.isAdmin
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: '1d',
    }
  );

  // Set cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin
    },
  });
};
