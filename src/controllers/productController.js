import Product from "../models/productModel.js";
import User from "../models/userModel.js";


// CREATE PRODUCT (ADMIN)

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




// GET ALL PRODUCTS
// Search + Filter + Pagination + Sorting

export const getAllProducts = async (req, res) => {

    try {


        const {
            keyword,
            category,
            page = 1,
            limit = 10,
            sort
        } = req.query;



        let query = {};



        // SEARCH

        if (keyword) {

            query.name = {

                $regex: keyword,

                $options: "i"

            };

        }



        // CATEGORY FILTER

        if (category) {

            query.category = category;

        }



        // PAGINATION

        const skip = (page - 1) * limit;



        // SORTING

        let sortOption = {};


        if (sort === "price") {

            sortOption.price = 1;

        }


        if (sort === "-price") {

            sortOption.price = -1;

        }



        const products = await Product.find(query)

            .sort(sortOption)

            .skip(skip)

            .limit(Number(limit));



        const totalProducts = await Product.countDocuments(query);



        res.status(200).json({

            totalProducts,

            currentPage: Number(page),

            totalPages: Math.ceil(totalProducts / limit),

            products

        });



    } catch (error) {


        res.status(500).json({

            message: error.message

        });


    }

};




// GET SINGLE PRODUCT

export const getSingleProduct = async (req, res) => {

    try {


        const product = await Product.findById(req.params.id);



        if (!product) {

            return res.status(404).json({

                message: "Product not found"

            });

        }



        res.status(200).json({

            product

        });



    } catch (error) {


        res.status(500).json({

            message: error.message

        });


    }

};




// UPDATE PRODUCT

export const updateProduct = async (req, res) => {

    try {


        const product = await Product.findById(req.params.id);



        if (!product) {

            return res.status(404).json({

                message: "Product not found"

            });

        }



        const updatedProduct = await Product.findByIdAndUpdate(

            req.params.id,

            req.body,

            {
                new:true
            }

        );



        res.status(200).json({

            message:"Product updated successfully",

            product:updatedProduct

        });



    } catch(error) {


        res.status(500).json({

            message:error.message

        });


    }

};




// DELETE PRODUCT

export const deleteProduct = async (req,res)=>{


    try {


        const product = await Product.findById(req.params.id);



        if(!product){

            return res.status(404).json({

                message:"Product not found"

            });

        }



        await Product.findByIdAndDelete(req.params.id);



        res.status(200).json({

            message:"Product deleted successfully"

        });



    } catch(error){


        res.status(500).json({

            message:error.message

        });


    }

};




// ADD PRODUCT REVIEW

export const addProductReview = async (req,res)=>{


    try {


        const {
            rating,
            comment
        } = req.body;



        const product = await Product.findById(req.params.id);



        if(!product){

            return res.status(404).json({

                message:"Product not found"

            });

        }



        const user = await User.findById(req.user.id);



        if(!user){

            return res.status(404).json({

                message:"User not found"

            });

        }




        const alreadyReviewed = product.reviews.find(

            review => review.user.toString() === req.user.id

        );



        if(alreadyReviewed){


            return res.status(400).json({

                message:"Product already reviewed"

            });


        }




        const review = {


            user:req.user.id,


            name:user.name,


            rating:Number(rating),


            comment


        };




        product.reviews.push(review);




        product.numReviews = product.reviews.length;




        product.rating =

            product.reviews.reduce(

                (acc,item)=> acc + item.rating,

                0

            ) / product.reviews.length;




        await product.save();




        res.status(201).json({


            message:"Review added successfully",


            product


        });



    } catch(error){



        res.status(500).json({

            message:error.message

        });


    }

};