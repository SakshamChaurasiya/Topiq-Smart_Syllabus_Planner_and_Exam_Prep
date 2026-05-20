const express = require("express");
const connectDb = require("./config/db");
const dotenv = require("dotenv");

dotenv.config();

//MongoDB connection
connectDb();

const app = express();

const PORT = process.env.PORT || 5000;

//ENDPOINTS
app.use("/health", (req, res) => {
    res.status(200).json({
        message: "Server is healthy"
    })
})


app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});