import db from "../db.js";
import dotenv from "dotenv";

dotenv.config();

async function testSchema() {
    try {
        console.log("Checking schema retrieval...");
        const schema = await db.getSchema();
        console.log("--- SCHEMA START ---");
        console.log(schema);
        console.log("--- SCHEMA END ---");

        if (schema.includes("(")) {
            console.log("SUCCESS: Schema retrieved in compact format.");
        } else {
            console.log("WARNING: Schema output does not match expected compact format.");
        }
    } catch (err) {
        console.error("FAILED to retrieve schema:", err.message);
    } finally {
        process.exit(0);
    }
}

testSchema();
