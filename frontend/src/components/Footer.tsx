import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
              <span className="font-bold text-lg text-white">DropShop</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Інтернет-магазин з широким асортиментом товарів. Доставка по всій Україні.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Навігація</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Головна</Link></li>
              <li><Link to="/categories" className="hover:text-white transition-colors">Каталог</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Кошик</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Контакти</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>📞 +380 (XX) XXX-XX-XX</li>
              <li>✉️ info@dropshop.ua</li>
              <li>🕐 Пн–Пт: 9:00–18:00</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} DropShop. Всі права захищені.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
