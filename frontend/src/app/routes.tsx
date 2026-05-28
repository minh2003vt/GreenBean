import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { HomePage } from "@/pages/HomePage";
import { VideoPage } from "@/pages/VideoPage";
import { MarketPage } from "@/pages/MarketPage";
import { RewardsPage } from "@/pages/RewardsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ProblemDetailPage } from "@/pages/ProblemDetailPage";
import { LoginPage } from "@/pages/LoginPage";
import { AdminPage } from "@/pages/AdminPage";

function ProtectedUser({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="admin" element={<AdminPage />} />
      <Route element={<ProtectedUser><AppShell /></ProtectedUser>}>
        <Route index element={<HomePage />} />
        <Route path="history" element={<VideoPage />} />
        <Route path="market" element={<MarketPage />} />
        <Route path="rewards" element={<RewardsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="problems/:slug" element={<ProblemDetailPage />} />
      </Route>
    </Routes>
  );
}
