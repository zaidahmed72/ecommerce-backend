import express from "express";
import cookieParser from "cookie-parser";

import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { errorMiddleware } from "./middleware/errorMiddleware.js";

import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";


const app = express();


// Body Parser
app.use(express.json());


// Cookie Parser
app.use(cookieParser());


// Security Middleware

app.use(helmet());


app.use(cors({
    origin: "*"
}));


const limiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 100,

    message: "Too many requests, please try again later"

});


app.use(limiter);



// Routes

app.use("/api/users", userRoutes);

app.use("/api/products", productRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/orders", orderRoutes);


// Error Handler (always last)

app.use(errorMiddleware);



export default app;