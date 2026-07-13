import React, { useState, useEffect } from "react";
import { api, UserData } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { showToast } from "../utils";
import { KeyRound, Save, Lock } from "lucide-react";

export const Profile: React.FC = () => {
  const { authState, isAuthenticated } = useAuth();
  const userId = authState.userId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserData>({
    email: "",
    name: "",
    phone: "",
    address: "",
    is_admin: false,
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    if (!userId) return;
    api.getProfile(userId)
      .then((res) => {
        if (res.status === "success" && res.data) {
          setProfile(res.data);
        } else {
          showToast(res.message || "Не вдалося завантажити профіль", "error");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Load profile error:", err);
        showToast(err.message || "Помилка завантаження даних", "error");
        setLoading(false);
      });
  }, [userId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    try {
      const res = await api.updateProfile({
        userId,
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
      });

      if (res.status === "success") {
        showToast("Профіль успішно оновлено!");
      } else {
        showToast(res.message || "Помилка оновлення", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Не вдалося оновити профіль", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showToast("Нові паролі не співпадають", "error");
    }

    setChangingPass(true);
    try {
      const res = await api.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      if (res.status === "success") {
        showToast("Пароль успішно змінено!");
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        showToast(res.message || "Помилка зміни паролю", "error");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Не вдалося змінити пароль", "error");
    } finally {
      setChangingPass(false);
    }
  };

  if (!isAuthenticated || !userId) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-8 shadow-sm max-w-2xl mx-auto">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Доступ обмежено</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 mb-8">
          Будь ласка, увійдіть у свій акаунт, щоб переглянути профіль
        </p>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-4xl mx-auto py-4 grid grid-cols-1 md:grid-cols-3 gap-8">
      
      {/* Profile Info Form */}
      <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 md:p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Мій профіль</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
          Керуйте своїми персональними даними для швидкого оформлення замовлень
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-500 cursor-not-allowed outline-none text-sm"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Email адресу не можна змінити, оскільки вона прив'язана до вашого акаунту
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Ім'я та Прізвище
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                placeholder="Введіть ваше ім'я"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:ring-2 focus:ring-indigo-150 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Телефон
              </label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                placeholder="+380..."
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:ring-2 focus:ring-indigo-150 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Адреса доставки за замовчуванням
              </label>
              <textarea
                name="address"
                rows={3}
                value={profile.address}
                onChange={handleInputChange}
                placeholder="Місто, Нова Пошта №"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:ring-2 focus:ring-indigo-150 outline-none text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? "Збереження..." : "Зберегти зміни"}
            </button>
          </form>
        )}
      </div>

      {/* Change Password Panel */}
      <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm h-fit">
        <h2 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-indigo-500" /> Безпека
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Ви можете оновити пароль для входу у свій кабінет
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-650 dark:text-slate-405 mb-1">
              Поточний пароль
            </label>
            <input
              type="password"
              name="oldPassword"
              required
              value={passwordData.oldPassword}
              onChange={handlePasswordChangeInput}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-150 outline-none text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-655 dark:text-slate-405 mb-1">
              Новий пароль
            </label>
            <input
              type="password"
              name="newPassword"
              required
              minLength={6}
              value={passwordData.newPassword}
              onChange={handlePasswordChangeInput}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-150 outline-none text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-655 dark:text-slate-405 mb-1">
              Підтвердження нового паролю
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              value={passwordData.confirmPassword}
              onChange={handlePasswordChangeInput}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-150 outline-none text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={changingPass}
            className="w-full py-2.5 bg-slate-900 hover:bg-indigo-650 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            {changingPass ? "Зміна..." : "Змінити пароль"}
          </button>
        </form>
      </div>

    </div>
  );
};

export default Profile;
