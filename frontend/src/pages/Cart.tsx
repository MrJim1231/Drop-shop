import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { formatPrice, showToast } from "../utils";
import { Trash2, ShoppingCart, Plus, Minus, ArrowRight } from "lucide-react";

export const Cart: React.FC = () => {
  const {
    cartItems,
    cartCount,
    cartTotal,
    updateQuantity,
    removeItem,
    clearCart,
    ensureGuestUserId,
  } = useCart();

  const { isAuthenticated, authState } = useAuth();
  const navigate = useNavigate();

  // Checkout Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill user profile fields if authenticated
  useEffect(() => {
    if (isAuthenticated && authState.userId) {
      api.getProfile(authState.userId)
        .then((res) => {
          if (res && res.status === "success" && res.data) {
            setFormData({
              name: res.data.name || "",
              phone: res.data.phone || "",
              email: res.data.email || "",
              address: res.data.address || "",
              comment: "",
            });
          }
        })
        .catch((err) => console.error("Error loading profile for checkout:", err));
    }
  }, [isAuthenticated, authState.userId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setSubmitting(true);
    try {
      const activeUserId = isAuthenticated && authState.userId ? authState.userId : await ensureGuestUserId();

      const orderPayload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        comment: formData.comment,
        items: cartItems.map((item) => ({
          product_id: item.product_id || item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          size: item.size,
          rubber: !!item.rubber,
        })),
        total_price: cartTotal,
        user_id: activeUserId,
      };

      const result = await api.createOrder(orderPayload);

      if (result.status === "success") {
        if (result.userId) {
          localStorage.setItem("userId", result.userId);
        }
        showToast("Замовлення успішно оформлено! Перевірте ваш email.");
        
        // Clear cart
        clearCart();

        // Redirect to orders
        navigate("/orders");
      } else {
        showToast(result.message || "Помилка при оформленні замовлення", "error");
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || error.message || "Помилка оформлення", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRubber = (id: string, isRubber: boolean) => {
    // Write back to localStorage/state via setting it in context
    // In our context, we don't have a direct set method, but we can simulate by clearing and adding, or we can just modify item.rubber directly since it's an object reference!
    const found = cartItems.find(i => i.id === id);
    if (found) {
      found.rubber = isRubber;
      localStorage.setItem("cart", JSON.stringify(cartItems));
      window.dispatchEvent(new CustomEvent("cart-updated"));
      // Trigger state force re-render
      navigate(window.location.pathname, { replace: true });
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20 page-enter max-w-lg mx-auto">
        <ShoppingCart className="w-16 h-16 text-slate-350 dark:text-slate-700 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Кошик порожній</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 mb-8">Додайте товари з нашого каталогу</p>
        <Link
          to="/categories"
          className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-200"
        >
          Перейти до каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-7xl mx-auto py-4">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">Кошик</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-4 flex gap-4 shadow-sm"
            >
              <img
                src={item.image || "https://placehold.co/100x100/f1f5f9/94a3b8?text=?"}
                alt={item.name}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-950"
              />
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {item.name}
                  </h3>
                  {item.size && item.size !== "—" && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Розмір: {item.size}
                    </p>
                  )}
                  {/* Bedding elastic band option */}
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!item.rubber}
                      onChange={(e) => toggleRubber(item.id, e.target.checked)}
                      className="rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Простирадло на резинці</span>
                  </label>
                </div>
                
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-sm bg-slate-50 dark:bg-slate-950">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="qty-dec px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-650 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="qty-val px-3 py-1 border-x border-slate-200 dark:border-slate-800 min-w-[2rem] text-center font-bold text-slate-700 dark:text-slate-300">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="qty-inc px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-650 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => removeItem(item.id)}
                    className="remove-btn text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Видалити
                  </button>
                </div>
              </div>
              <div className="text-right flex flex-col justify-between items-end flex-shrink-0">
                <span className="text-indigo-650 dark:text-indigo-405 text-sm font-medium">
                  {formatPrice(item.price)}
                </span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Card + Checkout Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 shadow-sm sticky top-20">
            <h2 className="font-semibold text-slate-850 dark:text-slate-100 mb-4 text-lg">
              Оформлення
            </h2>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-2 text-sm">
              <span>Товарів:</span>
              <span>{cartCount} шт.</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-800 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
              <span>Разом:</span>
              <span className="text-indigo-600 dark:text-indigo-400">{formatPrice(cartTotal)}</span>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleCheckoutSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ім'я та Прізвище *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Отримувач"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-150 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Телефон *
                </label>
                <input
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+380..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-150 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Email *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="yourname@gmail.com"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-150 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Адреса доставки *
                </label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Місто, Нова Пошта №"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-150 outline-none text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Коментар до замовлення
                </label>
                <textarea
                  name="comment"
                  rows={2}
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="Необов'язково"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-150 outline-none text-sm resize-none"
                />
              </div>
              
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? "Оформлення..." : "Оформити замовлення"}
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;
