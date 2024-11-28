import {
  addItemToTable,
  addApplicationToUser,
} from "../services/dynamoServices.js";
import { ScanCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { getSecrets } from "../utils/secrets.js";

let secrets;
(async () => {
  secrets = await getSecrets();
})();

const client = async () => {
  const secrets = await getSecrets();
  return new DynamoDBClient({
    region: secrets.AWS_DEFAULT_REGION,
    credentials: {
      accessKeyId: secrets.AWS_ACCESS_KEY_ID,
      secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
    },
  });
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
