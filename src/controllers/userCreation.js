import dotenv from "dotenv";
import path from "path";
import jwt from "jsonwebtoken";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_DEFAULT_REGION,
});

const generateSecretHash = (username, clientId, clientSecret) => {
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(username + clientId)
    .digest("base64");
};

export const signup = async (req, res) => {
  const { username, password, email } = req.body;
  const secretHash = generateSecretHash(
    username,
    process.env.AWS_CLIENT_ID,
    process.env.AWS_CLIENT_SECRET
  );
  const params = {
    ClientId: process.env.AWS_CLIENT_ID,
    SecretHash: secretHash,
    Username: username,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
    ],
  };

  try {
    const command = new SignUpCommand(params);
    const data = await cognitoClient.send(command);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error });
  }
};

export const confirmSignup = async (req, res) => {
  const { username, confirmationCode } = req.body;
  const clientId = process.env.AWS_CLIENT_ID;
  const clientSecret = process.env.AWS_CLIENT_SECRET;

  const secretHash = generateSecretHash(username, clientId, clientSecret);

  const params = {
    ClientId: clientId,
    Username: username,
    ConfirmationCode: confirmationCode,
    SecretHash: secretHash,
  };

  try {
    const command = new ConfirmSignUpCommand(params);
    const data = await cognitoClient.send(command);
    res.json({ message: "User confirmed successfully!", data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const signIn = async (req, res) => {
  const { username, password } = req.body;

  const secretHash = generateSecretHash(
    username,
    process.env.AWS_CLIENT_ID,
    process.env.AWS_CLIENT_SECRET
  );

  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.AWS_CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
      SECRET_HASH: secretHash,
    },
  };

  try {
    const command = new InitiateAuthCommand(params);
    const data = await cognitoClient.send(command);

    const accessToken = data.AuthenticationResult.AccessToken;
    const idToken = data.AuthenticationResult.IdToken; 
    const refreshToken = data.AuthenticationResult.RefreshToken;

    const jwtToken = jwt.sign(
      { username, clientId: process.env.AWS_CLIENT_ID },
      process.env.MY_SECRET_JWT_KEY,
      { expiresIn: "1h" }
    );

    res.json({ accessToken, jwtToken, idToken, refreshToken });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
};

export const logOut = async (req, res) => {
  const authHeader = req.headers.authorization;

  console.log("Extracted Token:", authHeader);

  const params = {
    AccessToken: authHeader,
  };

  try {
    const command = new GlobalSignOutCommand(params);
    await cognitoClient.send(command);

    res.json({ message: "Successfully logged out" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(400).json({ error: error.message });
  }
};