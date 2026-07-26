import Product from "../models/productModel.js";


export const createProduct = async (req, res) => {

    try {

        const {
            name,
            description,
            price,
            category,
            image,
            stock
        } = req.body;


        const product = await Product.create({
            name,
            description,
            price,
            category,
            image,
            stock,
            createdBy: req.user.id
        });


        res.status(201).json({
            message: "Product created successfully",
            product
        });


    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};