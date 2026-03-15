import { useState, useEffect } from "react";
import { Trash2, Shield, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import "./DeleteDatabase.css";

function DeleteDatabase() {
    const [dbList, setDbList] = useState([]);
    const [selectedDb, setSelectedDb] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const fetchDatabases = async () => {
        setFetching(true);
        try {
            const response = await fetch("http://localhost:5000/api/databases");
            const data = await response.json();
            if (data.success) {
                setDbList(data.databases);
            }
        } catch (err) {
            console.error("Failed to fetch databases:", err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchDatabases();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedDb) {
            setError("Please select or enter a database name.");
            return;
        }

        if (!window.confirm(`Are you absolutely sure you want to delete the database "${selectedDb}"? This action cannot be undone.`)) {
            return;
        }

        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch("http://localhost:5000/api/delete-database", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ dbName: selectedDb, password }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage(data.message);
                setSelectedDb("");
                setPassword("");
                fetchDatabases(); // Refresh the list
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
        <div className="delete-db-page">
            <div className="delete-db-card">
                <div className="card-header danger">
                    <div className="icon-wrapper danger">
                        <Trash2 className="header-icon" />
                    </div>
                    <h1>Delete Database</h1>
                    <p>Permanently remove a MySQL database from the server. This action is irreversible.</p>
                </div>

                <form className="delete-db-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="dbName">Select Database</label>
                        <div className="input-container">
                            <RefreshCw 
                                className={`refresh-icon ${fetching ? 'spinning' : ''}`} 
                                size={18} 
                                onClick={fetchDatabases}
                            />
                            <select
                                id="dbName"
                                value={selectedDb}
                                onChange={(e) => setSelectedDb(e.target.value)}
                                required
                            >
                                <option value="">-- Choose a database --</option>
                                {dbList.map(db => (
                                    <option key={db} value={db}>{db}</option>
                                ))}
                            </select>
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
                        <p className="field-note warning">Required to authorize permanent deletion via DB credentials.</p>
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

                    <button type="submit" className="submit-btn delete" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="spinner" size={18} />
                                <span>Deleting...</span>
                            </>
                        ) : (
                            <span>Delete Database</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default DeleteDatabase;
