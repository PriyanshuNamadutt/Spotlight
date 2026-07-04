import React from "react";

import { AuthProvider } from "./context/AuthContext";
import { useRoute } from "./utils/useRoute";

import AboutPage from "./pages/AboutPage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";

// ─── App ────────────────────────────────────────────────────────────────────
// Hash-based routing:
//   "/"  or "/about"   -> About page (landing/marketing)
//   "/auth"            -> Login / Register
//   "/home"            -> Live demo (pulse check)
//   "/profile"         -> View profile (requires login)
//   "/edit-profile"    -> Edit profile (requires login)

export default function App() {
  const { path, navigate } = useRoute();

  const routes = {
    "/": <AboutPage navigate={navigate} />,
    "/about": <AboutPage navigate={navigate} />,
    "/auth": <AuthPage navigate={navigate} />,
    "/home": <HomePage navigate={navigate} />,
    "/profile": <ProfilePage navigate={navigate} />,
    "/edit-profile": <EditProfilePage navigate={navigate} />,
  };

  return <AuthProvider>{routes[path] || <AboutPage navigate={navigate} />}</AuthProvider>;
}