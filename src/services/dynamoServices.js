import {
  DynamoDBClient,
  ScanCommand,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { getSecrets } from "../utils/secrets.js";

const initDynamoDBClient = async () => {
  const secrets = await getSecrets();
  return new DynamoDBClient({
    region: secrets.AWS_DEFAULT_REGION,
    credentials: {
      accessKeyId: secrets.AWS_ACCESS_KEY_ID,
      secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
    },
  });
};

export const scanTable = async () => {
  const client = await initDynamoDBClient();
  const params = { TableName: "talopakettiin" };
  const data = await client.send(new ScanCommand(params));
  return data.Items.map((item) => unmarshall(item));
};

export const addItemToTable = async (item) => {
  const client = await initDynamoDBClient();
  const params = {
    TableName: "talopakettiin",
    Item: marshall(item),
  };
  await client.send(new PutItemCommand(params));
};

export const addApplicationToUser = async (item) => {
  const client = await initDynamoDBClient();
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
    TableName: "talopakettiin",
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

    const client = await initDynamoDBClient();
    const userId = user.userId;

    const params = {
      TableName: "talopakettiin",
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
