const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error("Error in authenticateToken:", error);
    res.status(500).json({
      code: 500,
      status: "Internal Server Error",
      message: "Authentication error",
    });
  }
};

module.exports = { authenticateToken };
