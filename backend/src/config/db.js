const mongoose = require('mongoose');

const getMongoUri = () => {
    let uri = process.env.MONGO_URI;
    if (!uri) return uri;
    
    // If running under Jest or in a test environment, isolate to a test database
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
        if (uri.includes('?')) {
            const parts = uri.split('?');
            let dbPath = parts[0];
            const params = parts[1];
            if (dbPath.endsWith('/')) {
                dbPath += 'ssp_test';
            } else {
                const match = dbPath.match(/\/([a-zA-Z0-9_-]+)$/);
                if (match) {
                    const dbName = match[1];
                    dbPath = dbPath.substring(0, dbPath.length - dbName.length) + dbName + '_test';
                } else {
                    dbPath += '/ssp_test';
                }
            }
            return dbPath + '?' + params;
        } else {
            if (uri.endsWith('/')) {
                return uri + 'ssp_test';
            } else {
                const match = uri.match(/\/([a-zA-Z0-9_-]+)$/);
                if (match) {
                    return uri + '_test';
                } else {
                    return uri + '/ssp_test';
                }
            }
        }
    }
    return uri;
};

const connectDB = async () => {
    try {
        const uri = getMongoUri();
        const conn = await mongoose.connect(uri);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📦 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);

        if (error.message.includes('mongodb+srv URI cannot have port number')) {
            console.error('💡 TIP: Remove the port number from your MONGO_URI when using mongodb+srv:// protocol');
            console.error('💡 Example: mongodb+srv://user:pass@cluster.mongodb.net/dbname (no :27017)');
        }

        process.exit(1);
    }
};

module.exports = connectDB;
