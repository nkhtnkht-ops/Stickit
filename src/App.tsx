import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Today from "@/pages/Today";
import Tomorrow from "@/pages/Tomorrow";
import Next7Days from "@/pages/Next7Days";
import All from "@/pages/All";
import Settings from "@/pages/Settings";
import Calendar from "@/pages/Calendar";
import Sticky from "@/pages/Sticky";
import Popout from "@/pages/Popout";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/popout" element={<Popout />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/today" element={<Today />} />
        <Route path="/tomorrow" element={<Tomorrow />} />
        <Route path="/next7" element={<Next7Days />} />
        <Route path="/all" element={<All />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/sticky" element={<Sticky />} />
      </Route>
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}
