import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api/client";
import { Search, Sun, Moon, ShoppingBag, Menu, X } from "lucide-react";

export const Header: React.FC = () => {
  const { authState, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync search input with URL query param on load
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (location.pathname === "/search") {
      setSearchQuery(q);
    } else {
      setSearchQuery("");
    }
  }, [location.pathname, searchParams]);

  // Sync admin status
  useEffect(() => {
    if (isAuthenticated && authState.userId) {
      api.getProfile(authState.userId)
        .then((res) => {
          if (res && res.status === "success" && res.data) {
            const isUserAdmin = !!res.data.is_admin;
            const currentStored = localStorage.getItem("isAdmin") === "true";
            if (isUserAdmin !== currentStored) {
              localStorage.setItem("isAdmin", isUserAdmin ? "true" : "false");
              // Trigger reload or context sync if needed
            }
          }
        })
        .catch((err) => {
          console.error("Error syncing admin status:", err);
        });
    }
  }, [isAuthenticated, authState.userId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const navLinkClass = (isActive: boolean) =>
    `relative text-sm font-medium px-1 py-1 transition-colors duration-200 ${
      isActive
        ? "text-indigo-600 dark:text-indigo-400"
        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
    }`;

  const activeIndicator = <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>;

  const isHomeActive = location.pathname === "/";
  const isCatalogActive =
    location.pathname === "/categories" ||
    location.pathname.startsWith("/category/") ||
    location.pathname.startsWith("/product/");
  const isOrdersActive = location.pathname === "/orders";
  const isProfileActive = location.pathname === "/profile";
  const isAdminActive = location.pathname === "/admin";

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-200/60 dark:border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-5">
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-indigo-200/50 dark:shadow-indigo-950/50 group-hover:shadow-indigo-300/60 group-hover:scale-105 transition-all duration-200">
                D
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white hidden sm:block tracking-tight">
                Drop<span className="text-indigo-600 dark:text-indigo-400">Shop</span>
              </span>
            </Link>
          </div>

          {/* Search Box - Desktop */}
          <div className="flex-1 max-w-md mx-6 hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук товарів..."
                className="w-full pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-300 dark:focus:border-indigo-700 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-950/50 rounded-xl text-sm outline-none transition-all duration-200 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
            </form>
          </div>

          {/* Navigation links - Desktop */}
          <nav className="hidden md:flex items-center gap-6 flex-shrink-0">
            <Link to="/" className={navLinkClass(isHomeActive)}>
              Головна {isHomeActive && activeIndicator}
            </Link>
            <Link to="/categories" className={navLinkClass(isCatalogActive)}>
              Каталог {isCatalogActive && activeIndicator}
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/orders" className={navLinkClass(isOrdersActive)}>
                  Замовлення {isOrdersActive && activeIndicator}
                </Link>
                <Link to="/profile" className={navLinkClass(isProfileActive)}>
                  Профіль {isProfileActive && activeIndicator}
                </Link>
                {authState.isAdmin && (
                  <Link to="/admin" className={navLinkClass(isAdminActive)}>
                    Адмінка {isAdminActive && activeIndicator}
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="text-sm text-slate-400 hover:text-red-500 transition-colors hidden sm:block px-2 py-1 font-medium cursor-pointer"
              >
                Вийти
              </button>
            ) : (
              <Link
                to="/login"
                className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors hidden sm:block px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl"
              >
                Увійти
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Змінити тему"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Shopping Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 group"
              aria-label="Кошик"
            >
              <ShoppingBag className="w-5 h-5 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-indigo-600 text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold shadow-sm shadow-indigo-200">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-600 dark:text-slate-400" /> : <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-slate-100 dark:border-white/5 pt-3 animate-fade-in-up">
            
            {/* Search Box - Mobile */}
            <form onSubmit={handleSearchSubmit} className="relative mb-3 px-1">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук товарів..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/40 rounded-xl text-sm outline-none transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
            </form>

            <nav className="flex flex-col gap-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-xl text-sm font-medium ${
                  isHomeActive
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                }`}
              >
                Головна
              </Link>
              <Link
                to="/categories"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-xl text-sm font-medium ${
                  isCatalogActive
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                }`}
              >
                Каталог
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium ${
                      isOrdersActive
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                    }`}
                  >
                    Замовлення
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium ${
                      isProfileActive
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                    }`}
                  >
                    Профіль
                  </Link>
                  {authState.isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium ${
                        isAdminActive
                          ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                      }`}
                    >
                      Адмінка
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-left cursor-pointer"
                  >
                    Вийти
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                >
                  Увійти
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
