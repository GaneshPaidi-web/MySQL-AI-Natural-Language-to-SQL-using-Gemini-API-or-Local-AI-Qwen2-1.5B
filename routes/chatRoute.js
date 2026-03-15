import express from "express";
import Chat from "../models/Chat.js";

const router = express.Router();

// Fetch previous chats for a user
router.get("/:userId", async (req, res) => {
    try {
        const chat = await Chat.findOne({ userId: req.params.userId });
        
        if (!chat) {
            return res.json({ success: true, messages: [] });
        }

        res.json({ success: true, messages: chat.messages });
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ success: false, message: "Server error retrieving chats." });
    }
});

// Clear chat history for a user
router.delete("/:userId", async (req, res) => {
    try {
        await Chat.findOneAndDelete({ userId: req.params.userId });
        res.json({ success: true, message: "Chat cleared successfully." });
    } catch (error) {
        console.error("Error clearing chats:", error);
        res.status(500).json({ success: false, message: "Server error clearing chats." });
    }
});

export default router;
