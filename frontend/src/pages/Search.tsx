import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api, ProductData } from "../api/client";
import ProductCard from "../components/ProductCard";
import { ChevronRight } from "lucide-react";

export const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const currentPage = parseInt(searchParams.get("page") || "1") || 1;

  const [products, setProducts] = useState<ProductData[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setTotalPages(1);
      return;
    }

    setLoading(true);
    api.searchProducts(query, currentPage)
      .then((res) => {
        setProducts(res.products || []);
        setTotalPages(res.total_pages || 1);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Search products load error:", err);
        setProducts([]);
        setLoading(false);
      });
  }, [query, currentPage]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ q: query, page: String(newPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate pagination pages with ellipses
  const pageNumbers: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pageNumbers.push(i);
    } else if (pageNumbers[pageNumbers.length - 1] !== "...") {
      pageNumbers.push("...");
    }
  }

  return (
    <div className="page-enter max-w-7xl mx-auto py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Результати пошуку</h1>
        {query.trim() && (
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Пошуковий запит: "{query}"
          </p>
        )}
      </div>

      {!query.trim() ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-16">
          Будь ласка, введіть запит у пошуку.
        </p>
      ) : loading ? (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-16">
          Нічого не знайдено за запитом "{query}". Спробуйте інші слова.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 px-4 py-4 sm:px-6 rounded-2xl shadow-sm border mt-8">
              {/* Mobile Pagination */}
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  Назад
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  Вперед
                </button>
              </div>

              {/* Desktop Pagination */}
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-400">
                    Сторінка <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage}</span> з{" "}
                    <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-1 gap-1" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
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
                      const isCurrent = n === currentPage;
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
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
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
  );
};

export default Search;
