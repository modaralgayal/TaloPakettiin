import jwt from "jsonwebtoken";
import { getSecrets } from "../utils/secrets.js";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

let cognitoClient;

async function initCognitoClient() {
  if (!cognitoClient) {
    const secrets = await getSecrets();
    cognitoClient = new CognitoIdentityProviderClient({
      region: secrets.AWS_DEFAULT_REGION,
    });
  }
}

export const verifyAndDecodeJWT = async (token) => {
  try {
    await initCognitoClient();
    const secrets = await getSecrets();

    const decoded = jwt.verify(token, secrets.MY_SECRET_JWT_KEY);
    return decoded;
  } catch (error) {
    return null;
  }
};

export const authenticateJWT = async (req, res, next) => {
  try {
    const token = req.headers.token;
    console.log("fetching");

    if (!token) {
      return res.sendStatus(401);
    }

    //console.log("Found token:", token);
    const decodedToken = await verifyAndDecodeJWT(token);

    if (!decodedToken) {
      console.log("Invalid or expired token");
      return res.sendStatus(401);
    }

    //console.log(decodedToken);
    const userId = decodedToken.sub;

    if (!userId) {
      console.log("User ID (sub) not found in the token");
      return res.sendStatus(403);
    }

    // Remove undefined `authHeader` or define it correctly
    req.user = { userId, ...decodedToken };
    next();
  } catch (err) {
    console.error("Error in authenticateJWT:", err.message);
    res.sendStatus(500); // Internal Server Error
  }
};
