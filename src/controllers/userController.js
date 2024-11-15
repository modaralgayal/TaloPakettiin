// Import the necessary libraries
import dotenv from "dotenv";
import path from "path";
import jwt, { decode } from "jsonwebtoken";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import crypto from "crypto";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_DEFAULT_REGION,
});

// Function to generate secret hash
const generateSecretHash = (username, clientId, clientSecret) => {
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(username + clientId)
    .digest("base64");
};

// Signup function
export const signup = async (req, res) => {
  const { username, password, email } = req.body;
  console.log("Received data in signup function");
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

  console.log("These are the params: ", params);

  try {
    const command = new SignUpCommand(params);
    const data = await cognitoClient.send(command);
    res.json(data);
  } catch (error) {
    console.log("Error here");
    res.status(400).json({ error: error.message });
  }
};

// Confirm signup function
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

// SignIn function
export const signIn = async (req, res) => {
  const { username, password } = req.body;
  console.log("Signing in");

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

    const decodedIdToken = decode(idToken); 

    if (!decodedIdToken || !decodedIdToken.sub) {
      throw new Error("User ID (sub) not found in the ID token.");
    }

    const userSub = decodedIdToken.sub;  

    const jwtToken = jwt.sign(
      { 
        sub: userSub,  
        clientId: process.env.AWS_CLIENT_ID,
        username  
      },
      process.env.MY_SECRET_JWT_KEY,
      { expiresIn: "1h" }
    );

    res.cookie("Token", jwtToken, {
      domain: ".3vbp2t1s-8000.euw.devtunnels.ms",
      secure: true,
      httpOnly: true,
      path: "/",
      sameSite: "None",
    });

    res.json({
      success: true,
      message: "Sign in successful!",
      redirectUrl: "https://talopakettiin.fi/my-home-page-2/",
      accessToken,
      idToken,
      refreshToken,
    });
    console.log("Sign in Successful");
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

export const getUserData = (req, res) => {
  console.log("Getting user data");
  const token = req.cookies.Token;
  const origin = req.headers.origin;

  if (token) {
    jwt.verify(token, process.env.MY_SECRET_JWT_KEY, (err, user) => {
      if (err) {
        console.log(err);
        return res.sendStatus(403);
      }
      console.log("Welcome", user.username);
      res.json({ username: user.username });
    });
  } else {
    res.sendStatus(401); 
  }
};
