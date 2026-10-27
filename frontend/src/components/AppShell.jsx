import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navigation = [
  { to: "/dashboard", label: "Overview", number: "01" },
  { to: "/wardrobe", label: "My wardrobe", number: "02" },
  { to: "/outfit-finder", label: "Outfit finder", number: "03" },
  { to: "/outfit-studio", label: "Outfit studio", number: "04" },
  { to: "/style-profile", label: "Style profile", number: "05" },
];

export default function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <NavLink className="brand" to="/dashboard" aria-label="WearWise home">
          <span className="brand-mark">W</span>
          <span>wearwise<span className="brand-period">.</span></span>
        </NavLink>
        <p className="nav-caption">YOUR SPACE</p>
        <nav className="side-navigation" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
            >
              <span className="nav-number">{item.number}</span>
              {item.label}
              {item.to === "/dashboard" && <span className="nav-indicator" aria-hidden="true" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-rule" />
          <p>Wear what feels like you. Let the rest be a little quieter.</p>
        </div>
        <button className="sign-out-button" onClick={handleSignOut}>
          Sign out <span aria-hidden="true">↗</span>
        </button>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span>YOUR PERSONAL STYLIST</span>
            <span className="breadcrumb-dot">/</span>
            <span className="breadcrumb-current">WARDROBE JOURNAL</span>
          </div>
          <div className="topbar-user">
            <span className="user-name">{user?.name}</span>
            <span className="user-avatar" aria-hidden="true">{user?.name?.charAt(0).toUpperCase()}</span>
            <button className="mobile-sign-out" onClick={handleSignOut}>Sign out</button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-navigation" aria-label="Mobile navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `mobile-nav-link${isActive ? " is-active" : ""}`}
          >
            <span>{item.number}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
