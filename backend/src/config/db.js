const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // These options are no longer needed in Mongoose 6+ but kept for compatibility
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📦 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        
        // Provide helpful error messages
        if (error.message.includes('mongodb+srv URI cannot have port number')) {
            console.error('💡 TIP: Remove the port number from your MONGO_URI when using mongodb+srv:// protocol');
            console.error('💡 Example: mongodb+srv://user:pass@cluster.mongodb.net/dbname (no :27017)');
        }
        
        process.exit(1);
    }
};

module.exports = connectDB;
