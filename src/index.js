import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import charRoutes from "./routes/charRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import wordPressRoutes from "./routes/wordPressRoutes.js"

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

//app.use((req, res, next) => {
//  console.log(`${req.method} ${req.url}`);
//  console.log("Headers:", req.headers);
//  console.log("Body:", req.body);
//  next();
//});

// Routes
app.use("/chars", charRoutes);
app.use("/user", userRoutes);
app.use("/forms", formRoutes);
app.use("/wordpress", wordPressRoutes)

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
