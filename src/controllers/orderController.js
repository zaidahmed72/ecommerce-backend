import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";


// CREATE ORDER
export const createOrder = async (req, res) => {

    try {


        const cart = await Cart.findOne({
            user: req.user.id
        }).populate("items.product");



        if (!cart || cart.items.length === 0) {

            return res.status(400).json({
                message: "Cart is empty"
            });

        }



        const orderItems = cart.items.map(item => ({

            product: item.product._id,

            name: item.product.name,

            price: item.product.price,

            quantity: item.quantity

        }));



        const totalAmount = orderItems.reduce(

            (total, item) => 
                total + item.price * item.quantity,

            0

        );



        const order = await Order.create({

            user: req.user.id,

            items: orderItems,

            totalAmount

        });



        cart.items = [];

        await cart.save();



        res.status(201).json({

            message: "Order created successfully",

            order

        });



    } catch (error) {


        res.status(500).json({

            message: error.message

        });

    }

};
export const getMyOrders = async (req, res) => {

    try {


        const orders = await Order.find({
            user: req.user.id
        });


        res.status(200).json({

            orders

        });



    } catch (error) {


        res.status(500).json({

            message: error.message

        });

    }

};
export const getSingleOrder = async (req, res) => {

    try {


        const order = await Order.findById(req.params.id)
            .populate("items.product", "name price image");



        if (!order) {

            return res.status(404).json({

                message: "Order not found"

            });

        }



        if (order.user.toString() !== req.user.id) {

            return res.status(403).json({

                message: "You are not allowed to view this order"

            });

        }



        res.status(200).json({

            order

        });



    } catch (error) {


        res.status(500).json({

            message: error.message

        });

    }

};
export const getAllOrders = async (req, res) => {

    try {


        const orders = await Order.find()
            .populate("user", "name email");



        res.status(200).json({

            orders

        });



    } catch (error) {


        res.status(500).json({

            message: error.message

        });

    }

};
export const updateOrderStatus = async (req, res) => {

    try {


        const { orderStatus } = req.body;


        const order = await Order.findById(req.params.id);



        if (!order) {

            return res.status(404).json({

                message: "Order not found"

            });

        }



        order.orderStatus = orderStatus;


        await order.save();



        res.status(200).json({

            message: "Order status updated successfully",

            order

        });



    } catch (error) {


        res.status(500).json({

            message: error.message

        });

    }

};