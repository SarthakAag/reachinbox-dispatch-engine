import { Router } from "express";

import passport from "../auth/google.js";

const router = Router();

const webUrl =
  process.env.WEB_URL ??
  "http://localhost:3000";

/*
 * Start Google OAuth.
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "openid",
      "profile",
      "email",
    ],
    session: true,
    prompt: "select_account",
  }),
);

/*
 * Google OAuth callback.
 *
 * Google redirects here after successful
 * authentication. Passport creates/restores
 * the user session and we then send the user
 * to the Next.js dashboard.
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect:
      "/api/auth/login-failed",
    session: true,
  }),
  (_req, res) => {
    res.redirect(
      `${webUrl}/dashboard`,
    );
  },
);

/*
 * OAuth failure.
 */
router.get(
  "/login-failed",
  (_req, res) => {
    res.status(401).json({
      error:
        "Google authentication failed",
    });
  },
);

/*
 * Return the currently authenticated user.
 */
router.get(
  "/me",
  (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        authenticated: false,
        user: null,
      });
    }

    return res.json({
      authenticated: true,
      user: req.user,
    });
  },
);

/*
 * Logout.
 */
router.post(
  "/logout",
  (req, res, next) => {
    req.logout((error) => {
      if (error) {
        return next(error);
      }

      req.session.destroy(
        (sessionError) => {
          if (sessionError) {
            return next(sessionError);
          }

          res.clearCookie(
            "connect.sid",
          );

          return res.json({
            success: true,
          });
        },
      );
    });
  },
);

export default router;