import express from "express";
import { signup, login, logout ,getProfile} from "../controllers/userController.js";
const router = express.Router();
import { protect } from "../middleware/authMiddleware.js";
router.post("/signup", signup);
router.post("/logout", logout);
router.post("/login", login);
router.get("/profile", protect, getProfile);

export default router;