import { toast } from "react-toastify";

export function formatPrice(price: string | number | null | undefined): string {
  const num = parseFloat(String(price));
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}

export function showToast(message: string, type: "success" | "error" | "info" = "success") {
  if (type === "success") {
    toast.success(message);
  } else if (type === "error") {
    toast.error(message);
  } else {
    toast.info(message);
  }
}

export function slugify(text: string | null | undefined): string {
  if (!text) return "";
  const translit: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", є: "ye", ж: "zh",
    з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o",п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "yu", я: "ya",
    А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Є: "Ye", Ж: "Zh",
    З: "Z", И: "Y", І: "I", Ї: "Yi", Й: "Y", К: "K", Л: "L", М: "M",
    Н: "N", О: "O", П: "P", Р: "R", С: "S", Т: "T", У: "U", Ф: "F",
    Х: "Kh", Ц: "Ts", Ч: "Ch", Ш: "Sh", Щ: "Shch", Ь: "", Ю: "Yu", Я: "Ya",
    ё: "yo", Ё: "Yo", ы: "y", Ы: "Y", э: "e", Э: "E", ъ: "", Ъ: "",
    ґ: "g", Ґ: "G",
  };

  let slug = text
    .toString()
    .split("")
    .map((char) => translit[char] || char)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length > 70) {
    slug = slug.substring(0, 70);
    const lastDash = slug.lastIndexOf("-");
    if (lastDash > 30) {
      slug = slug.substring(0, lastDash);
    }
  }

  return slug;
}
