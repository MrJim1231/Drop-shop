import React from "react";
import { Link } from "react-router-dom";
import { ProductData } from "../api/client";
import { formatPrice, slugify } from "../utils";

interface ProductCardProps {
  product: ProductData;
  linkPrefix?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, linkPrefix = "/product/" }) => {
  const image =
    product.images?.[0] ||
    product.image ||
    "https://placehold.co/400x400/f1f5f9/94a3b8?text=Немає+фото";
  const available = product.availability === 1 || product.availability === true;
  const slug = slugify(product.name);
  const href = `${linkPrefix}${product.id}${slug ? "-" + slug : ""}`;

  const discount = parseInt(String(product.discount)) || 0;
  const hasDiscount = discount > 0 && product.discounted_price != null;
  const displayPrice = hasDiscount ? product.discounted_price : product.price;

  return (
    <Link
      to={href}
      className="product-card group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden hover:shadow-lg hover:border-indigo-200 dark:hover:border-white/10 transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-950 relative">
          <img
            src={image}
            alt={product.name}
            className="product-image w-full h-full object-cover"
            loading="lazy"
          />
          {!available && (
            <span className="absolute top-3 left-3 bg-slate-800/80 text-white text-xs px-2 py-1 rounded-full">
              Немає в наявності
            </span>
          )}
          {hasDiscount && (
            <span className="absolute top-3 right-3 bg-rose-600 text-white text-xs font-black px-2 py-1 rounded-full shadow-md">
              -{discount}%
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {product.name}
          </h3>
          {product.size && (
            <p className="text-xs text-slate-500 mt-1">{product.size}</p>
          )}
        </div>
      </div>
      <div className="p-4 pt-0">
        {hasDiscount ? (
          <div className="flex items-baseline gap-2 mt-2 flex-wrap">
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {formatPrice(displayPrice)}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 line-through font-normal">
              {formatPrice(product.price)}
            </p>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              -{discount}%
            </span>
          </div>
        ) : (
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {formatPrice(product.price)}
          </p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
