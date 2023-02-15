const mongoose = require("mongoose");

async function connectDb() {
  try{
    await mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?authSource=admin`);
    console.log(`connect db success`);
  } catch (e) {
    console.log(`connect db fail with error: ${e.toString()}`)
  }
}

module.exports = {connectDb}