import Order from "../models/Order.js";
import Product from "../models/Product.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

const getTransporter = () => {
  const host = process.env.MAIL_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.MAIL_PORT || "587");
  const user = process.env.EMAIL_USER || process.env.MAIL_USERNAME || "";
  const pass = process.env.EMAIL_PASS || process.env.MAIL_PASSWORD || "";

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  const fromEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || process.env.MAIL_USERNAME || "info@dropshop.com";
  
  await transporter.sendMail({
    from: `"Sleep & Dream" <${fromEmail}>`,
    to,
    subject,
    html,
  });
};

// 🟢 Згенерувати ID гостя
export const generateGuestUserId = (req, res) => {
  const uniq = crypto.randomBytes(12).toString("hex");
  res.json({ userId: `guest-${uniq}` });
};

// 🟢 Створити замовлення
export const createOrder = async (req, res) => {
  const { name, phone, address, email, items, totalPrice, total_price, comment, userId, user_id } = req.body;
  const finalTotalPrice = totalPrice !== undefined ? totalPrice : total_price;

  if (!name || !phone || !address || !email || !items || finalTotalPrice === undefined) {
    return res.status(400).json({ status: "error", message: "Відсутні обов'язкові дані" });
  }

  try {
    const orderNumber = "ORD-" + crypto.randomBytes(8).toString("hex").toUpperCase();
    const finalUserId = userId || user_id || `guest-${crypto.randomBytes(12).toString("hex")}`;

    const orderItems = [];
    for (const item of items) {
      const dbProduct = await Product.findById(item.product_id || item.productId);
      const productName = dbProduct ? dbProduct.name : (item.name || "Товар");

      orderItems.push({
        productId: item.product_id || item.productId,
        name: productName,
        quantity: parseInt(item.quantity || 1),
        price: parseFloat(item.price || 0),
        image: item.image || "",
        size: item.size || "-",
        rubber: !!item.rubber,
      });
    }

    const newOrder = new Order({
      orderNumber,
      name,
      phone,
      address,
      email,
      comment: comment || "",
      totalPrice: parseFloat(finalTotalPrice),
      userId: finalUserId,
      items: orderItems,
    });

    await newOrder.save();

    // Setup email notification
    let tableRows = "";
    for (const item of orderItems) {
      const rubberText = item.rubber ? "Так" : "Ні";
      const imageHtml = item.image ? `<img src="${item.image}" alt="${item.name}" style="max-width: 100px; display: block; margin: 0 auto;">` : "";
      tableRows += `
        <tr>
          <td style="text-align: center; border: 1px solid #e2e8f0; padding: 8px;">${imageHtml}</td>
          <td style="text-align: center; border: 1px solid #e2e8f0; padding: 8px;">${item.name}</td>
          <td style="text-align: center; border: 1px solid #e2e8f0; padding: 8px;">${item.quantity}</td>
          <td style="text-align: center; border: 1px solid #e2e8f0; padding: 8px;">${item.price} грн</td>
          <td style="text-align: center; border: 1px solid #e2e8f0; padding: 8px;">${item.size}</td>
          <td style="text-align: center; border: 1px solid #e2e8f0; padding: 8px;">${rubberText}</td>
        </tr>
      `;
    }

    const emailBody = `
      <h2>Нове замовлення №${orderNumber}</h2>
      <p><strong>Ім'я:</strong> ${name}</p>
      <p><strong>Телефон:</strong> ${phone}</p>
      <p><strong>Адреса:</strong> ${address}</p>
      <p><strong>Коментар:</strong> ${comment || "-"}</p>
      <p><strong>Підсумкова сума:</strong> ${totalPrice} грн</p>
      <h3>Товари у замовленні:</h3>
      <table style="border-collapse: collapse; width: 100%; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="border: 1px solid #e2e8f0; padding: 8px;">Фото</th>
            <th style="border: 1px solid #e2e8f0; padding: 8px;">Назва</th>
            <th style="border: 1px solid #e2e8f0; padding: 8px;">Кількість</th>
            <th style="border: 1px solid #e2e8f0; padding: 8px;">Ціна</th>
            <th style="border: 1px solid #e2e8f0; padding: 8px;">Розмір</th>
            <th style="border: 1px solid #e2e8f0; padding: 8px;">На резинці</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;

    // 1. Email notification to Admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (adminEmail) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: `Нове замовлення №${orderNumber}`,
          html: emailBody,
        });
      } catch (err) {
        console.error("Failed sending email to admin:", err.message);
      }
    }

    // 2. Email confirmation to Buyer
    try {
      await sendEmail({
        to: email,
        subject: `Ваше замовлення №${orderNumber}`,
        html: `<h2>Дякуємо за ваше замовлення!</h2>` + emailBody,
      });
    } catch (err) {
      console.error("Failed sending email to customer:", err.message);
    }

    res.json({
      status: "success",
      message: "Замовлення успішно створено",
      orderNumber,
      userId: finalUserId,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ status: "error", message: "Помилка при створенні замовлення" });
  }
};

// 🟢 Отримати замовлення користувача (get_orders.php)
export const getOrders = async (req, res) => {
  const userId = req.query.userId || req.user?.userId;

  if (!userId) {
    return res.status(401).json({ status: "error", message: "Користувач не авторизований" });
  }

  try {
    const items = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
    
    if (items.length > 0) {
      const orders = items.map((ord) => ({
        id: ord._id,
        order_number: ord.orderNumber,
        name: ord.name,
        phone: ord.phone,
        address: ord.address,
        email: ord.email,
        comment: ord.comment,
        total_price: ord.totalPrice,
        user_id: ord.userId,
        created_at: ord.createdAt,
        items: ord.items.map((i) => ({
          product_id: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          image: i.image,
          size: i.size,
          rubber: i.rubber ? 1 : 0,
        })),
      }));

      res.json(orders);
    } else {
      res.json({ status: "error", message: "Нет заказов для этого пользователя" });
    }
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ error: error.message });
  }
};
