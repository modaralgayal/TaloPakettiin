import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secret_name = "talopakettiin";
const region = "eu-north-1";

const clientSecrets = new SecretsManagerClient({ region });

let cachedSecrets = null;
let dynamoDBClient = null;

async function getSecrets() {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  try {
    const data = await clientSecrets.send(
      new GetSecretValueCommand({ SecretId: secret_name })
    );

    if ("SecretString" in data) {
      cachedSecrets = JSON.parse(data.SecretString);
      return cachedSecrets;
    } else {
      throw new Error("SecretBinary is not supported.");
    }
  } catch (err) {
    console.error("Error fetching secrets:", err);
    throw err;
  }
}

export async function getDynamoDBClient() {
  if (dynamoDBClient) {
    return dynamoDBClient;
  }

  const secrets = await getSecrets();

  dynamoDBClient = new DynamoDBClient({
    region: secrets.AWS_DEFAULT_REGION,
    credentials: {
      accessKeyId: secrets.AWS_ACCESS_KEY_ID,
      secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
    },
  });

  return dynamoDBClient;
}
