import { Router } from "express";
import type { Request, Response } from "express"; 
import { randomUUID } from "node:crypto";

const router = Router();

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  birthday: string;           // mm/dd
  email: string;
  phoneNumber: string;
  profileImage?: string | null;
  nickname?: string | null;
  status?: string | null;
}

// In-memory “DB”
const profiles: Profile[] = [];

/** GET /api/v1/profiles  -> all profiles */
router.get("/", (_req: Request, res: Response) => {
  res.json(profiles);
});

/** GET /api/v1/profiles/:id  -> single profile by id */
router.get("/:id", (req: Request, res: Response) => {
  const p = profiles.find(pr => pr.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Profile not found" });
  res.json(p);
});

/** POST /api/v1/profiles  -> create profile */
router.post("/", (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    birthday,
    email,
    phoneNumber,
    profileImage = null,
    nickname = null,
    status = null,
  } = req.body ?? {};

  // Minimal validation for required fields
  const missing = ["firstName","lastName","birthday","email","phoneNumber"]
    .filter(k => !req.body?.[k]);

  if (missing.length) {
    return res.status(400).json({
      error: "Missing required fields",
      missing,
    });
  }

  const newProfile: Profile = {
    id: randomUUID(),
    firstName,
    lastName,
    birthday,
    email,
    phoneNumber,
    profileImage,
    nickname,
    status,
  };

  profiles.push(newProfile);
  return res.status(201).json(newProfile);
});

export default router;