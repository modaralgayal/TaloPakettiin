import {
  addItemToTable,
  addApplicationToUser,
} from "../services/dynamoServices.js";
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { getSecrets } from "../utils/secrets.js";

let secrets;
(async () => {
  secrets = await getSecrets();
})();

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

    await addItemToTable(Item, secrets.TABLE_NAME);

    res.status(201).json({ message: "Application form added successfully!" });
  } catch (error) {
    console.error("Error adding application form:", error);
    res.status(500).json({ error: "Failed to add application form" });
  }
};

export const getItemsByClientId = async (clientId) => {
  try {
    const params = {
      TableName: secrets.TABLE_NAME, // Use secrets for the table name
      FilterExpression: "clientId = :clientId",
      ExpressionAttributeValues: {
        ":clientId": clientId,
      },
    };

    const command = new ScanCommand(params);
    const data = await client.send(command); // Ensure `client` is initialized with secrets
    return data.Items;
  } catch (error) {
    console.error("Error fetching items by clientId:", error);
    throw new Error("Failed to fetch items");
  }
};

export const receiveFormData = async (req, res) => {
  console.log("Receiving...");
  try {
    const user = req.user;
    console.log("This is the request body: ", req.body);

    // Access entry directly, as it's a string
    const entryId = req.body.entry;
    console.log("This is the entryId", entryId);

    if (!entryId) {
      return res.status(400).json({ error: "Form ID is required" });
    }

    console.log("Received Form ID:", entryId);

    const applicationData = {
      userId: user.userId,
      username: user.username,
      entryId: entryId,
      timestamp: new Date().toISOString(),
    };

    // Use secrets if additional configuration is needed
    await addApplicationToUser(applicationData);

    res
      .status(200)
      .json({ success: true, message: "Form ID logged successfully!" });
  } catch (error) {
    console.error("Error processing form ID:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the form ID." });
  }
};

