import mongoose from "mongoose";
import { configDotenv } from "dotenv";
import fs from "fs";
import Tour from "../../models/tourModel.js";

configDotenv({
  path: "../.././.env",
});
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("DB connection successful");
    // console.log(con.connections);
  });
const tours = JSON.parse(fs.readFileSync("tours-simple.json", "utf-8"));
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log("Data successfully loaded!");
    process.exit();
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
//Delete all data from DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log("Data successfully deleted!");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
