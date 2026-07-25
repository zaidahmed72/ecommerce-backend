import express from "express";

const router = express.Router();

router.get("/", (req,res)=>{
    res.send("E-commerce API Running");
});

export default router;