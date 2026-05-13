import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/today"
        element={
          <ProtectedRoute>
            <div className="p-8 font-mono text-xs text-ink-3">// logged in (placeholder, Task 9 で Layout 実装)</div>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}
