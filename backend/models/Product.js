import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // SKU ID
      required: true,
    },
    groupId: {
      type: String,
      default: null,
    },
    categoryId: {
      type: Number,
      ref: "Category",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    size: {
      type: String,
      default: "",
    },
    availability: {
      type: Boolean,
      default: true,
    },
    quantityInStock: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number,
      default: null,
    },
    supplier: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for discounted price
productSchema.virtual("discountedPrice").get(function () {
  if (this.discount > 0) {
    return Math.round((this.price * (1 - this.discount / 100)) * 100) / 100;
  }
  return this.price;
});

// Virtual field for imageUrl
productSchema.virtual("imageUrl").get(function () {
  if (!this.image) return "";
  if (this.image.startsWith("http")) return this.image;
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  return `${baseUrl}${this.image}`;
});

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
