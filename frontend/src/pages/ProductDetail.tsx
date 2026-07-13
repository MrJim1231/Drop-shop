import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api, ProductData } from "../api/client";
import { useCart } from "../context/CartContext";
import { formatPrice, slugify, showToast } from "../utils";
import { ChevronRight, Plus, Minus, Check, AlertCircle } from "lucide-react";

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const productId = id?.split("-")[0] || "";

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCart();

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    api.getProduct(productId)
      .then((data) => {
        setProduct(data);
        const firstImg = data.images?.[0] || data.image || "https://placehold.co/600x600/f1f5f9/94a3b8?text=Немає+фото";
        setSelectedImage(firstImg);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Product detail error:", err);
        setLoading(false);
      });
  }, [productId]);

  const handleDec = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleInc = () => {
    setQuantity((prev) => Math.min(99, prev + 1));
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.discounted_price || product.price,
      image: selectedImage || product.image,
      size: product.size || "—",
      quantity,
    });
    showToast("Товар додано в кошик", "success");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">Товар не знайдено</p>
        <Link to="/categories" className="text-indigo-600 hover:text-indigo-750 font-medium">
          ← Повернутись до каталогу
        </Link>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images
    : ["https://placehold.co/600x600/f1f5f9/94a3b8?text=Немає+фото"];

  const available = product.availability === 1 || product.availability === true;

  return (
    <div className="page-enter max-w-7xl mx-auto py-4">
      {/* Breadcrumbs */}
      <nav className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex items-center flex-wrap gap-1">
        <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">Головна</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/categories" className="hover:text-indigo-600 dark:hover:text-indigo-400">Каталог</Link>
        {product.category_id && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              to={`/category/${product.category_id}-${slugify(product.category_name || "")}`}
              className="hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {product.category_name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        
        {/* Images Column */}
        <div>
          <div className="aspect-square bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden mb-4 shadow-sm">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-contain p-4"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`thumb-btn flex-shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden hover:border-indigo-400 transition-colors cursor-pointer ${
                    selectedImage === img
                      ? "border-indigo-600 dark:border-indigo-400"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            {product.name}
          </h1>
          {product.category_name && (
            <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
              {product.category_name}
            </p>
          )}

          {/* Pricing */}
          <div className="mt-6">
            {product.discount > 0 && product.discounted_price ? (
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                  {formatPrice(product.discounted_price)}
                </span>
                <span className="text-lg text-slate-400 dark:text-slate-500 line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  -{product.discount}%
                </span>
              </div>
            ) : (
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {formatPrice(product.price)}
              </p>
            )}
          </div>

          {/* Availability */}
          <div className="mt-4 flex items-center gap-3">
            {available ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="w-4 h-4 bg-emerald-100 dark:bg-emerald-950/50 rounded-full p-0.5" /> В наявності
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400 font-medium">
                <AlertCircle className="w-4 h-4 bg-rose-100 dark:bg-rose-950/50 rounded-full p-0.5" /> Немає в наявності
              </span>
            )}
            {product.quantity_in_stock > 0 && (
              <span className="text-sm text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-3">
                Залишок: {product.quantity_in_stock} шт.
              </span>
            )}
          </div>

          {/* Size Info */}
          {product.size && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl">
              <span className="text-xs text-slate-400 block mb-1">Размір / характеристика:</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{product.size}</span>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              <button
                onClick={handleDec}
                className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 text-center py-3 border-x border-slate-200 dark:border-slate-800 focus:outline-none dark:bg-slate-900 font-bold text-sm"
              />
              <button
                onClick={handleInc}
                className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={handleAddToCart}
              disabled={!available}
              className="flex-1 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
            >
              Додати в кошик
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-8 border-t border-slate-200 dark:border-slate-850 pt-8">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Опис товару</h2>
              <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
