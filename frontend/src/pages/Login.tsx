import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { showToast } from "../utils";

export const Login: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const { ensureGuestUserId } = useCart();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect to home if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "verify") {
        const result = await api.verifyEmail({ email, code });
        if (result.status === "success" && result.token && result.userId) {
          login(result.token, result.userId, false);
          showToast("Email підтверджено!");
          navigate("/");
        } else {
          showToast(result.message || "Невірний код", "error");
        }
      } else if (mode === "login") {
        const result = await api.login({ email, password });
        if (result.status === "success" && result.token && result.userId) {
          login(result.token, result.userId, !!result.isAdmin);
          showToast("Вітаємо!");
          navigate("/");
        } else if (result.status === "verification_required") {
          setMode("verify");
          showToast("Підтвердіть email — код надіслано", "info");
        } else {
          showToast(result.message || "Помилка входу", "error");
        }
      } else {
        // Registering
        const userId = await ensureGuestUserId();
        const result = await api.register({ email, password, userId });
        if (result.status === "success") {
          setMode("verify");
          showToast("Перевірте email для підтвердження");
        } else {
          showToast(result.message || "Помилка реєстрації", "error");
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Сталася помилка", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter max-w-md mx-auto py-12">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-2">
          {mode === "login" ? "Вхід" : mode === "register" ? "Реєстрація" : "Підтвердження email"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
          {mode === "login"
            ? "Увійдіть до свого акаунту"
            : mode === "register"
            ? "Створіть новий акаунт"
            : "Введіть код підтвердження з листа"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "verify" ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-350 mb-1">
                Код підтвердження
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-150 outline-none text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-355 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-150 outline-none text-sm"
                  placeholder="yourname@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-355 mb-1">
                  Пароль
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-150 outline-none text-sm"
                  placeholder="Мінімум 6 символів"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 cursor-pointer shadow-md"
          >
            {loading ? "Зачекайте..." : mode === "login" ? "Увійти" : mode === "register" ? "Зареєструватись" : "Підтвердити"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          {mode === "login" ? (
            <span className="text-slate-500">
              Немає акаунту?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-indigo-650 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
              >
                Зареєструватись
              </button>
            </span>
          ) : mode === "register" ? (
            <span className="text-slate-500">
              Вже є акаунт?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-indigo-650 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
              >
                Увійти
              </button>
            </span>
          ) : (
            <button
              onClick={() => setMode("login")}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer"
            >
              ← Повернутись до входу
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
