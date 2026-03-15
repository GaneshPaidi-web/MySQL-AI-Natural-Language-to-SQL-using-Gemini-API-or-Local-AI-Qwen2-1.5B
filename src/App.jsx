import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import UserLogin from "./pages/UserLogin";
import DBConnection from "./pages/DBConnection";
import DashboardLayout from "./layouts/DashboardLayout";
import Chat from "./Chat";
import { ThemeProvider } from "./ThemeContext";
import SettingsPage from "./pages/Settings";
import ProfilePage from "./pages/Profile";
import CreateDatabase from "./pages/CreateDatabase";
import DeleteDatabase from "./pages/DeleteDatabase";

// Placeholder components for other dashboard views
const About = () => <div><h2>About SQL AI</h2><p>This is a natural language to SQL chatbot.</p></div>;

function App() {
  const [connected, setConnected] = useState(false);

  return (
    <ThemeProvider>
      <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<UserLogin />} />

        {/* DB Connection - User must be logged in, but not necessarily connected to DB */}
        <Route
          path="/connect-db"
          element={<DBConnection setConnection={setConnected} />}
        />

        {/* Protected Dashboard Routes - User must be connected to DB */}
        <Route
          path="/dashboard"
          element={connected ? <DashboardLayout /> : <Navigate to="/connect-db" />}
        >
          <Route index element={<Chat />} />
          <Route path="about" element={<About />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="create-db" element={<CreateDatabase />} />
          <Route path="delete-db" element={<DeleteDatabase />} />
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
    </ThemeProvider>
  );
}

export default App;