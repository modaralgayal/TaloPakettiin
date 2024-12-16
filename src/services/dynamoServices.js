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

  console.log("Adding to DynamoDB:", item);

  const params = {
    TableName: "Talopakettiin-API",
    Item: marshall({ ...item, id }),
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

export const getOffersForUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const client = await initDynamoDBClient();

    console.log("User ID:", userId);

    const applicationParams = {
      TableName: "Talopakettiin-API",
      IndexName: "userId-index",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": { S: userId },
      },
    };

    const applicationCommand = new QueryCommand(applicationParams);
    console.log("Application Params:", applicationParams);

    const applicationData = await client.send(applicationCommand);
    console.log("Application Data:", JSON.stringify(applicationData, null, 2));

    // Safely extract entryId values
    const applicationIds = applicationData.Items.map(
      (item) => item.entryId?.S
    ).filter((entryId) => entryId !== undefined); // Remove undefined values
    console.log("Application IDs:", applicationIds);

    if (applicationIds.length === 0) {
      return res.status(200).json({ offers: [] });
    }

    let offers = [];

    for (const entryId of applicationIds) {
      const offerParams = {
        TableName: "Talopakettiin-API",
        IndexName: "entryType-entryId-index",
        KeyConditionExpression: "entryType = :entryType AND entryId = :entryId",
        ExpressionAttributeValues: {
          ":entryType": { S: "offer" },
          ":entryId": { S: entryId },
        },
      };

      const offerCommand = new QueryCommand(offerParams);
      const offerData = await client.send(offerCommand);
      console.log("Offer Params:", offerParams);
      console.log("Offer Data:", JSON.stringify(offerData, null, 2));

      if (offerData.Items?.length > 0) {
        // Map all attributes for each item
        const mappedOffers = offerData.Items.map((item) => {
          const attributes = {};
          for (const key in item) {
            // Dynamically handle both S (string) and N (number) types
            attributes[key] = item[key]?.S || item[key]?.N || null;
          }
          return attributes;
        });
        offers.push(...mappedOffers);
      } else {
        console.log(`No offers found for entryId: ${entryId}`);
      }
    }

    const cleanedEntry = JSON.stringify(offers, null, 2);

    console.log("Final Offers:", JSON.stringify(offers, null, 2));
    res.status(200).json({ cleanedEntry });
  } catch (error) {
    console.error("Error fetching offers for user:", error);
    res.status(500).json({ error: "Failed to fetch offers" });
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

export const acceptOffer = async (req, res) => {
  try {
    const dynamoDBClient = await initDynamoDBClient();

    const { id } = req.body.id;
    console.log("This is the body: ", req.body);
    const status = "Accepted";

    const params = {
      TableName: "Talopakettiin-API",
      Item: marshall({
        id: id,
        status: status,
      }),
    };

    const result = await dynamoDBClient.send(new PutItemCommand(params));

    res.json({
      success: true,
      message: "Offer accepted successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error accepting offer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept the offer.",
      error: error.message,
    });
  }
};
