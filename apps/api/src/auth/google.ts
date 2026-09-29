import passport from "passport";
import {
  Strategy as GoogleStrategy,
  type Profile,
} from "passport-google-oauth20";

import { prisma } from "../lib/prisma.js";

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_CALLBACK_URL;

console.log(
  "[auth] GOOGLE_CLIENT_ID =",
  clientID
    ? `${clientID.substring(0, 20)}...`
    : "NOT SET",
);

console.log(
  "[auth] GOOGLE_CALLBACK_URL =",
  callbackURL ?? "NOT SET",
);

if (!clientID || !clientSecret || !callbackURL) {
  console.warn(
    "[auth] Google OAuth credentials are not fully configured",
  );
} else {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },

      async (
        _accessToken,
        _refreshToken,
        profile: Profile,
        done,
      ) => {
        try {
          const email = profile.emails?.[0]?.value
            ?.trim()
            .toLowerCase();

          if (!email) {
            return done(
              new Error(
                "Google account does not provide an email address",
              ),
            );
          }

          /*
           * Create the user if they do not exist.
           *
           * If the user already exists, update their
           * Google profile information.
           */
          const user = await prisma.user.upsert({
            where: {
              email,
            },

            update: {
              googleId: profile.id,

              name:
                profile.displayName ||
                undefined,

              avatarUrl:
                profile.photos?.[0]?.value ||
                undefined,
            },

            create: {
              email,

              googleId: profile.id,

              name:
                profile.displayName ||
                undefined,

              avatarUrl:
                profile.photos?.[0]?.value ||
                undefined,
            },
          });

          /*
           * Every authenticated user must have at least
           * one sender.
           *
           * This check intentionally runs for BOTH:
           *
           * 1. New users
           * 2. Existing users
           *
           * Therefore, users created before this logic was
           * added will also automatically receive a sender.
           *
           * We use findFirst instead of creating blindly so
           * repeated Google logins do not create duplicates.
           */
          const existingSender =
            await prisma.sender.findFirst({
              where: {
                userId: user.id,
              },

              select: {
                id: true,
                email: true,
              },
            });

          if (!existingSender) {
            await prisma.sender.create({
              data: {
                userId: user.id,
                email,
                displayName:
                  profile.displayName ||
                  email,
              },
            });

            console.log(
              `[auth] Created default sender for user: ${email}`,
            );
          } else {
            console.log(
              `[auth] Sender already exists for user: ${email}`,
            );
          }

          return done(null, user);
        } catch (error) {
          console.error(
            "[auth] Google authentication error:",
            error,
          );

          return done(error);
        }
      },
    ),
  );
}

/*
 * Store the database user ID in the session.
 */
passport.serializeUser(
  (
    user: Express.User,
    done: (
      error: any,
      id?: string,
    ) => void,
  ) => {
    const userWithId = user as {
      id: string;
    };

    done(null, userWithId.id);
  },
);

/*
 * Restore the user from PostgreSQL
 * using the ID stored in the session.
 */
passport.deserializeUser(
  async (
    id: string,
    done: (
      error: any,
      user?: Express.User | false | null,
    ) => void,
  ) => {
    try {
      const user =
        await prisma.user.findUnique({
          where: {
            id,
          },

          select: {
            id: true,
            googleId: true,
            email: true,
            name: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        });

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  },
);

export default passport;