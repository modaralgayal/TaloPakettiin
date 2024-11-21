import jwt, { decode } from "jsonwebtoken";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "crypto";
import { getSecrets } from "../utils/secrets.js";

let cognitoClient;

async function initCognitoClient() {
  if (!cognitoClient) {
    const secrets = await getSecrets();
    cognitoClient = new CognitoIdentityProviderClient({
      region: secrets.AWS_DEFAULT_REGION,
    });
  }
}

const generateSecretHash = (username, clientId, clientSecret) => {
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(username + clientId)
    .digest("base64");
};

export const signup = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    await initCognitoClient();
    const secrets = await getSecrets();

    const secretHash = generateSecretHash(
      username,
      secrets.AWS_CLIENT_ID,
      secrets.AWS_CLIENT_SECRET
    );

    const params = {
      ClientId: secrets.AWS_CLIENT_ID,
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

    const command = new SignUpCommand(params);
    const data = await cognitoClient.send(command);

    res.json(data);
  } catch (error) {
    console.error("Error in signup:", error);
    res.status(400).json({ error: error.message });
  }
};

export const confirmSignup = async (req, res) => {
  try {
    const { username, confirmationCode } = req.body;

    await initCognitoClient();
    const secrets = await getSecrets();

    const secretHash = generateSecretHash(
      username,
      secrets.AWS_CLIENT_ID,
      secrets.AWS_CLIENT_SECRET
    );

    const params = {
      ClientId: secrets.AWS_CLIENT_ID,
      Username: username,
      ConfirmationCode: confirmationCode,
      SecretHash: secretHash,
    };

    const command = new ConfirmSignUpCommand(params);
    const data = await cognitoClient.send(command);

    res.json({ message: "User confirmed successfully!", data });
  } catch (error) {
    console.error("Error in confirmSignup:", error);
    res.status(400).json({ error: error.message });
  }
};

export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    await initCognitoClient();
    const secrets = await getSecrets();

    const secretHash = generateSecretHash(
      username,
      secrets.AWS_CLIENT_ID,
      secrets.AWS_CLIENT_SECRET
    );

    const params = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: secrets.AWS_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    };

    const command = new InitiateAuthCommand(params);
    const data = await cognitoClient.send(command);

    const accessToken = data.AuthenticationResult.AccessToken;
    const idToken = data.AuthenticationResult.IdToken;
    const refreshToken = data.AuthenticationResult.RefreshToken;

    const decodedIdToken = decode(idToken);

    if (!decodedIdToken || !decodedIdToken.sub) {
      throw new Error("User ID (sub) not found in the ID token.");
    }

    const userSub = decodedIdToken.sub;

    const jwtToken = jwt.sign(
      {
        sub: userSub,
        clientId: secrets.AWS_CLIENT_ID,
        username,
      },
      secrets.MY_SECRET_JWT_KEY,
      { expiresIn: "1h" }
    );

    res.cookie("Token", jwtToken, {
      secure: true,
      httpOnly: true,
      path: "/",
      sameSite: "None",
      domain: "talopakettiin.fi",
    });

    res.json({
      success: true,
      message: "Sign in successful!",
      redirectUrl: "https://talopakettiin.fi/my-home-page-2/",
      accessToken,
      idToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error in signIn:", error);
    res.status(400).json({ error: error.message });
  }
};

// Logout function
export const logOut = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    await initCognitoClient();

    const params = {
      AccessToken: authHeader,
    };

    const command = new GlobalSignOutCommand(params);
    await cognitoClient.send(command);

    res.json({ message: "Successfully logged out" });
  } catch (error) {
    console.error("Error in logOut:", error);
    res.status(400).json({ error: error.message });
  }
};

// Get User Data
export const getUserData = async (req, res) => {
  try {
    const token = req.cookies.Token;

    if (!token) {
      return res.sendStatus(401);
    }

    const secrets = await getSecrets();

    jwt.verify(token, secrets.MY_SECRET_JWT_KEY, (err, user) => {
      if (err) {
        console.error("JWT verification failed:", err);
        return res.sendStatus(403);
      }
      res.json({ username: user.username });
    });
  } catch (error) {
    console.error("Error in getUserData:", error);
    res.status(500).json({ error: "Failed to retrieve user data" });
  }
};
