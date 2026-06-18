const jwt = require("jsonwebtoken")
function authmiddleware(req, res, next) {
    const authheader = req.headers.authorization
    if (! authheader) {
        return res.status(400).json({msg: "token missing"})
    }
    const token = authheader.split(" ")[1]
    try {
        const decoded = jwt.verify(token, "secretkey");
        req.username = decoded.username;
        req._id = decoded._id;
        next();
    } catch (e) {
        return res.status(400).json({msg: "invalid token"})
    }


}
module.exports = authmiddleware
