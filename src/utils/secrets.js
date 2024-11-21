import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { fromIni } from "@aws-sdk/credential-provider-ini";

const secretName = "talopakettiin";
const region = "eu-north-1";

// Set credentials explicitly from a specific profile (default)
const secretsManagerClient = new SecretsManagerClient({
  region,
  credentials: fromIni({ profile: "default" }), // Explicitly use the "default" profile
});

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
