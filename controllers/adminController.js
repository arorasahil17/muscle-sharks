const bcrypt = require('bcrypt');
const adminModel = require('../model/adminModel');
const { generateToken } = require('../middleware/adminMiddleware');
const jwt =require("jsonwebtoken");




const register = async (req, res) => {
  try {
    const { name,email,password } = req.body;

    // Check if username or email already exists
    const existingAdmin = await adminModel.findOne({email});
    if (existingAdmin) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new adminModel
    const newAdmin = new adminModel({
      name,
      password: hashedPassword,
      email
    });

    await newAdmin.save();

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};






const login=async(req,res)=>{
  const {email,password}=req.body;

  try {
      const admin=await adminModel.findOne({email});
      if(!admin){
          return res.status(400).send({success:false,error:"INVALID CREADTIAL"})
      }
      
      const match=await bcrypt.compare(password,admin.password);
      if(!match){
          return res.status(400).send({success:false,error:"INVALID CREADTIAL"})
      }

      const token=await jwt.sign({adminId:admin._id},process.env.SECRET_KEY);
      // res.cookie('token',token)
      res.cookie('adminToken', token, { httpOnly: true, maxAge:60*60*1000 }); 
      admin.token=token;
      await admin.save();
      res.status(200).send({success:true,logIn:admin})
  } catch (error) {
      console.log(error);
      res.status(500).send({success:false,error:error.message})
  }
}





  const adminAuth = async (req, res) => {
    try {
        const token = req.cookies.adminToken;
        const decodedToken = jwt.decode(token);

        const admin = await adminModel.findById(decodedToken.adminId);
        if (!admin) {
            return res.status(400).send({ success: false, error: "Admin Not in Database" });
        }

        return res.status(200).send({ success: true, admin: admin });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, error: error.message });
    }
}


const adminLogout =(req,res) => {
  try {
      const token =req.cookies.adminToken;

      if (!token){
          return res.status(400).send({ success: false, error: "Token not available" });
      }

      res.clearCookie('addToken');
      res.status(200).send({ success: true, message: "Log Out Successfully" });
  } catch (error){
      console.log(error);
      res.status(500).send({ success: false, error: error.message })
  }
}


module.exports = { login, register,adminAuth,adminLogout };
