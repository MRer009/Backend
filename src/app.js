import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "32kb" })); // Limit the size of incoming JSON payloads to 32KB
//url encoded use because of the ehrn url frtched then the decoading like bhargav+sojitra
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // Parse URL-encoded data with the text/plain type

app.use(express.static('public'))

app.use(cookieParser());


export { app };
