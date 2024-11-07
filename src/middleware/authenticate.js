import jwt from "jsonwebtoken"

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.jwttoken; 
  if (!authHeader) {
    return res.sendStatus(401); 
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.MY_SECRET_JWT_KEY, (err, user) => {
    if (err) {
      console.log('JWT Verification Error:', err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};
