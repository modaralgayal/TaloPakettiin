import jwt from 'jsonwebtoken';

export const verifyAndDecodeJWT = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.MY_SECRET_JWT_KEY);
    return decoded;
  } catch (error) {
    return null;
  }
};

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.jwttoken; 

  if (!authHeader) {
    return res.sendStatus(401); 
  }

  const token = authHeader.split(' ')[1];  

  const decodedToken = verifyAndDecodeJWT(token);

  if (!decodedToken) {
    console.log('Invalid or expired token');
  }
  const userId = decodedToken.sub;
  if (!userId) {
    console.log('User ID (sub) not found in the token');
    return res.sendStatus(403);  
  }
  req.user = { userId, ...decodedToken }; 
  next();
};
