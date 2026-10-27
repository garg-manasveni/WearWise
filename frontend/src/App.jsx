import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import WardrobePage from "./pages/WardrobePage.jsx";
import StyleProfilePage from "./pages/StyleProfilePage.jsx";
import OutfitFinderPage from "./pages/OutfitFinderPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/wardrobe" element={<WardrobePage />} />
          <Route path="/outfit-finder" element={<OutfitFinderPage />} />
          <Route path="/style-profile" element={<StyleProfilePage />} />
          <Route
            path="/outfit-studio"
            element={<PlaceholderPage title="Outfit Studio" eyebrow="Your styling space" />}
          />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
