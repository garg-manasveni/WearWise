import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PlaceholderPage from "./pages/PlaceholderPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

const placeholderPages = [
  { path: "wardrobe", title: "My Wardrobe", eyebrow: "Your collection" },
  { path: "outfit-finder", title: "Outfit Finder", eyebrow: "A little inspiration" },
  { path: "outfit-studio", title: "Outfit Studio", eyebrow: "Your styling space" },
  { path: "style-profile", title: "My Style Profile", eyebrow: "Getting to know you" },
];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {placeholderPages.map((page) => (
            <Route
              key={page.path}
              path={`/${page.path}`}
              element={<PlaceholderPage {...page} />}
            />
          ))}
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
