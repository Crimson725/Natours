import mongoose from "mongoose";
import slugify from "slugify";
import { config } from "dotenv";
import Tour from "./models/tourModel.js";

config({ path: "./.env" });

const connectionString = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD,
);
const addSlugsToTours = async () => {
  try {
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
    });

    // Fetch all tours without a slug
    const tours = await Tour.find({ slug: { $exists: false } });

    // Generate a slug for each tour and update the document
    const updatePromises = tours.map(async (tour) => {
      tour.slug = slugify(tour.name, { lower: true });
      await tour.save(); // This will trigger any `pre('save')` middleware
    });

    // Execute all update promises
    await Promise.all(updatePromises);

    console.log("All tours have been updated with slugs.");
  } catch (error) {
    console.error("Error updating tours with slugs:", error);
  } finally {
    // Close the Mongoose connection
    mongoose.connection.close();
  }
};

addSlugsToTours();
