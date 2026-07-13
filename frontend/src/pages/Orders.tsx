import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, OrderData } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils";
import { ShoppingBag } from "lucide-react";

export const Orders: React.FC = () => {
  const { authState, isAuthenticated } = useAuth();
  const { guestUserId } = useCart();
  
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  const activeUserId = isAuthenticated && authState.userId ? authState.userId : guestUserId;

  useEffect(() => {
    if (!activeUserId) {
      setLoading(false);
      return;
    }

    api.getOrders(activeUserId)
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Load orders error:", err);
        setLoading(false);
      });
  }, [activeUserId]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!activeUserId || orders.length === 0) {
    return (
      <div className="text-center py-20 page-enter max-w-lg mx-auto">
        <ShoppingBag className="w-16 h-16 text-slate-350 dark:text-slate-700 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Мої замовлення</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 mb-8">
          Оформіть замовлення, щоб побачити його історію тут
        </p>
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
    <div className="page-enter max-w-4xl mx-auto py-4">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">Мої замовлення</h1>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id || order.order_number}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm"
          >
            {/* Header info */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">
                  Замовлення {order.order_number}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(order.created_at).toLocaleDateString("uk-UA", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {formatPrice(order.total_price)}
              </p>
            </div>

            {/* Details and items */}
            <div className="p-6">
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 mb-4">
                <p>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Отримувач:</span> {order.name}
                </p>
                <p>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Телефон:</span> {order.phone}
                </p>
                <p>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Адреса доставки:</span> {order.address}
                </p>
                {order.comment && (
                  <p>
                    <span className="font-medium text-slate-800 dark:text-slate-200">Коментар:</span> {order.comment}
                  </p>
                )}
              </div>

              {order.items && order.items.length > 0 && (
                <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-950 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-bold flex-shrink-0">
                          No photo
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {item.name}
                        </p>
                        <p className="text-slate-500 dark:text-slate-450 text-xs">
                          {item.quantity} шт. × {formatPrice(item.price)}
                          {item.size && item.size !== "—" && ` | Розмір: ${item.size}`}
                          {item.rubber ? " | На резинці" : ""}
                        </p>
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
