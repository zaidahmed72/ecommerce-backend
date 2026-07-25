import express from "express";
import indexRoutes from "./routes/indexRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/", indexRoutes);
app.use("/api/users", userRoutes);

export default app;