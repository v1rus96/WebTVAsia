require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {

    await mongoose.connect(process.env.MONGO_DB_URL, {
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
