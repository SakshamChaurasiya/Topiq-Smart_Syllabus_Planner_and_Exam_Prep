require('dotenv').config();
const mongoose = require('mongoose');

console.log("URI:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ CONNECTED");
    process.exit(0);
})
.catch(err => {
    console.error("❌ FULL ERROR:");
    console.error(err);
    process.exit(1);
});