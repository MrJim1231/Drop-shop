import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

// 🟢 Реєстрація користувача
export const registerUser = async (req, res) => {
  const { email, password, userId } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: "error", message: "Email та пароль обов'язкові" });
  }

  if (password.length < 6) {
    return res.status(400).json({ status: "error", message: "Пароль має бути не менше 6 символів" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ status: "error", message: "Email вже зареєстрований та підтверджений" });
      } else {
        return res.status(400).json({ status: "error", message: "Email вже зареєстрований, але не підтверджений. Перевірте пошту" });
      }
    }

    // Generate unique user ID if not provided, check if it's already in DB
    let finalUserId = userId || "u" + crypto.randomBytes(8).toString("hex");
    const userCheck = await User.findById(finalUserId);
    if (userCheck) {
      finalUserId = "u" + crypto.randomBytes(8).toString("hex");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = new User({
      _id: finalUserId,
      email,
      password: hashedPassword,
      verificationCode,
      isVerified: false,
      isAdmin: email === "berolegnik@gmail.com" || email === "test@example.com"
    });

    await newUser.save();

    // Send email code
    await sendEmail({
      to: email,
      subject: "Код підтвердження реєстрації",
      html: `Ваш код підтвердження: <b>${verificationCode}</b>`,
    });

    res.status(201).json({
      status: "success",
      message: "Реєстрація пройшла успішно. Перевірте пошту для підтвердження",
      userId: finalUserId,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ status: "error", message: "Помилка при реєстрації: " + error.message });
  }
};

// 🟢 Логін користувача
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: "error", message: "Email і пароль обов'язкові" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: "error", message: "Невірний email або пароль" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: "error", message: "Невірний email або пароль" });
    }

    // If email is not verified, regenerate verification code and send it
    if (!user.isVerified) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = verificationCode;
      await user.save();

      await sendEmail({
        to: email,
        subject: "Повторний код підтвердження",
        html: `Ваш новий код підтвердження: <b>${verificationCode}</b>`,
      });

      return res.json({
        status: "verification_required",
        message: "Email не підтверджено. Код повторно відправлено на пошту",
        userId: user._id,
      });
    }

    // Generate JWT
    const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "your_secret_key";
    const token = jwt.sign(
      { userId: user._id, email: user.email, is_admin: user.isAdmin },
      secret,
      { expiresIn: "1h" }
    );

    res.json({
      status: "success",
      message: "Авторизація успішна",
      token,
      userId: user._id,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 🟢 Підтвердження пошти
export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ status: "error", message: "Email та код підтвердження обов'язкові" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: "error", message: "Email не знайдено" });
    }

    if (user.verificationCode === code.toString()) {
      user.isVerified = true;
      await user.save();

      // Generate JWT
      const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "your_secret_key";
      const token = jwt.sign(
        { userId: user._id, email: user.email, is_admin: user.isAdmin },
        secret,
        { expiresIn: "1h" }
      );

      res.json({
        status: "success",
        message: "Email успішно підтверджено",
        token,
        userId: user._id,
      });
    } else {
      res.status(400).json({ status: "error", message: "Невірний код" });
    }
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 🟢 Отримання профілю
export const getProfile = async (req, res) => {
  // Can be in req.user from middleware, or fallback to req.query.userId (for compatibility)
  const userId = (req.user && req.user.userId) || req.query.userId;

  if (!userId) {
    return res.status(401).json({ status: "error", message: "Користувач не авторизований" });
  }

  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ status: "error", message: "Користувача не знайдено" });
    }

    res.json({
      status: "success",
      data: {
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        is_admin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 🟢 Оновлення профілю
export const updateProfile = async (req, res) => {
  const userId = req.body.userId || (req.user && req.user.userId);
  const { name, phone, address } = req.body;

  if (!userId) {
    return res.status(401).json({ status: "error", message: "Користувач не авторизований" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: "error", message: "Користувача не знайдено" });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    res.json({ status: "success", message: "Профіль успішно оновлено" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ status: "error", message: "Не вдалося оновити профіль" });
  }
};

// 🟢 Запит відновлення паролю
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ status: "error", message: "Email обов'язковий" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: "error", message: "Email не знайдений" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiration

    user.resetToken = resetToken;
    user.resetExpiry = resetExpiry;
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/login?resetToken=${resetToken}`;

    await sendEmail({
      to: email,
      subject: "Відновлення пароля",
      html: `<p>Для відновлення пароля перейдіть за посиланням:</p><p><a href='${resetUrl}'>${resetUrl}</a></p>`,
    });

    res.json({ status: "success", message: "Посилання для відновлення пароля надіслано на email" });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ status: "error", message: "Помилка сервера при запиті скидання пароля" });
  }
};

// 🟢 Скидання паролю за токеном
export const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    return res.status(400).json({ status: "error", message: "Токен і новий пароль обов'язкові" });
  }

  try {
    const currentUnix = Math.floor(Date.now() / 1000);
    const user = await User.findOne({
      resetToken: token,
      resetExpiry: { $gt: currentUnix }
    });

    if (!user) {
      return res.status(400).json({ status: "error", message: "Невірний або прострочений токен" });
    }

    user.password = await bcrypt.hash(new_password, 10);
    user.resetToken = null;
    user.resetExpiry = null;
    await user.save();

    res.json({ status: "success", message: "Пароль успішно змінено" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ status: "error", message: "Помилка сервера при скиданні пароля" });
  }
};

// 🟢 Зміна паролю (для авторизованого користувача)
export const changePassword = async (req, res) => {
  const userId = req.user?.userId || req.body.userId;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    return res.status(401).json({ status: "error", message: "Користувач не авторизований" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: "error", message: "Користувача не знайдено" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: "error", message: "Поточний пароль невірний" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ status: "success", message: "Пароль успішно змінено" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};
