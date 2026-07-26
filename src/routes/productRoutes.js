import express from "express";
import { createProduct, getAllProducts,getSingleProduct,updateProduct,deleteProduct} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";
const router = express.Router();


router.post("/", protect,admin,createProduct);
router.get("/", getAllProducts);
router.get("/:id", getSingleProduct);
router.put("/:id", protect, admin,updateProduct);
router.delete("/:id",protect,admin,deleteProduct);
export default router;