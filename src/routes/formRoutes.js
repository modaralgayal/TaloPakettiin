import express from "express";
import { receiveFormData } from "../controllers/formController.js";
import { authenticateJWT } from "../middleware/authenticate.js";
import {
  getAllEntryIds,
  getApplicationsForUser,
} from "../services/dynamoServices.js";

const router = express.Router();

router.post("/receive-form-data", authenticateJWT, receiveFormData);
router.get("/get-user-forms", authenticateJWT, getApplicationsForUser);
router.get("/get-all-entries", getAllEntryIds);

export default router;
