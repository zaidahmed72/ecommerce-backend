import express from "express";
import indexRoutes from "./routes/indexRoutes.js";

const app = express();

app.use(express.json());

app.use("/", indexRoutes);

export default app;