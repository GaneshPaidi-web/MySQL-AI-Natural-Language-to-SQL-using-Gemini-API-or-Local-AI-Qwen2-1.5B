import db from "../db.js";
import generateSQL from "../services/aiService.js";
import Chat from "../models/Chat.js";

export const runQuery = async (req, res) => {
  const { question, userId, aiProvider } = req.body;

  try {
    const schema = await db.getSchema();
    const aiResponse = await generateSQL(question, schema, aiProvider);
    
    if (aiResponse.error) {
      return res.json({ error: aiResponse.error });
    }

    const { sql, chartType, xAxis, yAxis } = aiResponse;

    let rows = [];
    if (sql) {
      const [dbRows] = await db.query(sql);
      // dbRows could be an array of rows (for SELECT/SHOW) 
      // or a ResultSetHeader object (for CREATE/INSERT/UPDATE)
      rows = dbRows;
    }

    // Prepare response data
    const responseData = {
      sql: sql,
      result: rows,
      chartConfig: { chartType, xAxis, yAxis }
    };

    // Save to chat history if userId is provided
    if (userId) {
      const userMessage = { sender: "user", text: question };
      const botMessage = {
        sender: "bot",
        text: sql || "Query executed successfully.",
        isSql: true,
        chartData: responseData.chartData,
        imageUrl: responseData.imageUrl
      };

      await Chat.findOneAndUpdate(
        { userId: userId },
        { $push: { messages: { $each: [userMessage, botMessage] } } },
        { upsert: true, returnDocument: "after" }
      );
    }

    res.json(responseData);

  } catch (error) {
    res.json({
      error: error.message
    });
  }
};