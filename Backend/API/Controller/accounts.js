const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
  getUserByEmail,
  getUserByUsername,
} = require("../Services/accounts/accounts-service.js");
const { AccountModel } = require("../../Database/Schemas/accountSchema.js");

const { generateID } = require('../../Utilities/generateRandomID.js')

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

if (!username) {
  return res.status(400).json({
    code: 400,
    status: "Bad Request",
    message: "Username is required",
  });
}

const cleanUsername = username.trim();

if (cleanUsername.length < 5 || cleanUsername.length > 16) {
  return res.status(400).json({
    code: 400,
    status: "Bad Request",
    message: "Username must be between 5–16 characters",
  });
}

const usernameRegex = /^[a-zA-Z0-9_]{5,16}$/;
if (!usernameRegex.test(cleanUsername)) {
  return res.status(400).json({
    code: 400,
    status: "Bad Request",
    message: "Username can only contain letters, numbers, and underscores",
  });
}

    const existingUser = await getUserByUsername(cleanUsername);
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        status: "Conflict",
        message: "Username already exists",
      });
    }

    if (!email) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        message: "Invalid email format",
      });
    }

    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        code: 409,
        status: "Conflict",
        message: "Email already exists",
      });
    }

    if (!password) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        message: "Password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        message: "Password must be at least 6 characters",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await AccountModel.create({
      id: generateID(16),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    res.status(201).json({
      code: 201,
      status: "Created",
    });
  } catch (error) {
    console.log("error in POST /v1/auth/signup", error);
    res.status(500).json({
      code: 500,
      status: "Internal Server Error",
      message: "Server error try again later...",
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username && !password) {
      return res.status(400).json({
        code: 400,
        status: "Bad Request",
        message: "username and password are required",
      });
    }

    const user = await AccountModel.findOne({ username })
      .select('+password')
      .lean();

    if (!user) {
      return res.status(401).json({
        code: 401,
        status: "Unauthorized ",
        message: "Invalid credentials",
      });
    }

    if (user.role !== 'Owner') {
    if (username.length < 5 || username.length > 16) {
        return res.status(400).json({ message: 'Username must be 5-16 characters' });
    }
}

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        code: 401,
        status: "Unauthorized",
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,// process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    delete user.password;

    res.status(200).json({
      code: 200,
      status: "Success",
      message: "User logged in successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("error in POST /v1/auth/login", error);
    res.status(500).json({
      code: 500,
      status: "Internal Server Error",
      message: "Server error try again later...",
    });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,// process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    
    res.status(200).json({ 
      code: 200,
      status: "Success",
      message: "Logged out successfully" 
    });
  } catch (error) {
    console.error("Error in POST /v1/auth/logout", error);
    res.status(500).json({
      code: 500,
      status: "Internal Server Error",
      message: "Server error, try again later",
    });
  }
};

const verify = async (req, res) => {
  try {
    
    const user = await AccountModel.findOne({ id: req.user.userId }).lean();
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        status: "Not Found",
        message: "User not found",
      });
    }

    res.status(200).json({
      code: 200,
      status: "Success",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error in GET /v1/auth/verify:", error);
    res.status(500).json({
      code: 500,
      status: "Internal Server Error",
      message: "Server error, try again later",
    });
  }
};

const refresh = async (req, res) => {
  try {
    const newToken = jwt.sign(
      {
        userId: req.user.userId,
        username: req.user.username,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("token", newToken, {
      httpOnly: true,
      secure: false,// process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      code: 200,
      status: "Success",
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("Error in POST /v1/auth/refresh:", error);
    res.status(500).json({
      code: 500,
      status: "Internal Server Error",
      message: "Server error, try again later",
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  verify,
  refresh,
};
