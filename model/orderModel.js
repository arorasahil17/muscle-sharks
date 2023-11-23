const mongoose=require("mongoose");

const orderSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    shippingAddress:{
        type:String,
        required:true
    },
    products: [
        {
            productId: {
                type: String,
                required: true
            },
            // quantity: {
            //     type: Number,
            //     required: true
            // },
            variants: [  // Add this field to store variant information
            {
                variantId: String,
                quantity: Number
            }
        ]
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});



const orderModel=new mongoose.model("Order",orderSchema);

module.exports=orderModel;