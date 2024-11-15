import express from "express";
import {
  addApplicationForm,
  receiveFormData,
} from "../controllers/formController.js";
import { authenticateJWT } from "../middleware/authenticate.js";
import { getApplicationsForUser } from "../services/dynamoServices.js";

const router = express.Router();

router.post("/post-application", authenticateJWT, addApplicationForm);
router.post("/receive-form-data", authenticateJWT, receiveFormData);
router.get("/get-user-forms", authenticateJWT, getApplicationsForUser)

export default router;
