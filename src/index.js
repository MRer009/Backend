// require('dotenv').config({path : './env'})
import dotenv from "dotenv";

import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});


connectDB();

/*
import express from "express";
const app = express();

// first approch
//proffetional approch iffe use and use async await and line start use senicollan

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", () => {
      console.log("ERROR", error);
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is running  on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("error", error);
  }
})();
*/
