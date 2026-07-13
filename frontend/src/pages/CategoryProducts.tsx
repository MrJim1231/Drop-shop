import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { api, CategoryData, ProductData } from "../api/client";
import ProductCard from "../components/ProductCard";
import { slugify } from "../utils";
import { ChevronRight, Filter } from "lucide-react";

const PAGE_SIZE = 16;

export const CategoryProducts: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const categoryId = Number(id?.split("-")[0]);

  const [category, setCategory] = useState<CategoryData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1") || 1;

  // Filter States
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [suppliersList, setSuppliersList] = useState<string[]>([]);

  // Fetch Category Details
  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);
    
    // Reset filters
    setPriceMin("");
    setPriceMax("");
    setSelectedSuppliers([]);

    api.getCategory(categoryId)
      .then((catData) => {
        setCategory(catData);

        if (catData.subcategories && catData.subcategories.length > 0) {
          // It's a parent category: just display subcategories, no products needed
          setProducts([]);
          setFilteredProducts([]);
          setLoading(false);
        } else {
          // Leaf category: fetch products
          api.getProductsByCategory(categoryId)
            .then((prodData) => {
              setProducts(prodData);
              setFilteredProducts(prodData);
              // Extract unique suppliers list
              const sups = [...new Set(prodData.map((p) => p.supplier || "Інші / Невідомо"))].filter(Boolean);
              setSuppliersList(sups);
              setLoading(false);
            })
            .catch((err) => {
              console.error("Products load error:", err);
              setLoading(false);
            });
        }
      })
      .catch((err) => {
        console.error("Category data load error:", err);
        setLoading(false);
      });
  }, [categoryId]);

  // Apply filters locally on state changes
  const applyFilters = () => {
    let result = [...products];

    const min = parseFloat(priceMin);
    if (!isNaN(min)) {
      result = result.filter((p) => p.price >= min);
    }

    const max = parseFloat(priceMax);
    if (!isNaN(max)) {
      result = result.filter((p) => p.price <= max);
    }

    if (selectedSuppliers.length > 0) {
      result = result.filter((p) => selectedSuppliers.includes(p.supplier || "Інші / Невідомо"));
    }

    setFilteredProducts(result);
    setSearchParams({ page: "1" });
    setMobileFiltersOpen(false);
  };

  const resetFilters = () => {
    setPriceMin("");
    setPriceMax("");
    setSelectedSuppliers([]);
    setFilteredProducts(products);
    setSearchParams({ page: "1" });
    setMobileFiltersOpen(false);
  };

  const handleSupplierChange = (sup: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(sup) ? prev.filter((s) => s !== sup) : [...prev, sup]
    );
  };

  // Pagination calculations
  const total = filteredProducts.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const page = Math.max(1, Math.min(currentPage, totalPages || 1));
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageProducts = filteredProducts.slice(start, end);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageNumbers: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pageNumbers.push(i);
    } else if (pageNumbers[pageNumbers.length - 1] !== "...") {
      pageNumbers.push("...");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Категорію не знайдено.</p>
      </div>
    );
  }

  const isParentCategory = category.subcategories && category.subcategories.length > 0;

  const renderFilterPanel = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-3">Ціна, грн</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Від"
            className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-indigo-150"
          />
          <span className="text-slate-400 text-xs">—</span>
          <input
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="До"
            className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-indigo-150"
          />
        </div>
      </div>

      {/* Suppliers */}
      {suppliersList.length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-3">Постачальник</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {suppliersList.map((sup) => (
              <label key={sup} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSuppliers.includes(sup)}
                  onChange={() => handleSupplierChange(sup)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-800"
                />
                <span>{sup}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
        <button
          onClick={applyFilters}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
        >
          Застосувати
        </button>
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
        >
          Скинути
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-enter max-w-7xl mx-auto py-4">
      {/* Breadcrumbs */}
      <nav className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex items-center flex-wrap gap-1">
        <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">Головна</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/categories" className="hover:text-indigo-600 dark:hover:text-indigo-400">Каталог</Link>
        {category.parent_category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              to={`/category/${category.parent_category.id}-${slugify(category.parent_category.name)}`}
              className="hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {category.parent_category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 dark:text-slate-200 font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8" id="category-header">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{category.name}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          {isParentCategory
            ? `${category.subcategories?.length} підкатегорій`
            : `${filteredProducts.length} товарів`}
        </p>
      </div>

      {/* Mobile Filters Header */}
      {!isParentCategory && products.length > 0 && (
        <div className="lg:hidden flex items-center justify-between mb-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl p-3">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-indigo-500" /> Фільтри та характеристики
          </span>
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg shadow-sm hover:bg-indigo-755 cursor-pointer"
          >
            {mobileFiltersOpen ? "Приховати" : "Показати"}
          </button>
        </div>
      )}

      {/* Mobile Filters Drawer */}
      {!isParentCategory && mobileFiltersOpen && (
        <div className="lg:hidden mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-md">
          {renderFilterPanel()}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar (Desktop) */}
        <aside className="lg:col-span-1 hidden lg:block">
          {isParentCategory ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider mb-4">
                Підкатегорії
              </h3>
              <ul className="space-y-2 pl-1">
                {category.subcategories?.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      to={`/category/${sub.id}-${slugify(sub.name)}`}
                      className="block py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : products.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm sticky top-20">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider mb-4">
                Фільтрація
              </h3>
              {renderFilterPanel()}
            </div>
          ) : null}
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {isParentCategory ? (
            <div>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Оберіть підкатегорію</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {category.subcategories?.map((sub) => (
                  <Link
                    key={sub.id}
                    to={`/category/${sub.id}-${slugify(sub.name)}`}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden hover:shadow-lg hover:border-indigo-200 dark:hover:border-white/10 transition-all flex flex-col justify-between"
                  >
                    <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-950 overflow-hidden">
                      <img
                        src={sub.image || `https://placehold.co/400x300/f1f5f9/94a3b8?text=${encodeURIComponent(sub.name)}`}
                        alt={sub.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-sm">
                        {sub.name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {products.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-16">
                  У цій категорії поки немає товарів
                </p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-16">
                  Не знайдено товарів за обраними фільтрами
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {pageProducts.map((prod) => (
                      <ProductCard key={prod.id} product={prod} />
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
                            <span className="font-bold text-slate-800 dark:text-slate-200">{total}</span> товарів
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
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryProducts;
