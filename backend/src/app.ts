import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "API Running" });
});

app.use("/api/users", userRoutes);

export default app;