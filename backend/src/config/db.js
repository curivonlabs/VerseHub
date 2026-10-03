import mongoose from "mongoose";

import env from "./env.js";

const connectDB = async () => {
  try {
    await mongoose.connect(env.database.dbURL);

    console.log(`Server Connected Successfully!`);
  } catch (error) {
    console.log("Error Connecting to Database: ", error);
    process.exit(1);
  }
}

export default connectDB;