export function renderFooter() {
  return `
    <footer class="bg-slate-900 text-slate-300 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
              <span class="font-bold text-lg text-white">DropShop</span>
            </div>
            <p class="text-sm text-slate-400 leading-relaxed">Інтернет-магазин з широким асортиментом товарів. Доставка по всій Україні.</p>
          </div>
          <div>
            <h4 class="font-semibold text-white mb-4">Навігація</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="/" class="hover:text-white transition-colors">Головна</a></li>
              <li><a href="/categories" class="hover:text-white transition-colors">Каталог</a></li>
              <li><a href="/cart" class="hover:text-white transition-colors">Кошик</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold text-white mb-4">Контакти</h4>
            <ul class="space-y-2 text-sm">
              <li>📞 +380 (XX) XXX-XX-XX</li>
              <li>✉️ info@dropshop.ua</li>
              <li>🕐 Пн–Пт: 9:00–18:00</li>
            </ul>
          </div>
        </div>
        <div class="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
          © ${new Date().getFullYear()} DropShop. Всі права захищені.
        </div>
      </div>
    </footer>`
}
