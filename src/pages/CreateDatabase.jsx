import { useState } from "react";
import { Database, Shield, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import "./CreateDatabase.css";

function CreateDatabase() {
    const [dbName, setDbName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch("http://localhost:5000/api/create-database", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ dbName, password }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage(data.message);
                setDbName("");
                setPassword("");
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Failed to connect to the server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-db-page">
            <div className="create-db-card">
                <div className="card-header">
                    <div className="icon-wrapper">
                        <Database className="header-icon" />
                    </div>
                    <h1>Create New Database</h1>
                    <p>Enter a name and satisfy the security requirements to create a new MySQL database.</p>
                </div>

                <form className="create-db-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="dbName">Database Name</label>
                        <div className="input-container">
                            <Database className="input-icon" size={18} />
                            <input
                                type="text"
                                id="dbName"
                                placeholder="e.g. ecommerce_db"
                                value={dbName}
                                onChange={(e) => setDbName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">MySQL Password</label>
                        <div className="input-container">
                            <Shield className="input-icon" size={18} />
                            <input
                                type="password"
                                id="password"
                                placeholder="Enter MySQL password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <p className="field-note">Authorization required via database credentials.</p>
                    </div>

                    {message && (
                        <div className="status-message success">
                            <CheckCircle2 size={18} />
                            <span>{message}</span>
                        </div>
                    )}

                    {error && (
                        <div className="status-message error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="spinner" size={18} />
                                <span>Creating...</span>
                            </>
                        ) : (
                            <span>Create Database</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateDatabase;
