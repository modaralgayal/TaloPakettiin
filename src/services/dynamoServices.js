import {
  DynamoDBClient,
  ScanCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const scanTable = async () => {
  const params = { TableName: process.env.TABLE_NAME };
  const data = await client.send(new ScanCommand(params));
  return data.Items.map((item) => unmarshall(item));
};

export const addItemToTable = async (item) => {
  const params = {
    TableName: process.env.TABLE_NAME,
    Item: marshall(item),
  };
  await client.send(new PutItemCommand(params));
};

export const addApplicationToUser = async (item) => {
  // Create a unique `id` for the application record
  const id = uuidv4(); // Generate a unique UUID for the `id` field
  
  // Prepare the item data to match the DynamoDB table schema
  const applicationData = {
    id: id, // Unique identifier for the application record
    userId: item.userId, // Store the userId (from JWT sub claim)
    createdAt: new Date().toISOString(), // Add the current timestamp
    username: item.username, // Include the username (from JWT)
    formData: item.formData, // The actual form data
  };

  // Log the item to verify the structure before sending it to DynamoDB
  console.log("Adding to DynamoDB:", applicationData);

  const params = {
    TableName: process.env.TABLE_NAME,
    Item: marshall(applicationData),  // Marshall the item into DynamoDB format
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log("Form data successfully added to DynamoDB.");
  } catch (error) {
    console.error("Error adding to DynamoDB:", error);
  }
};
