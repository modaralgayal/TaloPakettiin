import { scanTable, addItemToTable } from "../services/dynamoServices.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const addApplicationForm = async (req, res) => {
  try {
    const userId = req.user;
    const application = req.body.application;

    console.log("This is user Id: ", userId);
    console.log("This is the application: ", application);

    const Item = {
      id: uuidv4(),
      username: userId.username,
      clientId: userId.clientId,
      Applications: application,
      createdAt: new Date().toISOString(),
    };

    await addItemToTable(Item);

    res.status(201).json({ message: "Application form added successfully!" });
  } catch (error) {
    console.error("Error adding application form:", error);
    res.status(500).json({ error: "Failed to add application form" });
  }
};
// Untested, Test it later // hello
export const getItemsByClientId = async (clientId) => {
  const params = {
    TableName: process.env.TABLE_NAME,
    FilterExpression: "clientId = :clientId",
    ExpressionAttributeValues: {
      ":clientId": clientId,
    },
  };

  try {
    const command = new ScanCommand(params);
    const data = await client.send(command);
    return data.Items;
  } catch (error) {
    console.error("Error fetching items by clientId:", error);
    throw new Error("Failed to fetch items");
  }
};

// Function to sanitize field names (keys)
const sanitizeFieldName = (fieldName) => {
  return fieldName
    .replace(/[ä]/g, 'a')
    .replace(/[ö]/g, 'o')
    .replace(/[å]/g, 'a')
    .replace(/[ü]/g, 'u')
    .replace(/[ß]/g, 'ss')
    .replace(/\s+/g, '_')  
    .replace(/[^a-zA-Z0-9_]/g, '');
};

// Function to clean multiple-choice answers (split by newline)
const cleanMultipleChoiceAnswers = (value) => {
  if (typeof value === 'string' && value.includes('\n')) {
    return value.split('\n').map(item => item.trim());
  }
  return value;
};

export const receiveFormData = async (req, res) => {
  try {
    const rawFormData = req.body; 
    const token = req.cookies.jwtToken; 
    console.log(token)
    console.log("Received form data:", rawFormData);
    const sanitizedFormData = {};
    for (let field in rawFormData) {
      if (rawFormData.hasOwnProperty(field)) {
        const sanitizedFieldName = sanitizeFieldName(field);
        const cleanedValue = cleanMultipleChoiceAnswers(rawFormData[field]);
        sanitizedFormData[sanitizedFieldName] = cleanedValue;
      }
    }

    console.log("Sanitized form data:", sanitizedFormData);

    res.status(200).json({ success: true, data: sanitizedFormData });
  } catch (error) {
    console.error("Error cleaning form data:", error);
    res.status(500).json({ error: "An error occurred while cleaning form data." });
  }
};
