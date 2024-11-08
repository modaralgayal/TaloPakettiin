import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import charRoutes from "./routes/charRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import wordPressRoutes from "./routes/wordPressRoutes.js";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

// Define allowed origins for CORS
const allowedOrigins = [

  "3vbp2t1s-8000.euw.devtunnels.ms",
  "https://talopakettiin.fi"
];

// Use CORS middleware
app.set("trust proxy", 1);
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ["GET", "POST", "OPTIONS"]
})
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Route Handlers
app.use("/chars", charRoutes);
app.use("/user", userRoutes);
app.use("/forms", formRoutes);
app.use("/wordpress", wordPressRoutes);

app.get("/test", (req, res) => {
  console.log("Test endpoint hit");
  res.json({ message: "This is a test." });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Error is here: ", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Middleware to log response headers
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log("Response headers:", res.getHeaders());
  });
  next();
});

// Start the server
app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
