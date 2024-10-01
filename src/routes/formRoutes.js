import express from "express";
import { addApplicationForm } from "../controllers/formController.js";
import { authenticateJWT } from "../middleware/authenticate.js";

const router = express.Router();

router.post("/post-application", authenticateJWT, addApplicationForm);

export default router;
