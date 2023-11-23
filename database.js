const mongoose =require("mongoose");

const dbConnection=async()=>{
    try {
        // AnsukXqdnhrXUxy5
        // const db=await mongoose.connect("mongodb://localhost:27017/gym");
        const db=await mongoose.connect("mongodb+srv://arbaazkhanark23:AnsukXqdnhrXUxy5@cluster0.t1vjv9b.mongodb.net/");
        console.log("database is Connected  :)");
    } catch (error) {
        console.log("Failed to Connect DataBase",error);
    }
}

module.exports=dbConnection