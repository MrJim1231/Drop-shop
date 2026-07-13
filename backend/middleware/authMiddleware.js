import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // If token is provided, verify it. Otherwise, we can fall back to userId query param in route handlers.
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "your_secret_key";
      const decoded = jwt.verify(token, secret);
      req.user = {
        userId: decoded.userId || decoded.user_id || decoded._id,
        role: decoded.role || (decoded.is_admin ? "admin" : "user"),
        email: decoded.email,
        isAdmin: decoded.isAdmin || decoded.is_admin || false,
      };
    } catch (error) {
      console.error("Token verification error:", error.message);
      return res.status(403).json({ status: "error", message: "Недійсний токен" });
    }
  }

  next();
};

export default authMiddleware;
