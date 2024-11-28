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
    TableName: "Talopakettiin-API",
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
    const userId = req.user.userId;
    const client = await initDynamoDBClient();

    const params = {
      TableName: "Talopakettiin-API",
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": { S: userId },
      },
    };

    const command = new QueryCommand(params);
    const data = await client.send(command);
    const applications = data.Items.map((item) => item.entryId.S);

    console.log(applications);
    res.status(200).json({ applications });
  } catch (error) {
    console.error("Error fetching applications for user:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

export const getAllEntryIds = async (req, res) => {
  try {
    const client = await initDynamoDBClient();

    const params = {
      TableName: "Talopakettiin-API",
      ProjectionExpression: "entryId, userId",
    };

    const command = new ScanCommand(params);
    const data = await client.send(command);

    console.log("Fetched entries:", data.Items);

    const result = data.Items.map((item) => ({
      entryId: item.entryId.S,
      userId: item.userId.S,
    }));

    res.status(200).json({ entries: result });
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
};
