import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

const Placeholder = ({ name }: { name: string }) => (
  <div className="p-8">
    <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
    <p className="font-mono text-xs text-ink-3 mt-2">// placeholder — Task 14-15 で TaskList を接続</p>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/today" element={<Placeholder name="今日" />} />
        <Route path="/tomorrow" element={<Placeholder name="明日" />} />
        <Route path="/next7" element={<Placeholder name="今後7日間" />} />
        <Route path="/all" element={<Placeholder name="すべて" />} />
      </Route>
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}
