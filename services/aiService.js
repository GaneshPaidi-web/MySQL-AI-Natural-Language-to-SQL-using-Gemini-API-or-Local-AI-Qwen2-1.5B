import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

function correctKeywords(text) {
  const mapping = {
    shwo: "show", showw: "show", sho: "show",
    tabels: "tables", tablee: "tables", tablea: "tables",
    selecet: "select", selct: "select", slct: "select",
    fromm: "from", frmo: "from", frum: "from",
    wher: "where", wheree: "where", whre: "where",
    cretae: "create", creatt: "create", crate: "create",
    isert: "insert", insrt: "insert", inserrt: "insert",
    updaet: "update", updat: "update", udpat: "update",
    delet: "delete", deleat: "delete", delt: "delete"
  };

  return text.split(/\s+/).map(word => {
    const lowerWord = word.toLowerCase();
    return mapping[lowerWord] || word;
  }).join(" ");
}

export default async function generateSQL(question, schema, overriddenProvider = null) {
  // Apply keyword auto-correction first
  const correctedQuestion = correctKeywords(question);

  // Manual check for "show tables" using corrected question
  const normalizedQuestion = correctedQuestion.toLowerCase().trim();
  
  if (normalizedQuestion === "show tables" || normalizedQuestion === "list tables" || normalizedQuestion === "list all tables") {
    return {
      sql: "SHOW TABLES",
      chartType: "none",
      xAxis: null,
      yAxis: null
    };
  }

  // Support "describe [table] table" or "describe [table]" directly
  const describeTableMatch = normalizedQuestion.match(/^describe\s+([\w`]+)(\s+table)?$/i);
  if (describeTableMatch) {
    const tableName = describeTableMatch[1].replace(/`/g, '');
    return {
      sql: `DESCRIBE \`${tableName}\`;`,
      chartType: "none",
      xAxis: null,
      yAxis: null
    };
  }

  if (!schema || schema.includes("is empty") || schema.includes("no tables found")) {
    return {
      error: "No tables found in the current database. Please create a table first or check your connection."
    };
  }

  const prompt = `
You are a MySQL expert. Use the provided database schema to generate a SQL query based on the user's question.

DATABASE SCHEMA:
${schema}

USER QUESTION: "${correctedQuestion}"

INSTRUCTIONS:
- Generate a valid MySQL query that answers the question.
- Return ONLY a JSON object in the following format:
  {
    "sql": "your_sql_query_here",
    "chartType": "none",
    "xAxis": null,
    "yAxis": null
  }
- If asking for the structure, columns, or description of a table, use "DESCRIBE \`table_name\`;".
- If asking to see the contents or data, use "SELECT * FROM \`table_name\`;".
- CRITICAL: Use only the tables and columns defined in the DATABASE SCHEMA above.
- CRITICAL: Wrap all table and column names in backticks (\`). Example: \`users\`.\`id\`.
- Stop generating after closing the JSON object.
- No conversational text or explanation.

EXAMPLE (Unrelated data):
User: "How many users joined in 2023?"
Response: {"sql": "SELECT COUNT(*) FROM \`users\` WHERE \`created_at\` LIKE '2023%';", "chartType": "none", "xAxis": null, "yAxis": null}
`;

  let response;
  try {
    // OpenAI-compatible format (LocalAI, GPT4All, vLLM, etc.)
    response = await axios.post(
      process.env.AI_API_URL,
      {
        model: process.env.AI_MODEL || "default",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.AI_API_KEY || "no-key"}`
        }
      }
    );
  } catch (error) {
    if (error.response && error.response.status === 429) {
      throw new Error("AI API rate limit exceeded (429). Please try again in a few moments.");
    }
    throw new Error(`AI Service Error (Local AI): ${error.message}`);
  }

  // Parse response (OpenAI format)
  let text = response.data.choices[0].message.content.trim();

  // Robust JSON extraction using regex (non-greedy to match first block only)
  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  let extractedJson = null;

  if (jsonMatch) {
    try {
      extractedJson = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Found { } but failed to parse JSON:", jsonMatch[0]);
    }
  }

  if (extractedJson && extractedJson.sql && !extractedJson.sql.includes("your_sql_query_here")) {
    return extractedJson;
  }

  // Fallback: If no valid JSON found, try to find SQL in the text
  console.warn("AI didn't return valid JSON. Attempting to extract SQL from text:", text);
  
  // Try to find SQL between backticks or after "sql": "
  // Handle case where "sql": "..." might be present but JSON parsing failed
  const jsonFieldMatch = text.match(/"sql":\s*"([^"]*)/);
  const sqlMatch = (jsonFieldMatch && jsonFieldMatch[1]) ? jsonFieldMatch : (
                   text.match(/```sql([\s\S]*?)```/) || 
                   text.match(/```([\s\S]*?)```/) ||
                   text.match(/SELECT[\s\S]*?;/i) ||
                   text.match(/SHOW[\s\S]*?;/i) ||
                   text.match(/DESCRIBE[\s\S]*?;/i) ||
                   text.match(/DROP[\s\S]*?;/i));

  let sql = "";
  if (sqlMatch) {
    // If it was the "sql": "..." match, the group is [1]
    // If it was a generic match, it might be [1] or [0]
    sql = (sqlMatch[1] || sqlMatch[0]).trim();
    
    // Isolate the SQL part up to the first semicolon if it looks like a real query
    const upperSql = sql.toUpperCase();
    const keywords = ["SELECT", "SHOW", "DESCRIBE", "DROP", "CREATE", "INSERT", "UPDATE", "DELETE"];
    if (keywords.some(k => upperSql.includes(k))) {
      const semiIndex = sql.indexOf(";");
      if (semiIndex !== -1) {
        sql = sql.substring(0, semiIndex + 1);
      }
    }
  } else {
    // Last resort: Clean up what we have
    sql = text.replace(/```sql|```/g, "").trim();
    const semiIndex = sql.indexOf(";");
    if (semiIndex !== -1) {
      sql = sql.substring(0, semiIndex + 1);
    }
  }
  
  return {
    sql: sql.trim(),
    chartType: "none",
    xAxis: null,
    yAxis: null
  };
}