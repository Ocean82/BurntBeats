import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { promisify } from "util";
import "./types/session";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { 
  loginSchema, 
  registerSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  type LoginRequest,
  type RegisterRequest,
  type ForgotPasswordRequest,
  type ResetPasswordRequest
} from "@shared/auth-schemas";
import { createId } from '@paralleldrive/cuid2';

const scrypt = promisify(crypto.scrypt);

// Hash password with Node.js crypto
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = (await scrypt(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Verify password with Node.js crypto
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [hashed, salt] = hashedPassword.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scrypt(password, salt, 64)) as Buffer;
  return crypto.timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate reset token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Login endpoint
export async function login(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationResult.error.errors 
      });
    }

    const { email, password } = validationResult.data;

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Store user in session
    req.session.userId = user.id;
    
    // Return user data (excluding password)
    const { password: _, passwordResetToken, passwordResetExpires, ...userData } = user;
    res.json({
      user: userData,
      message: "Login successful"
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Register endpoint
export async function register(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationResult.error.errors 
      });
    }

    const { username, email, password } = validationResult.data;

    // Check if email already exists
    const [existingEmailUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmailUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Check if username already exists
    const [existingUsernameUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUsernameUser) {
      return res.status(409).json({ error: "Username already taken" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const userId = createId();
    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        username,
        email,
        password: hashedPassword,
        plan: "free",
        songsGenerated: 0,
        maxSongs: 3,
        songsThisMonth: 0,
        lastUsageReset: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Store user in session
    req.session.userId = newUser.id;

    // Return user data (excluding password)
    const { password: _, passwordResetToken, passwordResetExpires, ...userData } = newUser;
    res.status(201).json({
      user: userData,
      message: "Registration successful"
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Logout endpoint
export async function logout(req: Request, res: Response) {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logout successful" });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get current user endpoint
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user data (excluding sensitive fields)
    const { password, passwordResetToken, passwordResetExpires, ...userData } = user;
    res.json({ user: userData });

  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Forgot password endpoint
export async function forgotPassword(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = forgotPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationResult.error.errors 
      });
    }

    const { email } = validationResult.data;

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ 
        message: "If an account with that email exists, a password reset link has been sent" 
      });
    }

    // Generate reset token and expiration (1 hour from now)
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await db
      .update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // TODO: Send email with reset link
    // For now, we'll just log it (in production, integrate with email service)
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: ${req.get('origin')}/reset-password?token=${resetToken}`);

    res.json({ 
      message: "If an account with that email exists, a password reset link has been sent" 
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Reset password endpoint
export async function resetPassword(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = resetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationResult.error.errors 
      });
    }

    const { token, password } = validationResult.data;

    // Find user by reset token
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);

    if (!user || !user.passwordResetExpires) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Check if token is expired
    if (new Date() > user.passwordResetExpires) {
      return res.status(400).json({ error: "Reset token has expired" });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password and clear reset fields
    await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Authentication middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Check username availability endpoint
export async function checkUsername(req: Request, res: Response) {
  try {
    const { username } = req.params;
    
    if (!username || username.length < 3) {
      return res.status(400).json({ 
        available: false, 
        error: "Username must be at least 3 characters" 
      });
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);

    res.json({ 
      available: !existingUser,
      username: username.toLowerCase()
    });

  } catch (error) {
    console.error("Check username error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}