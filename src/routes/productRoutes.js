import express from "express";

import {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    addProductReview
} from "../controllers/productController.js";


import { protect } from "../middleware/authMiddleware.js";

import { admin } from "../middleware/adminMiddleware.js";


const router = express.Router();


// Get All Products
router.get(
    "/",
    getAllProducts
);


// Add Product Review
router.post(
    "/:id/review",
    protect,
    addProductReview
);


// Get Single Product
router.get(
    "/:id",
    getSingleProduct
);


// Create Product (Admin)
router.post(
    "/",
    protect,
    admin,
    createProduct
);


// Update Product (Admin)
router.put(
    "/:id",
    protect,
    admin,
    updateProduct
);


// Delete Product (Admin)
router.delete(
    "/:id",
    protect,
    admin,
    deleteProduct
);


export default router;