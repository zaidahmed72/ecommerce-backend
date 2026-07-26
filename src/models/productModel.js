import mongoose from "mongoose";


const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },


    description: {
        type: String,
        required: true
    },


    price: {
        type: Number,
        required: true
    },


    category: {
        type: String,
        required: true
    },


    image: {
        type: String,
        required: true
    },


    stock: {
        type: Number,
        required: true,
        default: 0
    },


    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },


    reviews: [

        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },


            name: {
                type: String,
                required: true
            },


            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5
            },


            comment: {
                type: String,
                required: true
            }

        }

    ],


    numReviews: {
        type: Number,
        default: 0
    },


    rating: {
        type: Number,
        default: 0
    }


});


const Product = mongoose.model("Product", productSchema);


export default Product;