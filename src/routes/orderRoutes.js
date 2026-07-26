import express from "express";

import {
    createOrder,
    getMyOrders,
    getSingleOrder,
    getAllOrders,updateOrderStatus
} from "../controllers/orderController.js";


import { protect } from "../middleware/authMiddleware.js";

import { admin } from "../middleware/adminMiddleware.js";


const router = express.Router();


// Admin - Get All Orders
router.get(
    "/admin/all",
    protect,
    admin,
    getAllOrders
);


// User - Create Order
router.post(
    "/",
    protect,
    createOrder
);


// User - Get My Orders
router.get(
    "/",
    protect,
    getMyOrders
);


// User - Get Single Order
router.get(
    "/:id",
    protect,
    getSingleOrder
);
router.put(
    "/:id",
    protect,
    admin,
    updateOrderStatus
);


export default router;