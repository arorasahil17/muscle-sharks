const nodemailer=require("nodemailer");
const productModel = require("../model/productModel");
const orderModel = require("../model/orderModel");
const userModel = require("../model/userModel");
require("dotenv").config();

const transporter=nodemailer.createTransport({
    host:"smtp.gmail.com",
    port:587,
    secure:false,
    auth:{
        user:process.env.SMTP_USER,
        pass:process.env.SMTP_PASS
    }
})



const makeAnOrder = async (req, res) => {
    const userId = req.user.userId;
    const { shippingAddress, products } = req.body;

    try {
        const productsWithVariants = [];

        for (const productData of products) {
            const { productId, variantId, quantity } = productData;
            const product = await productModel.findById(productId);

            if (!product) {
                return res.status(400).send({ success: false, error: `Product with ID ${productId} not found.` });
            }

            const productPrice = product.variants.reduce((total, variant) => total + variant.price, 0) * quantity;

            const productVariants = [];

            productVariants.push({
                variantId,
                quantity,
            });

            productsWithVariants.push({
                productId,
                variants: productVariants,
                quantity,
                price: productPrice
            });
        }

        const totalAmount = productsWithVariants.reduce((total, product) => total + product.price, 0);

        const newOrder = new orderModel({
            user: userId,
            shippingAddress,
            products: productsWithVariants,
            totalAmount
        });

        const ordered = await newOrder.save();
        res.status(200).send({ success: true, order: ordered });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, error: error.message });
    }
}

const statusUpdate = async (req, res) => {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    try {
        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.status(404).send({ success: false, error: `Order with ID ${orderId} not found.` });
        }

        const userId = order.user;
        const user = await userModel.findById(userId);

        const validStatus = ['shipped', 'delivered', 'cancelled'].includes(orderStatus.toLowerCase());

        if (validStatus) {
            const newStatus = orderStatus.toLowerCase();
            const currentStatus = order.status.toLowerCase();

            if (newStatus === currentStatus) {
                return res.status(400).send({ success: false, error: `Order is already ${currentStatus}.` });
            }

            if (newStatus === 'delivered' && currentStatus !== 'shipped') {
                return res.status(400).send({ success: false, error: `Order cannot be marked as delivered without being shipped first.` });
            }

            if (currentStatus === 'cancelled') {
                return res.status(400).send({ success: false, error: `Order is already cancelled. No further updates allowed.` });
            }

            order.status = newStatus; // Ensure status is in lowercase

            for (let product of order.products) {
                for (let variant of product.variants) {
                    const productVariant = await productModel.findById(variant.variantId);

                    if (productVariant) {
                        productVariant.stock -= variant.quantity;
                        await productVariant.save();
                    } else {
                        console.error(`No productVariant found for variantId: ${variant.variantId}`);
                    }
                }
            }

            let subject, text;

            if (newStatus === 'shipped') {
                subject = "Order Shipped 🚚";
                text = `Order no: ${orderId} has been shipped! It will be on its way to you soon.`;
            } else if (newStatus === 'cancelled') {
                subject = "Order Cancelled 🙁";
                text = `We're sorry to inform you that order no: ${orderId} has been cancelled. If you have any questions, please contact our support team.`;
            } else if (newStatus === 'delivered') {
                subject = "Order Delivered 🎉";
                text = `Great news! Order no: ${orderId} has been successfully delivered to your address: ${order.shippingAddress}. Enjoy your products!`;
            }

            const mailOptions = {
                from: process.env.SMTP_USER,
                to: user.email,
                subject,
                text
            }

            await transporter.sendMail(mailOptions);

            const savedOrder = await order.save();
            res.status(200).send({ success: true, updateStatus: savedOrder });
        } else {
            res.status(400).send({ success: false, error: "Invalid status provided." });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, error: error.message });
    }
}




const cancelOrder=async(req,res)=>{
    const {orderId}=req.params;
    try {
        const order=await orderModel.findById(orderId);
        order.status="Cancelled";

        for(let item of order.products){
            const product=await productModel.findById(item.product);
            let stock=product.stock;
            stock+=item.quantity;
            await product.save();
        }

        const cancelledOrder=await order.save();
        res.status(200).send({success:true,orderCancelled:cancelledOrder});
    } catch (error) {
        console.log(error);
        res.status(500).send({success:false,error:error.message});
    }
}



const deleteOrder= async(req,res)=>{
    const {orderId}=req.params;
    try {
        const order=await orderModel.findById(orderId);
        if(order.status==="cancelled"){
            const deleteOrder=await orderModel.findByIdAndDelete(orderId);
            res.status(200).send({success:true,DeletedOrder:deleteOrder});
        }else{
            res.status(200).send({success:true,message:"Order Status should be cancelled for deleting this Order"})
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({success:false,error:error.message});
    }
}



// const updateOrder=async(req,res)=>{
//     const orderId=req.body.orderId;
//     try {
//         const order=await orderModel.findByIdAndUpdate(orderId,req.body);
//     } catch (error) {
//         console.log(error);
//         res.status(500).send({success:false,error:error.message});        
//     }
// }

const getAllOrders=async(req,res)=>{
    try {
        const orders=await orderModel.find();
        if(orders.length<1){
            return res.status(400).send({success:false,orders:"No Orders Yet"});
        }
        res.status(200).send({success:true,orders:orders});
    } catch (error) {
        console.log(error);
        res.status(500).send({success:false,error:error.message});
    }
}


const getSingleOrder= async(req,res)=>{
    const {id}=req.params;
    try {
        const order=await orderModel.findById(id);
        res.status(200).send({success:true,order:order});
    } catch (error) {
        console.log(error);
        res.status(500).send({success:false,error:error.message});
    }
}





const getAllOrdersOfUser = async (req, res) => {
    const userId = req.user.userId;
    try {
      const userOrders = await orderModel.find({ user: req.user.userId });
  
      res.status(200).json({ success: true, orders: userOrders });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  };



  const initiatePayment = async (req, res) => {
    const { orderId, amount } = req.body;
  
    try {
      const payment_capture = 1; // 1 to capture the payment immediately, 0 to authorize only and capture later
      const currency = 'INR'; // Change to the appropriate currency for your application
  
      const options = {
        amount: amount * 100, // Razorpay expects amount in paisa
        currency,
        receipt: orderId,
        payment_capture,
      };
  
      const response = await razorpay.orders.create(options);
  
      res.status(200).json({ success: true, order: response });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  };
  



module.exports={makeAnOrder,statusUpdate,cancelOrder,deleteOrder,getAllOrders,getSingleOrder,getAllOrdersOfUser};