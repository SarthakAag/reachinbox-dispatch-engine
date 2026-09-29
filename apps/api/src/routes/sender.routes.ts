import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/require-auth.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  async (req, res) => {
    try {
      const senders = await prisma.sender.findMany({
        where: {
          userId: req.user!.id,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      });

      return res.json({
        senders,
      });
    } catch (error) {
      console.error(
        "Failed to fetch senders:",
        error,
      );

      return res.status(500).json({
        message: "Failed to fetch senders",
      });
    }
  },
);

export default router;
