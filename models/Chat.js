import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: { type: String, enum: ["user", "bot"], required: true },
    text: { type: String, required: true },
    isSql: { type: Boolean, default: false },
    chartData: { type: mongoose.Schema.Types.Mixed }, // For JSON graph configs
    imageUrl: { type: String } // For static graph image URLs
});

const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    messages: [messageSchema]
}, { timestamps: true });

export default mongoose.model("Chat", chatSchema);
