import express from "express";
import {
  signup,
  confirmSignup,
  signIn,
  logOut,
  getUserData,
} from "../controllers/userController.js";
import { authenticateJWT } from "../middleware/authenticate.js";
import { addApplicationForm } from "../controllers/formController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signIn);
router.post("/logout", authenticateJWT, logOut);
router.post("/confirm-signup", confirmSignup);
router.post("/add-application", addApplicationForm);
router.get("/data", getUserData);

export default router;
