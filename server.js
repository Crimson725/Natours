import mongoose from "mongoose";
import { config } from "dotenv";
import app from "./app.js";

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  process.exit(1);
});

config({ path: "./config.env" });
const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD,
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connection successful!"));
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION! Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});
process.on("SIGTERM", () => {
  console.log("SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("Process terminated!");
  });
}