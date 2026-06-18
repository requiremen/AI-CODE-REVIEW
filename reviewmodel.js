const mongoose = require("mongoose")
const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true

    },
    language: {
        type: String,
        default: "javascript"
    },
    code: {
        type: String,
        required: true
    },
    feedback: {
        summary: String, // overall code summary
        bugs: [
            {
                line: Number,
                issue: String,
                fix: String
            }
        ], // array of bug objects
        security: [
            {
                issue: String,
                explanation: String
            }
        ],
        performance: [
            {
                issue: String,
                suggestion: String
            }
        ],
        improvements: [
            {
                issue: String,
                suggestion: String
            }
        ],
        score: Number // 0-100 quality score
    },
    status: {
        type: String,
        enum: [
            "pending", "completed", "failed"
        ],
        default: "pending"
    }


}, {timestamps: true});
const review = mongoose.model("review", reviewSchema)
module.exports = review
