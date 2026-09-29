import cors from "cors";
import express from "express";
import helmet from "helmet";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pinoHttp } from "pino-http";

import passport from "./auth/google.js";

import { serverAdapter } from "./integrations/bull-board/bull-board.js";

import campaignRoutes from "./routes/campaign.routes.js";
import senderRoutes from "./routes/sender.routes.js";
import emailRoutes from "./routes/email.routes.js";
import authRoutes from "./routes/auth.routes.js";
import slackRoutes from "./routes/slack.routes.js";
import { requireAuth } from "./middleware/require-auth.js";
const app = express();

const PgSession = pgSession(session);

const sessionStore = new PgSession({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: true,
});

app.use(helmet());

app.use(
  cors({
    origin:
      process.env.WEB_URL ??
      "http://localhost:3000",
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "2mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(pinoHttp());

app.use(
  session({
    store: sessionStore,

    secret:
      process.env.SESSION_SECRET ??
      "development-session-secret",

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      maxAge:
        1000 *
        60 *
        60 *
        24 *
        7,
    },
  }),
);

/*
 * Initialize Passport after the session
 * middleware and before authentication routes.
 */
app.use(
  passport.initialize(),
);

app.use(
  passport.session(),
);

app.get(
  "/health",
  (_req, res) => {
    res.json({
      status: "ok",
      service: "reachinbox-api",
      timestamp:
        new Date().toISOString(),
    });
  },
);

/*
 * Google authentication routes.
 */
app.use(
  "/api/auth",
  authRoutes,
);
app.use(
  "/api/slack",
  slackRoutes,
);

/*
 * BullMQ dashboard.
 */
app.use(
  "/admin/queues",
  requireAuth,
  serverAdapter.getRouter(),
);

/*
 * Campaign APIs.
 */
app.use(
  "/api/campaigns",
  campaignRoutes,
);
app.use("/api/senders", senderRoutes);

/*
 * Email APIs.
 */
app.use(
  "/api/emails",
  emailRoutes,
);

export default app;