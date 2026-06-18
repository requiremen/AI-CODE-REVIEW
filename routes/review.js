const express = require("express")
const rateLimit = require("express-rate-limit")
const authmiddleware = require("../authmiddleware")
const Review = require("../reviewmodel")
const {analyzeCode} = require("../services/gemini")
const router = express.Router();
const crypto = require("crypto");
const redis = require("../services/redis");
const reviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
    max: 10, // max 10 reviews per hour
    message: {
        msg: "Too many requests. You can only submit 10 reviews per hour."
    }
});
router.post("/submit", reviewLimiter, authmiddleware, async (req, res) => {
    const code = req.body.code;
    const language = req.body.language
    if (! code || code.trim().length === 0) {
        return res.status(400).json({msg: "pls enter the code which you want to get reviewed"})
    }
    // we will create a unique hash of the code - same code = same hash every time
    // this is the fingerprint we use as the redis key
    const codehash = crypto.createHash("md5").update(code).digest("hex");
    const cachekey = `newreview:${
        language || "javascript"
    }:${codehash}`;
    const cached = await redis.get(cachekey);
    if (cached) {
        console.log("cache hit - returning cached result")
        return res.status(200).json({msg: "review completed", feedback: JSON.parse(cached), fromCache: true})
    }
    const newreview = await Review.create({
        userId: req._id,
        language: language || "javascript",
        code: code,
        status: "pending"
    })
    try {
        const feedback = await analyzeCode(code, language || "javascript");
        newreview.feedback = feedback;
        newreview.status = "completed";
        await newreview.save();
        await redis.set(cachekey, JSON.stringify(feedback), "EX", 3600);
        console.log("feedback stored in redis as well")
        return res.status(200).json({msg: "review complete", newreview: newreview, feedback: feedback, reviewid: newreview._id})
    } catch (err) {
        newreview.status = "failed";
        await newreview.save();
        return res.status(500).json({msg: "error while analysing code try again ", reviewid: newreview._id, error: err.message})
    }


})
module.exports = router;
