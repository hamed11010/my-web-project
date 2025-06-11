import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('MongoDB URI:', process.env.MONGODB_URI);
        
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log('Database name:', conn.connection.name);
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
};

export default connectDB; 