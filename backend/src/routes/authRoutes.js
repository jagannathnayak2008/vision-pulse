import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  RegisterSchema,
  LoginSchema,
  ProfileUpdateSchema,
} from "../validators/schemas.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "optiguard_ai_super_secret_jwt_key_2026_production_grade_security_token_hex_9981";

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      organization: user.organization,
      role: user.role,
      defaultDomain: user.default_domain,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const validated = RegisterSchema.parse(req.body);

    const existing = await query("SELECT id FROM users WHERE email = $1", [validated.email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, organization, role, default_domain)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, email, organization, role, default_domain, created_at`,
      [
        validated.fullName,
        validated.email.toLowerCase(),
        passwordHash,
        validated.organization,
        validated.role,
        validated.defaultDomain,
      ]
    );

    const newUser = result.rows[0];
    const token = signToken(newUser);

    return res.status(201).json({
      success: true,
      message: "Inspector account registered successfully.",
      token,
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        email: newUser.email,
        organization: newUser.organization,
        role: newUser.role,
        defaultDomain: newUser.default_domain,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const validated = LoginSchema.parse(req.body);

    const result = await query(
      "SELECT id, full_name, email, password_hash, organization, role, default_domain FROM users WHERE email = $1",
      [validated.email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(validated.password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = signToken(user);

    return res.json({
      success: true,
      message: "Signed in successfully.",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        organization: user.organization,
        role: user.role,
        defaultDomain: user.default_domain,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, full_name, email, organization, role, default_domain, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const user = result.rows[0];
    return res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        organization: user.organization,
        role: user.role,
        defaultDomain: user.default_domain,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/profile
router.put("/profile", authMiddleware, async (req, res, next) => {
  try {
    const validated = ProfileUpdateSchema.parse(req.body);

    const currentResult = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const current = currentResult.rows[0];
    const updatedFullName = validated.fullName !== undefined ? validated.fullName : current.full_name;
    const updatedOrg = validated.organization !== undefined ? validated.organization : current.organization;
    const updatedRole = validated.role !== undefined ? validated.role : current.role;
    const updatedDomain = validated.defaultDomain !== undefined ? validated.defaultDomain : current.default_domain;

    const result = await query(
      `UPDATE users
       SET full_name = $1, organization = $2, role = $3, default_domain = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, full_name, email, organization, role, default_domain, updated_at`,
      [updatedFullName, updatedOrg, updatedRole, updatedDomain, req.user.id]
    );

    const updatedUser = result.rows[0];
    return res.json({
      success: true,
      message: "Profile preferences updated successfully.",
      user: {
        id: updatedUser.id,
        fullName: updatedUser.full_name,
        email: updatedUser.email,
        organization: updatedUser.organization,
        role: updatedUser.role,
        defaultDomain: updatedUser.default_domain,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

