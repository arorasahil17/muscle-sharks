const express=require("express");
const dbConnection = require("./database");
const cookieParser=require("cookie-parser");
const cors=require("cors");
const path=require("path")
require("dotenv").config();


const userRouter=require("./routes/userRouter");
const productRoutes=require("./routes/productRoutes");
const orderRouter=require("./routes/orderRouter")
const couponRouter=require("./routes/couponRouter");
const cartRouter=require("./routes/cartRouter");
const adminRouter=require("./routes/adminRouter")


const app=express();
dbConnection();
app.use(express.static(path.resolve(__dirname,"dist")))

app.use(cors({
    credentials:true,
    origin:["http://localhost:5173","http://localhost:5174", 'https://ms-server-six.vercel.app/']
}));
app.use(cookieParser());
app.use(express.json());

app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,"dist",'index.html'))
})


// app.use(require("./routes/userRouter"));
// app.use(require("./routes/productRoutes"));
// app.use(require("./routes/cartRouter"));
// app.use(require("./routes/orderRouter"));
// app.use(require("./routes/adminRouter"))
// app.use(require("./routes/couponRouter"));

app.use("/api",userRouter)
app.use("/api",productRoutes)
app.use("/api",cartRouter)
app.use("/api",orderRouter)
app.use("/api",adminRouter)
app.use("/api",couponRouter)




app.listen(process.env.PORT || 5000,()=>console.log(`Server is running on PORT ${process.env.PORT} ........`));