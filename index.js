const express = require("express")
const cors = require("cors")
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { connection } = require("./config/db");
const { UserModel } = require("./models/User.model");
const { TodoModel } = require("./models/Task.model");
const { authentication } = require("./middlewares/authentication");
require("dotenv").config()

const app = express();
const PORT=process.env.PORT || 9000
app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
    res.send({"ip":"hellow"})
})


app.post("/signup", async (req, res) => {
    const {name, email, password} = req.body

    const isUser = await UserModel.findOne({email})
    if(isUser){
        res.send({"msg" : "User already exists, try again with new email"})
    }
    else {
        bcrypt.hash(password, 4, async function(err, hash) {
        if(err){
            res.send({"msg":"Something went wrong, please try again later"})
        }
        const new_user = new UserModel({
            name,
            email,
            password : hash,
            ip:req.socket.localAddress
        })
        try{
            await new_user.save()
            res.send({"msg" : "Sign up successfull"})
        }
        catch(err){
            res.send({"msg" : "Something went wrong, please try again"})
        }
    });
}
})


app.post("/login", async (req, res) => {
    const {email, password} = req.body
    const user = await UserModel.findOne({email})
    const hashed_password = user.password;
    const user_id = user._id;
    bcrypt.compare(password, hashed_password, function(err, result) {
          if(err){
            res.send({"msg" : "Something went wrong, try again later"})
          }
          if(result){
            const token = jwt.sign({user_id}, process.env.SECRET_KEY);  
            res.send({"message" : "Login successfull", "token":token})
          }
          else{
            res.send({"msg" : "Login failed"})
          }
    });
})


app.post("/addtask", authentication, async (req, res) => {
    const {taskname,status,tag,user_id} = req.body;
    const new_task = new TodoModel({
       taskname,
       status,
       tag,
       user_id
    })
    await new_task.save()
    // console.log(req.body)
    res.send({"msg":"task added"})
})
app.get("/alltask", authentication, async (req, res) => {
    const {user_id}=req.body
    const data=await TodoModel.find({user_id:user_id})
    res.send({"data":data})
})

app.delete("/delete/:id", async (req, res) => {
    const {id}=req.params
    const data=await TodoModel.deleteOne({_id:id})
    res.send({"msg":"deleted successfully"})
})

app.listen(PORT, async () => {
    try{
        await connection
        console.log("Connection to DB successfully")
    }
    catch(err){
        console.log(err)
        console.log("Error connecting to DB")
    }
    console.log(`Listening on PORT ${PORT}`)
})
