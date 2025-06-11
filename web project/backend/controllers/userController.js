import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// User controller functions
export const registerUser = async (req, res) => {
    try {
        console.log('Registration attempt with data:', { ...req.body, password: '[REDACTED]' });
        
        const { name, email, password, phoneNumber, address, role } = req.body;

        // Validate role
        let userRole = 'user';
        if (role && (role === 'admin' || role === 'user')) {
            userRole = role;
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('Registration failed: User already exists with email:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        console.log('Creating new user...');
        const user = await User.create({
            name,
            email,
            password,
            phoneNumber,
            address,
            role: userRole
        });

        if (user) {
            console.log('User created successfully:', { id: user._id, email: user.email, role: user.role });
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const loginUser = async(req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                    expiresIn: '30d',
                }),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }};

export const getUserProfile = (req, res) => {
    res.send('Get user profile controller');
};

export const updateUserProfile = (req, res) => {
    res.send('Update user profile controller');
}; 