import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Monitor     from "./pages/Monitor";
import Reports     from "./pages/Reports";
import Insights    from "./pages/Insights";
import Settings    from "./pages/Settings";
import MainLayout  from "./layouts/MainLayout";

import { isAuthenticated } from "./utils/auth";


//  Public Route
const PublicRoute = ({ children }) => {
  return isAuthenticated() ? <Navigate to="/monitor" replace /> : children;
};

//  Protected Route
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/" replace />;
};


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public — redirect to /monitor if already logged in */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />

        {/* Protected layout — bounces to "/" if not logged in */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* /monitor is the default page after login */}
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/reports"        element={<Reports />} />
          <Route path="/insights"       element={<Insights />} />
          <Route path="/settings"       element={<Settings />} />

          {/* Any unknown protected path → monitor */}
          <Route path="*" element={<Navigate to="/monitor" replace />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;