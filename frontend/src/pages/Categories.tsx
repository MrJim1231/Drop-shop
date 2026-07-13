import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, CategoryData } from "../api/client";
import { slugify } from "../utils";
import { ChevronRight } from "lucide-react";

const PAGE_SIZE = 16;

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get("page") || "1") || 1;

  useEffect(() => {
    api.getCategories()
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Categories page load error:", err);
        setLoading(false);
      });
  }, []);

  const total = categories.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  
  const page = Math.max(1, Math.min(currentPage, totalPages || 1));
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageCategories = categories.slice(start, end);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate pagination pages with ellipses
  const pageNumbers: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pageNumbers.push(i);
    } else if (pageNumbers[pageNumbers.length - 1] !== "...") {
      pageNumbers.push("...");
    }
  }

  // Sidebar tree rendering
  const renderSidebar = () => (
    <aside className="lg:col-span-1 hidden lg:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm h-fit">
      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider mb-4">
        Категорії
      </h3>
      <ul className="space-y-3 pl-1">
        {categories.map((c) => {
          const hasSub = Array.isArray(c.subcategories) && c.subcategories.length > 0;
          return (
            <li key={c.id} className="space-y-1">
              <Link
                to={`/category/${c.id}-${slugify(c.name)}`}
                className="group flex items-center justify-between text-xs py-1 transition-colors text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"
              >
                <span>{c.name}</span>
                {hasSub && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );

  return (
    <div className="page-enter max-w-7xl mx-auto py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Каталог категорій</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Оберіть розділ для перегляду товарів</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          {renderSidebar()}

          {/* Main Grid */}
          <div className="lg:col-span-3">
            {categories.length === 0 ? (
              <p className="text-center text-slate-500 py-12">Категорії не знайдені.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {pageCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.id}-${slugify(cat.name)}`}
                      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden hover:shadow-lg hover:border-indigo-200 dark:hover:border-white/10 transition-all flex flex-col justify-between"
                    >
                      <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-950 overflow-hidden">
                        <img
                          src={cat.image || `https://placehold.co/400x300/f1f5f9/94a3b8?text=${encodeURIComponent(cat.name)}`}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm">
                          {cat.name}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 px-4 py-4 sm:px-6 rounded-2xl shadow-sm border mt-8">
                    {/* Mobile Pagination */}
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                      >
                        Назад
                      </button>
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        className="relative ml-3 inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                      >
                        Вперед
                      </button>
                    </div>

                    {/* Desktop Pagination */}
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-700 dark:text-slate-400">
                          Показано від <span className="font-bold text-slate-800 dark:text-slate-200">{start + 1}</span> до{" "}
                          <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(end, total)}</span> з{" "}
                          <span className="font-bold text-slate-800 dark:text-slate-200">{total}</span> категорій
                        </p>
                      </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-1 gap-1" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                          >
                            <span className="sr-only">Previous</span>
                            <ChevronRight className="h-5 w-5 rotate-180" />
                          </button>

                          {pageNumbers.map((n, idx) => {
                            if (n === "...") {
                              return (
                                <span
                                  key={`dots-${idx}`}
                                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-400"
                                >
                                  ...
                                </span>
                              );
                            }
                            const isCurrent = n === page;
                            return (
                              <button
                                key={`page-${n}`}
                                onClick={() => handlePageChange(n as number)}
                                className={`relative inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                                  isCurrent
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:text-indigo-600"
                                }`}
                              >
                                {n}
                              </button>
                            );
                          })}

                          <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 disabled:opacity-30 cursor-pointer"
                          >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
