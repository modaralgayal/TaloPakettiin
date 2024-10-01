import { scanTable, addItemToTable } from "../services/dynamoServices.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const addApplicationForm = async (req, res) => {
  try {
    const userId = req.user; // Get user information from the JWT
    const application = req.body.application; // Get application data from the request body

    console.log("This is user Id: ", userId);
    console.log("This is the application: ", application);

    // Create a new item for the DynamoDB table
    const Item = {
      id: uuidv4(), // Generate a unique ID for this application
      username: userId.username, // Assuming userId is an object with a username property
      clientId: userId.clientId, // Assuming userId includes a clientId property as well
      Applications: application,
      createdAt: new Date().toISOString(), // Optionally add a timestamp for when the application was created
    };

    await addItemToTable(Item); // Call the function to add the item to the table

    res.status(201).json({ message: "Application form added successfully!" });
  } catch (error) {
    console.error("Error adding application form:", error);
    res.status(500).json({ error: "Failed to add application form" });
  }
};