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
  ".3vbp2t1s-8000.euw.devtunnels.ms",
  "https://3vbp2t1s-8000.euw.devtunnels.ms/",
  "https://talopakettiin.fi",
  ".talopakettiin.fi",
];

// Use CORS middleware
app.set("trust proxy", 1);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Route Handlers
app.use("/chars", charRoutes);
app.use("/user", userRoutes);
app.use("/forms", formRoutes);

app.get("/test", (req, res) => {
  console.log("Test endpoint hit");
  res.json({ message: "This is a test." });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Error is here: ", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
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

// Add this middleware after your token verification logic
app.use(checkTokenExpiration);

// Start the server
app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
