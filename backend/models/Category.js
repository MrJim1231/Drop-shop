import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    _id: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    parentId: {
      type: Number,
      default: null,
      ref: "Category",
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for full image URL if locally uploaded
categorySchema.virtual("imageUrl").get(function () {
  if (!this.image) return "";
  if (this.image.startsWith("http")) return this.image;
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  return `${baseUrl}${this.image}`;
});

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
export default Category;
