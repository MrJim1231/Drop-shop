import React, { useState, useEffect } from "react";
import { api, ProductData } from "../api/client";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";

export const Deals: React.FC = () => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDiscountedProducts()
      .then((res) => {
        setProducts(res.products || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Deals load error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-7xl mx-auto py-8 md:py-12">
      <div className="mb-10 text-center md:text-left">
        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 mb-4 uppercase tracking-widest border border-rose-100/60 dark:border-rose-900/30">
          🔥 Гарячі пропозиції
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
          Акційні товари
        </h1>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium">
          Купуйте постільну білизну та аксесуари за суперцінами зі знижкою до -50%
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 rounded-[2.5rem] p-8 max-w-2xl mx-auto shadow-sm">
          <div className="text-6xl mb-6">🏷️</div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Наразі немає активних акцій</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
            Завітайте пізніше або перегляньте наш каталог товарів, щоб знайти інші цікаві пропозиції.
          </p>
          <Link
            to="/categories"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 dark:shadow-none cursor-pointer"
          >
            Перейти до каталогу
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Deals;
