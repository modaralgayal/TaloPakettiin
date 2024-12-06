import {
  DynamoDBClient,
  ScanCommand,
  PutItemCommand,
  QueryCommand,
  DeleteItemCommand,
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

  // Ensure the entryId is a string
  const applicationData = {
    id,
    userId: item.userId,
    username: item.username,
    entryId: String(item.entryId), // Convert entryId to string
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
  console.log("Trying to fetch all entries");
  console.log("This is the usertype in the request: ", req.user.usertype);
  try {
    if (req.user.usertype != "provider") {
      return res
        .status(403)
        .json({ error: "Access denied: User is not a provider" });
    }
    console.log("got here");
    const client = await initDynamoDBClient();

    const params = {
      TableName: "Talopakettiin-API",
      ProjectionExpression: "entryId, userId",
    };

    const command = new ScanCommand(params);
    const data = await client.send(command);

    const result = data.Items.map((item) => ({
      entryId: item.entryId.S,
      userId: item.userId.S,
    }));
    console.log("Fetched entries:", result);

    res.status(200).json({ entries: result });
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
};

export const deleteItemByEntryId = async (req, res) => {
  const { entryIdToDelete } = req.body;
  console.log("Attempting to delete item with entryId: ", entryIdToDelete);

  const client = await initDynamoDBClient();

  const queryParams = {
    TableName: "Talopakettiin-API",
    IndexName: "entryId-userId-index",
    KeyConditionExpression: "entryId = :entryId",
    ExpressionAttributeValues: {
      ":entryId": { S: entryIdToDelete.toString() },
    },
  };

  try {
    const data = await client.send(new QueryCommand(queryParams));

    if (data.Items && data.Items.length > 0) {
      const item = unmarshall(data.Items[0]);
      const idToDelete = item.id;

      const deleteParams = {
        TableName: "Talopakettiin-API",
        Key: {
          id: { S: idToDelete },
        },
      };

      await client.send(new DeleteItemCommand(deleteParams));
      console.log(`Successfully deleted item with entryId: ${entryIdToDelete}`);
      res.status(200).json({
        message: `Successfully deleted item with entryId: ${entryIdToDelete}`,
      });
    } else {
      console.log(`No item found with entryId: ${entryIdToDelete}`);
      res.status(404).json({
        error: `No item found with entryId: ${entryIdToDelete}`,
      });
    }
  } catch (error) {
    console.error(
      `Error deleting item with entryId: ${entryIdToDelete}`,
      error
    );
    res.status(500).json({
      error: `Failed to delete item with entryId: ${entryIdToDelete}`,
    });
  }
};
