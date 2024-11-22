import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import charRoutes from "./routes/charRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

// Define allowed origins for CORS
const allowedOrigins = [
  "serverapi.talopakettiin.fi",
  "https://serverapi.talopakettiin.fi/",
  "https://talopakettiin.fi",
  "talopakettiin.fi",
];

// Use CORS middleware

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.set("trust proxy", true);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use((req, res, next) => {
  req.domain = req.headers.host;
  next();
});

// Route Handlers
app.use("/api/chars", charRoutes);
app.use("/api/user", userRoutes);
app.use("/api/forms", formRoutes);

app.get("/api/test", (req, res) => {
  console.log("Test endpoint hit");
  res.json({ message: "This is a test." });
});

// Middleware to catch TokenExpiredError
const checkTokenExpiration = (err, req, res, next) => {
  if (err.name === "TokenExpiredError") {
    return res
      .status(401)
      .json({ error: "Token has expired. Please log in again." });
  }
  next(err);
};

app.use((err, req, res, next) => {
  console.error("Error is here: ", err.message);
  res.status(500).json({ error: "Something went wrong!" });
});

// Add this middleware after your token verification logic
app.use(checkTokenExpiration);

// Start the server
app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
