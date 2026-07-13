import React, { useState, useEffect, useRef } from "react";
import { api, CategoryData, ProductData } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatPrice, showToast } from "../utils";
import {
  Upload,
  Database,
  FolderOpen,
  Trash2,
  AlertTriangle
} from "lucide-react";

type Tab = "import" | "discounts" | "categories" | "products";

export const AdminDashboard: React.FC = () => {
  const { authState, isAuthenticated } = useAuth();
  const userId = authState.userId;

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("import");

  // Stats State
  const [stats, setStats] = useState<{
    total_products: number;
    total_categories: number;
    suppliers: { name: string; count: number }[];
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Catalogs State
  const [catalogs, setCatalogs] = useState<{ name: string; size: string; uploaded_at: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Import Script Execution console state
  const [consoleVisible, setConsoleVisible] = useState(false);
  const [consoleTitle, setConsoleTitle] = useState("");
  const [importTerminalUrl, setImportTerminalUrl] = useState("");
  const consoleRef = useRef<HTMLDivElement>(null);

  // XML Import configurations
  const [xmlUrl, setXmlUrl] = useState("");
  const [resetDb, setResetDb] = useState(false);
  const [markupPercent, setMarkupPercent] = useState("0");

  // Category CRUD states
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [catName, setCatName] = useState("");
  const [catParentId, setCatParentId] = useState("");
  const [catImage, setCatImage] = useState("");
  const [uploadingCatImg, setUploadingCatImg] = useState(false);

  // Product CRUD states
  const [productsList, setProductsList] = useState<ProductData[]>([]);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  
  // Product Form Fields
  const [prodId, setProdId] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodAvailability, setProdAvailability] = useState("1");
  const [prodSize, setProdSize] = useState("");
  const [prodStock, setProdStock] = useState("10");
  const [prodWeight, setProdWeight] = useState("");
  const [prodSupplier, setProdSupplier] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [uploadingProdImg, setUploadingProdImg] = useState(false);

  // Discount states
  const [discountSearchQuery, setDiscountSearchQuery] = useState("");
  const [discountSearchResults, setDiscountSearchResults] = useState<ProductData[]>([]);
  const [activeDiscountedProducts, setActiveDiscountedProducts] = useState<ProductData[]>([]);

  // Authenticate Admin Access
  useEffect(() => {
    if (!userId || !isAuthenticated) {
      setAuthorized(false);
      return;
    }

    api.getProfile(userId)
      .then((res) => {
        if (res.status === "success" && res.data) {
          const email = res.data.email;
          const isAdmin = res.data.is_admin;
          if (isAdmin || email === "berolegnik@gmail.com" || email === "test@example.com") {
            setAuthorized(true);
          } else {
            setAuthorized(false);
          }
        } else {
          setAuthorized(false);
        }
      })
      .catch(() => setAuthorized(false));
  }, [userId, isAuthenticated]);

  const loadStats = () => {
    setLoadingStats(true);
    api.getStats()
      .then((res) => {
        if (res.status === "success" && res.data) setStats(res.data);
        setLoadingStats(false);
      })
      .catch(() => setLoadingStats(false));
  };

  const loadCatalogs = () => {
    api.getCatalogs()
      .then((data) => setCatalogs(data || []))
      .catch((err) => console.error(err));
  };

  const loadCategories = () => {
    api.adminGetCategories()
      .then((res) => {
        if (res.status === "success" && res.categories) setCategories(res.categories);
      })
      .catch((err) => console.error(err));
  };

  const loadDiscounted = () => {
    api.getDiscountedProducts()
      .then((res) => setActiveDiscountedProducts(res.products || []))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    if (authorized === true) {
      loadStats();
      loadCatalogs();
      loadCategories();
      loadDiscounted();
    }
  }, [authorized]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const handleCatalogUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("catalog", selectedFile);
    try {
      const res = await api.uploadCatalog(fd);
      if (res.status === "success") {
        showToast("Каталог успішно завантажено!");
        setSelectedFile(null);
        loadCatalogs();
        loadStats();
      } else {
        showToast(res.message || "Помилка завантаження", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Помилка завантаження", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCatalog = async (fileName: string) => {
    if (!window.confirm(`Видалити файл ${fileName}?`)) return;
    try {
      const res = await api.deleteCatalog(fileName);
      if (res.status === "success") {
        showToast("Каталог видалено");
        loadCatalogs();
      } else {
        showToast(res.message || "Не вдалося видалити", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleRunExcelImport = (fileName: string) => {
    const isReset = resetDb ? "1" : "0";
    const markup = parseFloat(markupPercent) || 0;
    const url = `/backend/scripts/import_products.php?file=${encodeURIComponent(fileName)}&reset=${isReset}${markup > 0 ? `&markup=${markup}` : ""}`;
    setConsoleTitle("import_products.php");
    setImportTerminalUrl(url);
    setConsoleVisible(true);
    setTimeout(() => consoleRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleRunXmlImport = () => {
    if (!xmlUrl.trim()) return showToast("Вкажіть посилання на XML фід", "error");
    const isReset = resetDb ? "1" : "0";
    const markup = parseFloat(markupPercent) || 0;
    const url = `/backend/scripts/import_xml.php?url=${encodeURIComponent(xmlUrl)}&reset=${isReset}${markup > 0 ? `&markup=${markup}` : ""}`;
    setConsoleTitle("import_xml.php");
    setImportTerminalUrl(url);
    setConsoleVisible(true);
    setTimeout(() => consoleRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleCategoryCrudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingCategory ? "update" : "create";
    const payload = {
      id: editingCategory?.id,
      name: catName,
      parent_id: catParentId ? Number(catParentId) : null,
      image: catImage,
    };
    try {
      const res = await api.adminCategoryCrud(action, payload);
      if (res.status === "success") {
        showToast(editingCategory ? "Категорію оновлено" : "Категорію створено");
        setCategoryFormOpen(false);
        setEditingCategory(null);
        setCatName("");
        setCatParentId("");
        setCatImage("");
        loadCategories();
      } else {
        showToast(res.message || "Помилка збереження", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleEditCategoryClick = (cat: CategoryData) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatParentId(cat.parent_id ? String(cat.parent_id) : "");
    setCatImage(cat.image || "");
    setCategoryFormOpen(true);
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!window.confirm("Видалити категорію? Товари втратять прив'язку!")) return;
    try {
      const res = await api.adminCategoryCrud("delete", { id: catId });
      if (res.status === "success") {
        showToast("Категорію видалено");
        loadCategories();
      } else {
        showToast(res.message || "Помилка", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCatImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingCatImg(true);
      const fd = new FormData();
      fd.append("image", e.target.files[0]);
      try {
        const res = await api.uploadImage(fd);
        if (res.status === "success" && res.url) {
          setCatImage(res.url);
          showToast("Зображення завантажено!");
        } else {
          showToast(res.message || "Помилка", "error");
        }
      } catch (err: any) {
        showToast(err.message, "error");
      } finally {
        setUploadingCatImg(false);
      }
    }
  };

  const handleSetDiscount = async (productId: string, discount: number) => {
    try {
      const res = await api.setDiscount(productId, discount);
      if (res.status === "success") {
        showToast(`Знижку ${discount}% встановлено`);
        loadDiscounted();
        setDiscountSearchResults((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, discount } : p))
        );
      } else {
        showToast(res.message || "Не вдалося встановити", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDiscountSearch = async () => {
    if (!discountSearchQuery.trim()) return;
    try {
      const res = await api.searchProductsAdmin(discountSearchQuery);
      setDiscountSearchResults(res || []);
    } catch (err: any) {
      showToast("Помилка при пошуку", "error");
    }
  };

  const handleProductSearch = async () => {
    if (!productSearchQuery.trim()) {
      api.getProducts(1).then((res) => setProductsList(res.products || []));
      return;
    }
    try {
      const res = await api.searchProductsAdmin(productSearchQuery);
      setProductsList(res || []);
    } catch (err: any) {
      showToast("Помилка пошуку", "error");
    }
  };

  useEffect(() => {
    if (activeTab === "products" && productsList.length === 0) {
      api.getProducts(1).then((res) => setProductsList(res.products || []));
    }
  }, [activeTab]);

  const handleProdImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingProdImg(true);
      const fd = new FormData();
      fd.append("image", e.target.files[0]);
      try {
        const res = await api.uploadImage(fd);
        if (res.status === "success" && res.url) {
          setProdImage(res.url);
          showToast("Зображення завантажено!");
        } else {
          showToast(res.message, "error");
        }
      } catch (err: any) {
        showToast(err.message, "error");
      } finally {
        setUploadingProdImg(false);
      }
    }
  };

  const handleProductCrudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = editingProduct ? "update" : "create";
    const payload = {
      id: prodId,
      name: prodName,
      price: parseFloat(prodPrice),
      category_id: Number(prodCategoryId),
      availability: Number(prodAvailability),
      size: prodSize,
      quantity_in_stock: Number(prodStock),
      weight: prodWeight ? parseFloat(prodWeight) : null,
      supplier: prodSupplier,
      description: prodDescription,
      image: prodImage,
    };
    try {
      const res = await api.adminProductCrud(action, payload);
      if (res.status === "success") {
        showToast(editingProduct ? "Товар оновлено" : "Товар додано");
        setProductFormOpen(false);
        setEditingProduct(null);
        setProdId("");
        setProdName("");
        setProdPrice("");
        setProdCategoryId("");
        setProdAvailability("1");
        setProdSize("");
        setProdStock("10");
        setProdWeight("");
        setProdSupplier("");
        setProdDescription("");
        setProdImage("");
        handleProductSearch();
        loadStats();
      } else {
        showToast(res.message || "Помилка збереження", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleEditProductClick = (prod: ProductData) => {
    setEditingProduct(prod);
    setProdId(prod.id);
    setProdName(prod.name);
    setProdPrice(String(prod.price));
    setProdCategoryId(String(prod.category_id));
    setProdAvailability(String(prod.availability === true || prod.availability === 1 ? "1" : "0"));
    setProdSize(prod.size || "");
    setProdStock(String(prod.quantity_in_stock));
    setProdWeight(prod.weight ? String(prod.weight) : "");
    setProdSupplier(prod.supplier || "");
    setProdDescription(prod.description || "");
    setProdImage(prod.image || "");
    setProductFormOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm(`Видалити товар ${productId}?`)) return;
    try {
      const res = await api.adminProductCrud("delete", { id: productId });
      if (res.status === "success") {
        showToast("Товар видалено");
        handleProductSearch();
        loadStats();
      } else {
        showToast(res.message || "Помилка", "error");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  if (authorized === null) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-8 shadow-sm">
        <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Доступ заборонено</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 mb-8">
          У вас немає прав доступу до панелі адміністратора.
        </p>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-7xl mx-auto py-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 p-6 md:p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-8 tracking-tight">
          Панель адміністратора
        </h1>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
          {(["import", "discounts", "categories", "products"] as Tab[]).map((tab) => {
            const labels: Record<Tab, string> = {
              import: "📥 Імпорт та статистика",
              discounts: "🏷️ Знижки",
              categories: "📁 Категорії",
              products: "🛍️ Товари",
            };
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setConsoleVisible(false);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-150/40"
                    : "bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {activeTab === "import" && (
          <div className="space-y-8">
            {loadingStats ? (
              <div className="flex justify-center py-6">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-indigo-50/50 dark:bg-slate-950/40 border border-indigo-100/80 dark:border-white/5 rounded-2xl p-5 flex items-center gap-4">
                    <Database className="w-8 h-8 text-indigo-500" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-455 font-semibold uppercase">Товарів</p>
                      <p className="text-2xl font-bold">{stats.total_products.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-indigo-50/50 dark:bg-slate-950/40 border border-indigo-100/80 dark:border-white/5 rounded-2xl p-5 flex items-center gap-4">
                    <FolderOpen className="w-8 h-8 text-indigo-500" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-455 font-semibold uppercase">Категорій</p>
                      <p className="text-2xl font-bold">{stats.total_categories.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-indigo-50/50 dark:bg-slate-950/40 border border-indigo-100/80 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-center">
                    <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Постачальники</p>
                    <div className="space-y-1 max-h-16 overflow-y-auto">
                      {stats.suppliers?.map((s, idx) => (
                        <div key={idx} className="flex justify-between text-xs font-semibold">
                          <span className="truncate max-w-[120px]">🔹 {s.name}</span>
                          <span className="bg-indigo-100 dark:bg-indigo-950 px-1 py-0.2 rounded font-bold text-[10px]">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 space-y-4">
                <h2 className="text-lg font-bold">1. Завантажити Excel-каталог</h2>
                <form onSubmit={handleCatalogUpload} className="space-y-4">
                  <div
                    onClick={() => document.getElementById("cat-file")?.click()}
                    className="border-2 border-dashed border-slate-350 dark:border-slate-800 rounded-xl p-6 text-center cursor-pointer bg-white dark:bg-slate-950"
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold">Виберіть .xlsx файл</p>
                    <input type="file" id="cat-file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
                  </div>
                  {selectedFile && (
                    <div className="flex justify-between bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                      <button type="button" onClick={() => setSelectedFile(null)} className="text-rose-500 font-bold">Видалити</button>
                    </div>
                  )}
                  <button type="submit" disabled={!selectedFile || uploading} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                    {uploading ? "Завантаження..." : "Завантажити файл"}
                  </button>
                </form>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 space-y-4">
                <h2 className="text-lg font-bold">2. Імпорт по XML/YML посиланню</h2>
                <div className="space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <input type="checkbox" checked={resetDb} onChange={(e) => setResetDb(e.target.checked)} className="rounded text-indigo-650" />
                    <div>
                      <p className="font-bold">Очистити базу перед імпортом</p>
                      <p className="text-slate-400">Видалить старі товари та категорії</p>
                    </div>
                  </label>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Націнка (%)</label>
                    <input type="number" min="0" value={markupPercent} onChange={(e) => setMarkupPercent(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl outline-none text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Посилання на XML</label>
                    <input type="url" value={xmlUrl} onChange={(e) => setXmlUrl(e.target.value)} placeholder="https://example.com/feed.xml" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl outline-none text-xs" />
                  </div>
                  <button onClick={handleRunXmlImport} className="w-full py-2.5 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm">
                    Імпортувати XML
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
              <h2 className="text-lg font-bold mb-4">3. Завантажені каталоги (.xlsx)</h2>
              {catalogs.length === 0 ? (
                <p className="text-center text-slate-500 py-6 text-xs">Немає завантажених файлів.</p>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-500">
                        <th className="py-2.5">Файл</th>
                        <th className="py-2.5">Розмір</th>
                        <th className="py-2.5">Завантажено</th>
                        <th className="py-2.5 text-right">Дії</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {catalogs.map((cat, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="py-3 font-semibold text-slate-800 dark:text-slate-250 truncate max-w-[200px]">📄 {cat.name}</td>
                          <td className="py-3 text-slate-500">{cat.size}</td>
                          <td className="py-3 text-slate-500">{cat.uploaded_at}</td>
                          <td className="py-3 text-right space-x-2">
                            <button onClick={() => handleRunExcelImport(cat.name)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-[10px]">Імпортувати</button>
                            <button onClick={() => handleDeleteCatalog(cat.name)} className="px-2 py-1 border border-red-200 text-red-500 rounded-md text-[10px]">Видалити</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {consoleVisible && (
              <div ref={consoleRef} className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm">Термінал імпорту (Лог виконання)</h3>
                </div>
                <div className="border border-slate-800 bg-slate-950 rounded-xl overflow-hidden">
                  <div className="bg-slate-800 px-4 py-1.5 text-xs font-mono text-slate-400">{consoleTitle}</div>
                  <iframe src={importTerminalUrl} className="w-full h-[350px] border-0" onLoad={loadStats}></iframe>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "discounts" && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 p-6 rounded-2xl space-y-4">
              <div className="flex gap-2">
                <input
                  type="search"
                  value={discountSearchQuery}
                  onChange={(e) => setDiscountSearchQuery(e.target.value)}
                  placeholder="Введіть артикул або назву товару..."
                  className="flex-grow px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs outline-none"
                />
                <button onClick={handleDiscountSearch} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Знайти</button>
              </div>

              {discountSearchResults.length > 0 && (
                <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4 max-h-64 overflow-y-auto">
                  {discountSearchResults.map((prod) => (
                    <div key={prod.id} className="flex justify-between items-center p-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-xs gap-3">
                      <img
                        src={prod.image || "https://placehold.co/40x40/f1f5f9/94a3b8?text=?"}
                        alt={prod.name}
                        className="w-10 h-10 object-contain rounded-lg bg-slate-50 border border-slate-100 shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x40/f1f5f9/94a3b8?text=?"; }}
                      />
                      <span className="truncate font-semibold flex-1">{prod.name} <span className="text-slate-400 font-normal">(SKU: {prod.id})</span></span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="90"
                          defaultValue={prod.discount || 0}
                          id={`disc-input-${prod.id}`}
                          className="w-12 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 text-center font-bold"
                        />
                        <button
                          onClick={() => {
                            const val = parseInt((document.getElementById(`disc-input-${prod.id}`) as HTMLInputElement)?.value) || 0;
                            handleSetDiscount(prod.id, val);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[10px] hover:bg-indigo-700"
                        >
                          Оновити
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h3 className="font-bold text-sm mb-3">Активні знижки на сайті ({activeDiscountedProducts.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                  {activeDiscountedProducts.map((p) => (
                    <div key={p.id} className="flex items-center p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs gap-2">
                      <img
                        src={p.image || "https://placehold.co/40x40/f1f5f9/94a3b8?text=?"}
                        alt={p.name}
                        className="w-9 h-9 object-contain rounded-lg bg-slate-50 border border-slate-100 shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x40/f1f5f9/94a3b8?text=?"; }}
                      />
                      <span className="truncate font-semibold flex-1">{p.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-rose-600 font-bold">-{p.discount}%</span>
                        <button onClick={() => handleSetDiscount(p.id, 0)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">Редактор категорій</h2>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCatName("");
                  setCatParentId("");
                  setCatImage("");
                  setCategoryFormOpen(!categoryFormOpen);
                }}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow"
              >
                {categoryFormOpen ? "Закрити форму" : "➕ Додати категорію"}
              </button>
            </div>

            {categoryFormOpen && (
              <form onSubmit={handleCategoryCrudSubmit} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-550 mb-1">Назва категорії</label>
                    <input type="text" required value={catName} onChange={(e) => setCatName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-555 mb-1">Батьківська категорія</label>
                    <select value={catParentId} onChange={(e) => setCatParentId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded-xl outline-none">
                      <option value="">Немає (Коренева)</option>
                      {categories.filter(c => !c.parent_id && c.id !== editingCategory?.id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-555 mb-1">Зображення категорії</label>
                  <div className="flex gap-2">
                    <input type="text" value={catImage} onChange={(e) => setCatImage(e.target.value)} className="flex-grow px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl outline-none" placeholder="Введіть URL..." />
                    <label className="px-3 py-2 bg-slate-800 text-white font-bold rounded-xl cursor-pointer">
                      <span>{uploadingCatImg ? "Завантаження..." : "Вибрати файл"}</span>
                      <input type="file" accept="image/*" onChange={handleCatImageFileChange} className="hidden" disabled={uploadingCatImg} />
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => { setCategoryFormOpen(false); setEditingCategory(null); }} className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg">Скасувати</button>
                  <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm">Зберегти</button>
                </div>
              </form>
            )}

            <div className="bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-xs overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-550">
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Зображення</th>
                    <th className="py-2 px-3">Назва</th>
                    <th className="py-2 px-3">Батьківська</th>
                    <th className="py-2 px-3 text-right">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="py-2.5 px-3 font-bold">{cat.id}</td>
                      <td className="py-2.5 px-3"><img src={cat.image || "https://placehold.co/40x40"} alt="" className="w-8 h-8 object-cover rounded bg-slate-50" /></td>
                      <td className="py-2.5 px-3 font-semibold">{cat.name}</td>
                      <td className="py-2.5 px-3 text-slate-500">{cat.parent_category?.name || "—"}</td>
                      <td className="py-2.5 px-3 text-right space-x-2">
                        <button onClick={() => handleEditCategoryClick(cat)} className="text-indigo-600 hover:text-indigo-800 font-bold">Редагувати</button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700 font-bold">Видалити</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="font-bold text-lg">Редактор товарів</h2>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProdId("");
                  setProdName("");
                  setProdPrice("");
                  setProdCategoryId("");
                  setProdAvailability("1");
                  setProdSize("");
                  setProdStock("10");
                  setProdWeight("");
                  setProdSupplier("");
                  setProdDescription("");
                  setProdImage("");
                  setProductFormOpen(!productFormOpen);
                }}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow"
              >
                {productFormOpen ? "Закрити форму" : "➕ Додати товар"}
              </button>
            </div>

            {productFormOpen && (
              <form onSubmit={handleProductCrudSubmit} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold mb-1">SKU (ID) *</label>
                    <input type="text" required disabled={!!editingProduct} value={prodId} onChange={(e) => setProdId(e.target.value)} placeholder="SKU-1001" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold mb-1">Назва товару *</label>
                    <input type="text" required value={prodName} onChange={(e) => setProdName(e.target.value)} placeholder="Повна назва" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold mb-1">Ціна (грн) *</label>
                    <input type="number" step="0.01" min="0.01" required value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Категорія *</label>
                    <select required value={prodCategoryId} onChange={(e) => setProdCategoryId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl outline-none">
                      <option value="">Виберіть</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Наявність</label>
                    <select value={prodAvailability} onChange={(e) => setProdAvailability(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded-xl outline-none">
                      <option value="1">В наявності</option>
                      <option value="0">Немає в наявності</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold mb-1">Розмір</label>
                    <input type="text" value={prodSize} onChange={(e) => setProdSize(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Склад (шт)</label>
                    <input type="number" min="0" value={prodStock} onChange={(e) => setProdStock(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Вага (кг)</label>
                    <input type="number" step="0.01" min="0" value={prodWeight} onChange={(e) => setProdWeight(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Постачальник</label>
                    <input type="text" value={prodSupplier} onChange={(e) => setProdSupplier(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded-xl outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Опис товару</label>
                  <textarea rows={3} value={prodDescription} onChange={(e) => setProdDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded-xl outline-none resize-none" />
                </div>

                <div>
                  <label className="block font-bold mb-1">Зображення товару</label>
                  <div className="flex gap-2">
                    <input type="text" value={prodImage} onChange={(e) => setProdImage(e.target.value)} className="flex-grow px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded-xl outline-none" placeholder="Введіть URL..." />
                    <label className="px-3 py-2 bg-slate-800 text-white font-bold rounded-xl cursor-pointer">
                      <span>{uploadingProdImg ? "Завантаження..." : "Вибрати файл"}</span>
                      <input type="file" accept="image/*" onChange={handleProdImageFileChange} className="hidden" disabled={uploadingProdImg} />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => { setProductFormOpen(false); setEditingProduct(null); }} className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg">Скасувати</button>
                  <button type="submit" className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm">Зберегти</button>
                </div>
              </form>
            )}

            <div className="bg-white dark:bg-slate-955/20 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-xs space-y-4">
              <div className="flex gap-2">
                <input
                  type="search"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Шукати товари за SKU або назвою..."
                  className="flex-grow px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl outline-none"
                />
                <button onClick={handleProductSearch} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl">Пошук</button>
              </div>

              {productsList.length === 0 ? (
                <p className="text-center text-slate-500 py-6">Товари не знайдено.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-500">
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Зображення</th>
                        <th className="py-2 px-3">Назва</th>
                        <th className="py-2 px-3">Ціна</th>
                        <th className="py-2 px-3">Наявність</th>
                        <th className="py-2 px-3 text-right">Дії</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {productsList.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="py-2.5 px-3 font-bold">{prod.id}</td>
                          <td className="py-2.5 px-3"><img src={prod.image || "https://placehold.co/40x40"} alt="" className="w-8 h-8 object-cover rounded bg-slate-50" /></td>
                          <td className="py-2.5 px-3 font-semibold truncate max-w-[200px]" title={prod.name}>{prod.name}</td>
                          <td className="py-2.5 px-3 font-bold text-indigo-650">{formatPrice(prod.price)}</td>
                          <td className="py-2.5 px-3">
                            {prod.availability === 1 || prod.availability === true ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400">В наявності</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-450">Відсутній</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            <button onClick={() => handleEditProductClick(prod)} className="text-indigo-600 font-semibold hover:text-indigo-800">Редагувати</button>
                            <button onClick={() => handleDeleteProduct(prod.id)} className="text-red-500 font-semibold hover:text-red-700">Видалити</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
