import { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { MessageSquare, Settings, User as UserIcon, LogOut, Info, Database, PlusCircle, Trash2 } from "lucide-react";
import "./DashboardLayout.css";

function DashboardLayout() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            navigate("/login");
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const navItems = [
        { path: "/dashboard", label: "Chat", icon: MessageSquare },
        { path: "/dashboard/about", label: "About", icon: Info },
        { path: "/dashboard/settings", label: "Settings", icon: Settings },
        { path: "/dashboard/profile", label: "Profile", icon: UserIcon },
        { path: "/dashboard/create-db", label: "Create DB", icon: PlusCircle },
        { path: "/dashboard/delete-db", label: "Delete DB", icon: Trash2 },
    ];

    if (!user) return null;

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Database className="logo-icon" />
                    <h2>MYSQL AI</h2>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
                            onClick={() => navigate(item.path)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item logout" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                {/* Top Header */}
                <header className="top-header">
                    <div className="header-greeting">
                        <h1>Hello, {user.name} 👋</h1>
                        <p>What would you like to query today?</p>
                    </div>
                    <div className="header-actions">
                        <div className="user-avatar">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Dynamic Content Views */}
                <div className="content-view">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default DashboardLayout;
