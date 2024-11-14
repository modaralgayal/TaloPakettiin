import express from "express";
import {
  addApplicationForm,
  receiveFormData,
} from "../controllers/formController.js";
import { authenticateJWT } from "../middleware/authenticate.js";

const router = express.Router();

router.post("/post-application", authenticateJWT, addApplicationForm);
router.post("/receive-form-data", authenticateJWT, receiveFormData);

export default router;
