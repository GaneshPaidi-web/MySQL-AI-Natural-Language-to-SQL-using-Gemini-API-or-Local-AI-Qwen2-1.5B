import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserLogin.css";

function UserLogin() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";

        try {
            const res = await fetch(`http://localhost:5000${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (data.success) {
                // Save user token and info
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                // Navigate to DB Connection step
                navigate("/connect-db");
            } else {
                alert("Authentication Failed: " + (data.message || "Unknown error"));
            }
        } catch (err) {
            alert("Server error. Is your backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>{isRegistering ? "Create Account" : "Welcome Back"}</h2>
                    <p>{isRegistering ? "Sign up to start chatting with your database" : "Log in to access your SQL AI Dashboard"}</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {isRegistering && (
                        <div className="input-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="John Doe"
                                value={form.name}
                                onChange={handleChange}
                                required={isRegistering}
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="name@company.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button className="auth-btn" type="submit" disabled={loading}>
                        {loading ? "Please wait..." : (isRegistering ? "Sign Up" : "Log In")}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
                        <span className="toggle-mode" onClick={() => setIsRegistering(!isRegistering)}>
                            {isRegistering ? "Log In" : "Sign Up"}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default UserLogin;
