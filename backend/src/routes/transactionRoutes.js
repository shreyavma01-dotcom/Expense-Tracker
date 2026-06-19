import express from "express";
import { authMiddleware } from "../middleware/SessionMiddleware.js";

import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactionController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getTransactions);

router.post("/", createTransaction);

router.put("/:id", updateTransaction);

router.delete("/:id", deleteTransaction);

export default router;