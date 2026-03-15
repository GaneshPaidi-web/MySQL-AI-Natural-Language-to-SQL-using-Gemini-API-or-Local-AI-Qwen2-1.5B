import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "ganesh@123",
      database: process.env.DB_NAME || "test"
    });
    console.log("Connection successful!");
    await connection.end();
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

test();
