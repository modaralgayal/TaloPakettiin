import {
  DynamoDBClient,
  ScanCommand,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { v4 as uuidv4 } from "uuid";

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
  const id = uuidv4();

  const applicationData = {
    id, 
    userId: item.userId, 
    username: item.username, 
    entryId: item.entryId, 
    createdAt: new Date().toISOString(),
  };

  console.log("Adding to DynamoDB:", applicationData);

  const params = {
    TableName: process.env.TABLE_NAME,
    Item: marshall(applicationData), 
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log("Form ID successfully logged in DynamoDB.");
  } catch (error) {
    console.error("Error adding Form ID to DynamoDB:", error);
  }
};

export const getApplicationsForUser = async (req, res) => {
  try {
    const user = req.user;
    console.log("Authenticated User:", user);
    console.log("Authenticated User ID (sub):", user.userId);

    const userId = user.userId;

    const params = {
      TableName: process.env.TABLE_NAME,
      IndexName: "userId-index", 
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": { S: userId },
      },
    };

    const data = await client.send(new QueryCommand(params));

    const applications = data.Items
      ? data.Items.map((item) => unmarshall(item))
      : [];

    console.log("Fetched Applications:", applications);

    res.json({ success: true, applications });
  } catch (error) {
    console.error("Error fetching applications for user:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch applications" });
  }
};
