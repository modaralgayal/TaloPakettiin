import express from "express";
import { getChars, addItem } from "../controllers/charController.js";

const router = express.Router();

router.get("/", getChars);
router.post("/", addItem);

export default router;
