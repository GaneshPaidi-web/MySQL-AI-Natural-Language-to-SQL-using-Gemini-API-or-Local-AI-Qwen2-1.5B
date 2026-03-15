import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import queryRoute from "./routes/queryRoute.js";
import authRoute from "./routes/authRoute.js";
import chatRoute from "./routes/chatRoute.js";
import mongoose from "mongoose";
import db from "./db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", queryRoute);
app.use("/api/auth", authRoute);
app.use("/api/chats", chatRoute);

// Handle dynamic SQL connections from DBConnection.jsx
app.post("/connect", async (req, res) => {
  try {
    const { host, user, password, database, port } = req.body;
    await db.setConnection({ host, user, password, database, port });
    res.json({ success: true, message: "Connected successfully!" });
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// List available databases
app.get("/api/databases", async (req, res) => {
  try {
    const databases = await db.getDatabases();
    res.json({ success: true, databases });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Switch active database
app.post("/api/use-database", async (req, res) => {
  try {
    const { database } = req.body;
    await db.useDatabase(database);
    res.json({ success: true, message: `Switched to ${database}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create a new database with password verification
app.post("/api/create-database", async (req, res) => {
  try {
    const { dbName, password } = req.body;
    
    // Verify using the MySQL password
    if (!(await db.verifyPassword(password))) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    if (!dbName) {
      return res.status(400).json({ success: false, message: "Database name is required" });
    }

    await db.createDatabase(dbName);
    res.json({ success: true, message: `Database '${dbName}' created successfully!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a database with password verification
app.post("/api/delete-database", async (req, res) => {
  try {
    const { dbName, password } = req.body;
    
    // Verify using the MySQL password
    if (!(await db.verifyPassword(password))) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    if (!dbName) {
      return res.status(400).json({ success: false, message: "Database name is required" });
    }

    // Safety check: Don't allow deleting system databases if they somehow pass the filter
    const systemDbs = ["information_schema", "mysql", "performance_schema", "sys"];
    if (systemDbs.includes(dbName.toLowerCase())) {
      return res.status(403).json({ success: false, message: "Cannot delete system databases" });
    }

    await db.deleteDatabase(dbName);
    res.json({ success: true, message: `Database '${dbName}' deleted successfully!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sql-ai")
  .then(() => console.log("Connected to MongoDB for User Accounts"))
  .catch((err) => console.log("Failed to connect to MongoDB", err));

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port " + (process.env.PORT || 5000));
});