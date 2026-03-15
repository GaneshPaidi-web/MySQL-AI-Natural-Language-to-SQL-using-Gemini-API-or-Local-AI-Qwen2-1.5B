import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Maximize2, Minimize2, LogOut, BarChart2, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [result, setResult] = useState([]);
  const [chartConfig, setChartConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [dbPassword, setDbPassword] = useState("");
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const navigate = useNavigate();

  // Auto-scroll to bottom of chat
  const chatEndRef = useRef(null);
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user, chat history, and databases on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.id) {
      setUserId(user.id);
      fetchChatHistory(user.id);
      fetchDatabases();
    }
  }, []);

  const fetchDatabases = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/databases");
      const data = await res.json();
      if (data.success) {
        setDatabases(data.databases);
        // If there's already a DB selected on the server, we might want to sync it here
        // For now, just set the local list
      }
    } catch (error) {
      console.error("Failed to fetch databases:", error);
    }
  };

  const handleDatabaseChange = async (e) => {
    const dbName = e.target.value;
    setSelectedDatabase(dbName);
    if (!dbName) return;

    try {
      const res = await fetch("http://localhost:5000/api/use-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ database: dbName })
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `Active database switched to: ${dbName}`, isSql: false }
        ]);
      } else {
        alert("Failed to switch database: " + data.message);
      }
    } catch (error) {
      console.error("Error switching database:", error);
    }
  };

  const fetchChatHistory = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/chats/${id}`);
      const data = await res.json();
      if (data.success && data.messages.length > 0) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  const askDatabase = async () => {
    if (!question || loading) return;

    setLoading(true);
    const userMessage = { sender: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const aiProvider = localStorage.getItem("aiProvider") || "gemini";
      const res = await fetch("http://localhost:5000/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, userId, aiProvider }), // Pass userId and aiProvider here
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `Error: ${data.error}`, isSql: false },
        ]);
        setLoading(false);
        setQuestion("");
        return;
      }

      const botMessage = {
        sender: "bot",
        text: data.sql || "Query executed successfully.",
        isSql: !!data.sql,
        chartData: data.chartData,
        imageUrl: data.imageUrl,
        result: data.result,
        chartConfig: data.chartConfig
      };

      setMessages((prev) => [...prev, botMessage]);

      if (data.result) {
        setResult(data.result);
        setChartConfig(data.chartConfig);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error connecting to the server." },
      ]);
    } finally {
      setLoading(false);
      setQuestion("");
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      askDatabase();
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (dbPassword.trim()) {
      setIsPasswordVerified(true);
    }
  };

  if (!isPasswordVerified) {
    return (
      <div className="password-popup-overlay">
        <div className="password-popup-card">
          <h3>MYSQL Authentication</h3>
          <p>Please enter your MYSQL password to access the Chat.</p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={dbPassword}
              onChange={(e) => setDbPassword(e.target.value)}
              placeholder="Enter DB Password"
              required
            />
            <button type="submit">Unlock Chat</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-container ${isFullScreen ? "full-screen" : ""}`}>
      <div className="chat-header-actions">
        <select
          className="db-selector"
          value={selectedDatabase}
          onChange={handleDatabaseChange}
        >
          <option value="">Select Database</option>
          {databases.map(db => (
            <option key={db} value={db}>{db}</option>
          ))}
        </select>
        <button className="icon-btn" onClick={() => setIsFullScreen(!isFullScreen)} title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}>
          {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <button className="icon-btn exit-btn" onClick={() => navigate("/connect-db")} title="Exit Chat">
          <LogOut size={18} />
          <span>Exit Chat</span>
        </button>
      </div>

      {/* Chat Area */}
      <div className="chat-main">
        {/* Chat messages */}
        <div className="chat-window">
          {messages.length === 0 && (
            <div className="empty-state">
              <p>Ask a question like "Show me all users from New York"</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender} ${msg.result ? 'has-result' : ''}`}>
              <div className="message-header">
                {msg.sender === "user" ? "YOU" : "DATABASE ENGINE"}
              </div>

              <div className="message-content">
                {msg.isSql ? (
                  <code className="sql-code">{msg.text}</code>
                ) : (
                  <div>{msg.text}</div>
                )}

                {/* Render Image if the bot generated one */}
                {msg.imageUrl && (
                  <div className="generated-image">
                    <img src={msg.imageUrl} alt="Generated Graph" />
                  </div>
                )}

                {/* Render Chart if available in message */}
                {msg.result && msg.chartConfig && msg.chartConfig.chartType !== "none" && (
                  <div className="inline-chart-section">
                    <ResponsiveContainer width="100%" height={250}>
                      {msg.chartConfig.chartType === "bar" ? (
                        <BarChart data={msg.result}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey={msg.chartConfig.xAxis} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey={msg.chartConfig.yAxis} fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : msg.chartConfig.chartType === "line" ? (
                        <LineChart data={msg.result}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey={msg.chartConfig.xAxis} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                          <Line type="monotone" dataKey={msg.chartConfig.yAxis} stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      ) : (
                        <PieChart>
                          <Pie data={msg.result} dataKey={msg.chartConfig.yAxis} nameKey={msg.chartConfig.xAxis} cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
                            {msg.result.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Render Table if available in message */}
                {msg.result && Array.isArray(msg.result) && msg.result.length > 0 && (
                  <div className="inline-table-section">
                    <div className="inline-table-container">
                      <table>
                        <thead>
                          <tr>
                            {Object.keys(msg.result[0]).map((key) => <th key={key}>{key}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.result.map((row, idx) => (
                            <tr key={idx}>
                              {Object.values(row).map((val, colIdx) => <td key={colIdx}>{String(val)}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="row-count">{msg.result.length} rows returned</div>
                  </div>
                )}

                {/* Show empty set message if result is an empty array */}
                {msg.isSql && msg.result && Array.isArray(msg.result) && msg.result.length === 0 && (
                  <div className="empty-set-message">
                    Empty set (0 rows returned)
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-group">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask your database a question..."
            disabled={loading}
          />
          <button onClick={askDatabase} disabled={loading || !question}>
            {loading ? "Processing..." : "Run Query"}
          </button>
        </div>

      </div>

    </div>
  );
}

export default App;