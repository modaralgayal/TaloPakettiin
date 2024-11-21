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

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers;
  console.log(authHeader)
  console.log("fetching")
  if (!authHeader) {
    return res.sendStatus(401);
  }
  console.log("Found authHEader:", authHeader);

  const token = authHeader.split(" ")[1];

  const decodedToken = verifyAndDecodeJWT(token);

  if (!decodedToken) {
    console.log("Invalid or expired token");
  }
  const userId = decodedToken.sub;
  if (!userId) {
    console.log("User ID (sub) not found in the token");
    return res.sendStatus(403);
  }
  res.json({ message: "Trying to find: ", authHeader });
  req.user = { userId, ...decodedToken };
  next();
};
