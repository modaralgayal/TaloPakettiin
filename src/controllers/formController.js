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

    const entryId = req.body.entryId;
    const offerId = req.body.offerId;
    const entryType = req.body.entryType;
    console.log("This is the entryId", entryId);
    console.log("This is the entryType", entryType);

    if (!entryId) {
      return res.status(400).json({ error: "Form ID is required" });
    }

    console.log("Received Form ID:", entryId);

    let applicationData = {
      userId: user.userId,
      username: user.username,

      timestamp: new Date().toISOString(),
    };

    if (entryType === "offer") {
      applicationData = {
        ...applicationData,
        offerId: offerId,
        entryId: String(entryId),
        status: "pending",
        entryType: entryType,
      };
    } else {
      applicationData = {
        ...applicationData,
        entryId: String(entryId),
        status: "applied - pending",
        entryType: "application",
      };
    }

    console.log("This is the applicationData: ", applicationData);

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
