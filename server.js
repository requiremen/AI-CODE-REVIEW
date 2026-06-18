const express = require("express");
const bcrypt = require("bcrypt")
const port = 3000;
const jwt = require("jsonwebtoken");
const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());
const user = require("./usermodel");
const {connectDb} = require("./databse")
connectDb();
app.post("/signup", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const existinguser = await user.findOne({username: username})
    if (existinguser) {
        return res.status(400).json({msg: "user already exist"})
    }
    const saltrounds = 10;
    const hashedpassword = await bcrypt.hash(password, saltrounds);
    const newuser = await user.create({username, password: hashedpassword})
    const token = jwt.sign({
        _id: newuser._id
    }, "secretkey")
    return res.status(200).json({userdetails: newuser, msg: "signup succesfull", token})

})
app.post("/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const finduser = await user.findOne({username: username})

    if (! finduser) {
        return res.status(400).json({msg: "user do not exist pls signup "})
    }
    const passwordcheck = await bcrypt.compare(password, finduser.password)
    if (! passwordcheck) {
        return res.status(400).json({msg: "invalid password"})
    }
    const token = jwt.sign({
        _id: finduser._id
    }, "secretkey")
    return res.status(200).json({msg: "signin succesfully", token, username: finduser.username})


})
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
const reviewroutes = require("./routes/review");
app.use("/review", reviewroutes);


app.listen(port, () => {
    console.log(`app is listning on${port}`)
})
