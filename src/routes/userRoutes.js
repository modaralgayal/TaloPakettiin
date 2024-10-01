import express from "express";
import {
  signup,
  confirmSignup,
  signIn,
  logOut,
} from "../controllers/userCreation.js";
import { authenticateJWT } from "../middleware/authenticate.js";
import { addApplicationForm } from "../controllers/formController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signIn);
router.post("/logout",authenticateJWT, logOut);
router.post("/confirm-signup", confirmSignup);
router.post("/add-application", addApplicationForm);

export default router;
