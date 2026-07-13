import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api, CategoryData, ProductData } from "../api/client";
import ProductCard from "../components/ProductCard";
import { slugify } from "../utils";
import { ArrowLeft, ArrowRight, ShieldCheck, Truck, Headphones } from "lucide-react";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  link: string;
  btnText: string;
}

const slides: Slide[] = [
  {
    image: "/electronics_banner.webp",
    title: "Світ передової електроніки",
    subtitle: "Відкрийте для себе найсучасніші смартфони, навушники та смарт-гаджети за найкращими цінами.",
    link: "/categories",
    btnText: "Перейти до каталогу",
  },
  {
    image: "/accessories_banner.webp",
    title: "Преміальні аксесуари",
    subtitle: "Створіть свій неповторний образ із нашою колекцією годинників, окулярів та шкіряних виробів.",
    link: "/categories",
    btnText: "Обрати стиль",
  },
  {
    image: "/home_banner.webp",
    title: "Розумний та затишний дім",
    subtitle: "Інноваційні гаджети та побутова техніка для комфортного повсякденного життя.",
    link: "/categories",
    btnText: "Дивитись товари",
  },
];

export const Home: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [prodsLoading, setProdsLoading] = useState(true);
  const timerRef = useRef<any>(null);

  // Autoplay slider logic
  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, []);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    startTimer();
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    startTimer();
  };

  const handleDotClick = (idx: number) => {
    setCurrentSlide(idx);
    startTimer();
  };

  // Fetch initial data
  useEffect(() => {
    api.getCategories()
      .then((data) => {
        const rootIds = [
          1000001, 1000002, 1000003, 1000004, 1000005, 1000006, 1000007,
          1000008, 1000009, 1000010, 1000011, 1000012, 1000013, 1000014,
          1000015, 1000016, 1000017, 1000018, 1000019, 1000020,
        ];
        let roots = data.filter((c) => rootIds.includes(Number(c.id)));
        if (roots.length === 0) {
          roots = data;
        }
        setCategories(roots.slice(0, 8));
        setCatsLoading(false);
      })
      .catch((err) => {
        console.error("Home categories error:", err);
        setCatsLoading(false);
      });

    api.getProducts(1)
      .then((res) => {
        setProducts(res.products?.slice(0, 4) || []);
        setProdsLoading(false);
      })
      .catch((err) => {
        console.error("Home products error:", err);
        setProdsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-16 page-enter -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
      {/* Premium Banner / Slider */}
      <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-900/10 group border-b border-slate-200/60 dark:border-white/5 h-[500px] sm:h-[550px] md:h-[650px]">
        <div
          className="relative h-full flex transition-transform duration-700 ease-in-out"
          style={{
            width: `${slides.length * 100}%`,
            transform: `translateX(-${(currentSlide * 100) / slides.length}%)`,
          }}
        >
          {slides.map((s, idx) => (
            <div
              key={idx}
              className="w-full h-full relative flex-shrink-0 flex items-center overflow-hidden bg-slate-50 dark:bg-slate-950"
              style={{ width: `${100 / slides.length}%` }}
            >
              {/* Asymmetrical Image (Right Side) */}
              <div
                className="absolute top-0 right-0 w-[85%] md:w-[65%] h-full z-0 transition-transform duration-1000 ease-in-out transform scale-105 group-hover:scale-100"
                style={{ clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)" }}
              >
                <div className="absolute inset-0 bg-indigo-900/10 mix-blend-multiply z-10"></div>
                <img
                  src={s.image}
                  className="w-full h-full object-cover object-center"
                  alt={s.title}
                />
              </div>

              {/* Content Card (Left Side) */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-20 flex">
                <div
                  className={`w-full md:w-[55%] lg:w-[45%] transition-all duration-700 ease-out ${
                    idx === currentSlide
                      ? "translate-y-0 opacity-100"
                      : "translate-y-8 opacity-0"
                  }`}
                >
                  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 sm:p-12 rounded-[2rem] shadow-2xl border border-white/80 dark:border-white/5 relative overflow-hidden">
                    {/* Decorative blur effects inside card */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-200 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-fuchsia-200 dark:bg-fuchsia-900/20 rounded-full mix-blend-multiply filter blur-2xl opacity-60"></div>

                    <div className="relative z-10">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 mb-6 uppercase tracking-widest shadow-sm border border-indigo-200/50 dark:border-indigo-900/30">
                        ✨ Нова колекція
                      </span>
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-5">
                        {s.title}
                      </h1>
                      <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-8">
                        {s.subtitle}
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <Link
                          to={s.link}
                          className="inline-flex items-center px-7 py-3.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all duration-300 shadow-xl shadow-slate-900/20 hover:-translate-y-1"
                        >
                          {s.btnText}
                        </Link>
                        <Link
                          to="/categories"
                          className="inline-flex items-center px-7 py-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-all duration-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:-translate-y-1"
                        >
                          Каталог
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={handlePrevSlide}
          aria-label="Попередній слайд"
          className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md hover:bg-white dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 z-30 cursor-pointer hover:scale-110"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNextSlide}
          aria-label="Наступний слайд"
          className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md hover:bg-white dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 z-30 cursor-pointer hover:scale-110"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Indicator Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`slider-dot rounded-full transition-all duration-300 cursor-pointer shadow-sm ${
                idx === currentSlide
                  ? "bg-indigo-600 dark:bg-indigo-400 w-8 h-2.5"
                  : "bg-slate-350 dark:bg-slate-700 w-2.5 h-2.5"
              }`}
              aria-label={`Перейти до слайду ${idx + 1}`}
            ></button>
          ))}
        </div>
      </section>

      {/* Categories Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Категорії</h2>
          <Link
            to="/categories"
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            Всі категорії →
          </Link>
        </div>

        {catsLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-y-10 gap-x-6 justify-center">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}-${slugify(cat.name)}`}
                className="group flex flex-col items-center border-0 border-transparent outline-none focus:outline-none"
              >
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                  <div className="w-full h-full rounded-full overflow-hidden relative">
                    <img
                      src={cat.image || `https://placehold.co/150x150/f1f5f9/94a3b8?text=${encodeURIComponent(cat.name)}`}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  </div>
                </div>
                <span className="mt-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-center group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 max-w-[110px] leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Promos Section */}
      <section className="w-full bg-slate-50 dark:bg-slate-900/10 py-12 md:py-16 border-t border-b border-slate-200/60 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Card 1 */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl group h-72 sm:h-80 md:h-[350px]">
              <img
                src="/accessories_banner.webp"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                alt="Знижка"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent"></div>
              <div className="relative z-10 p-8 sm:p-12 flex flex-col justify-center h-full w-[85%] sm:w-2/3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-4 uppercase tracking-widest w-fit">
                  Тільки сьогодні
                </span>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                  Знижка -20% на всі аксесуари
                </h3>
                <p className="text-sm text-slate-300 mb-8 font-medium">
                  Оновіть свій стиль за найкращими цінами.
                </p>
                <Link
                  to="/deals"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg w-fit group-hover:scale-105 duration-300"
                >
                  Обрати зараз
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl group h-72 sm:h-80 md:h-[350px]">
              <img
                src="/electronics_banner.webp"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                alt="Топ продажу"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent"></div>
              <div className="relative z-10 p-8 sm:p-12 flex flex-col justify-center h-full w-[85%] sm:w-2/3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 mb-4 uppercase tracking-widest w-fit">
                  🔥 Топ продажу
                </span>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                  Нові моделі смарт-техніки
                </h3>
                <p className="text-sm text-slate-300 mb-8 font-medium">
                  Найкращі гаджети для вашого комфорту.
                </p>
                <Link
                  to="/categories"
                  className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 w-fit group-hover:scale-105 duration-300"
                >
                  Переглянути
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Products */}
      <section className="bg-white dark:bg-slate-900/10 -mx-4 sm:-mx-6 lg:-mx-8 py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-8">Популярні товари</h2>
          
          {prodsLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              Товари ще не додані. Запустіть імпорт в панелі адміністратора.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 stagger-grid">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <div className="flex justify-center mt-12">
                <Link
                  to="/categories"
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5"
                >
                  Дивитись всі товари
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Middle Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-indigo-800 to-blue-900"></div>
          <img
            src="/electronics_banner.png"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 group-hover:scale-105 transition-transform duration-700 ease-in-out"
            alt="Promo background"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-transparent"></div>
          <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-24 lg:w-2/3">
            <span className="inline-flex items-center px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-full mb-6 tracking-wider uppercase backdrop-blur-md border border-white/25">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
              Супер пропозиція
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight drop-shadow-md">
              Знижки до -50% на техніку та аксесуари
            </h2>
            <p className="text-lg text-indigo-100 mb-8 max-w-xl leading-relaxed drop-shadow-sm">
              Оновіть свій арсенал гаджетів з нашими найкращими товарами. Акція діє лише до кінця тижня. Не проґавте свій шанс отримати преміальну якість за вигідною ціною!
            </p>
            <Link
              to="/deals"
              className="inline-flex items-center px-6 py-3.5 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 hover:scale-105 transition-all duration-305 shadow-xl shadow-black/20"
            >
              Переглянути акції
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Store Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-100 dark:border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-4 uppercase tracking-widest border border-indigo-100/80 dark:border-indigo-900/30">
            Переваги магазину
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-4">
            Наш сервіс — ваша впевненість
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-medium">
            Ми дбаємо про якість кожного замовлення та комфорт кожного клієнта
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900/60 rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 p-8 sm:p-10 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group text-center">
            <div className="absolute -right-16 -bottom-16 w-36 h-36 bg-blue-100/40 dark:bg-blue-900/10 rounded-full filter blur-2xl group-hover:bg-blue-100/60 dark:group-hover:bg-blue-900/20 transition-colors duration-300"></div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 mb-8 mx-auto transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight mb-3">Швидка доставка</h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Відправляємо замовлення протягом 1–3 робочих днів по всій території України зручним для вас способом.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900/60 rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 p-8 sm:p-10 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group text-center">
            <div className="absolute -right-16 -bottom-16 w-36 h-36 bg-emerald-100/40 dark:bg-emerald-900/10 rounded-full filter blur-2xl group-hover:bg-emerald-100/60 dark:group-hover:bg-emerald-900/20 transition-colors duration-300"></div>
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-8 mx-auto transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight mb-3">Гарантія якості</h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Ми працюємо виключно з оригінальними та ретельно перевіреними товарами від надійних виробників.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900/60 rounded-[2.5rem] border border-slate-200/60 dark:border-white/5 p-8 sm:p-10 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group text-center">
            <div className="absolute -right-16 -bottom-16 w-36 h-36 bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full filter blur-2xl group-hover:bg-indigo-100/60 dark:group-hover:bg-indigo-900/20 transition-colors duration-300"></div>
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 mb-8 mx-auto transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight mb-3">Підтримка 24/7</h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Наші професійні менеджери завжди готові оперативно допомогти вам з вибором та будь-якими питаннями.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
