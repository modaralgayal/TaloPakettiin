import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const secretName = "talopakettiin"; // Replace with your secret name
const region = "eu-north-1"; // Update with your AWS region

const secretsManagerClient = new SecretsManagerClient({ region });

let cachedSecrets;

export async function getSecrets() {
  if (cachedSecrets) return cachedSecrets; // Return cached secrets if already fetched

  try {
    const response = await secretsManagerClient.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );

    if ("SecretString" in response) {
      cachedSecrets = JSON.parse(response.SecretString); // Cache and parse secrets
      return cachedSecrets;
    } else {
      throw new Error("SecretBinary is not supported.");
    }
  } catch (error) {
    console.error("Error fetching secrets from Secrets Manager:", error);
    throw error;
  }
}
