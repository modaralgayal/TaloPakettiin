import jwt from 'jsonwebtoken';

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.jwttoken;
  console.log("Fucks up here:")
  if (!authHeader) {
    return res.sendStatus(401); 
  }

  console.log("Fuck up in the second part: ")
  jwt.verify(authHeader, process.env.MY_SECRET_JWT_KEY, (err, user) => {
    if (err) {
      console.log('JWT Verification Error:', err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};
