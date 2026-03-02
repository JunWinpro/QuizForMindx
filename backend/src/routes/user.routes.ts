import { Router } from "express";
import User from "../models/User";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "Users route working" });
});
router.post("/create", async (req, res) => {
  const user = await User.create({
    name: "Khoi",
    email: "khoi@gmail.com",
  });

  res.json(user);
});

export default router;