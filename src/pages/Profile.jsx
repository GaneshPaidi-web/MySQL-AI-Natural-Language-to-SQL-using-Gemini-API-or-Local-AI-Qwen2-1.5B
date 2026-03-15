import { useState, useEffect } from "react";
import { User, Mail, Calendar, ShieldCheck, Camera } from "lucide-react";
import "./Profile.css";

function Profile() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    if (!user) {
        return <div className="profile-loading">Loading profile...</div>;
    }

    // Format date if available
    const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : "Recently";

    return (
        <div className="profile-wrapper">
            <div className="profile-card">
                <div className="profile-cover"></div>
                <div className="profile-header">
                    <div className="avatar-section">
                        <div className="profile-avatar">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <button className="change-avatar-btn">
                            <Camera size={16} />
                        </button>
                    </div>
                    <div className="profile-intro">
                        <h2>{user.name}</h2>
                        <p className="profile-role">Beta Tester</p>
                    </div>
                </div>

                <div className="profile-info-grid">
                    <div className="info-item">
                        <div className="info-icon">
                            <User size={20} />
                        </div>
                        <div className="info-content">
                            <label>Full Name</label>
                            <p>{user.name}</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">
                            <Mail size={20} />
                        </div>
                        <div className="info-content">
                            <label>Email Address</label>
                            <p>{user.email}</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">
                            <Calendar size={20} />
                        </div>
                        <div className="info-content">
                            <label>Member Since</label>
                            <p>{joinedDate}</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">
                            <ShieldCheck size={20} />
                        </div>
                        <div className="info-content">
                            <label>Account Status</label>
                            <p className="status-verified">Verified</p>
                        </div>
                    </div>
                </div>

                <div className="profile-actions">
                    {/* <button className="edit-profile-btn" onClick={() => window.location.href='/settings'}>Edit Profile</button> */}
                </div>
            </div>
        </div>
    );
}

export default Profile;
