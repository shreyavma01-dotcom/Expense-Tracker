import pool from "../config/db.js";


// GET ALL TRANSACTIONS (scoped to the authenticated user)
export const getTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM transactions
      WHERE user_id = $1
      ORDER BY date DESC
      `,
      [req.user.id]
    );

    res.json(result.rows);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to fetch transactions",
    });
  }
};


// CREATE TRANSACTION (owned by the authenticated user)
export const createTransaction = async (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      description,
      date,
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO transactions
      (
        user_id,
        type,
        amount,
        category,
        description,
        date
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        req.user.id,
        type,
        amount,
        category,
        description,
        date,
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.log(err.message);

    res.status(500).json({
      message: "Failed to create transaction",
    });
  }
};


// UPDATE TRANSACTION (only if owned by the authenticated user)
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      type,
      amount,
      category,
      description,
      date,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE transactions
      SET
        type=$1,
        amount=$2,
        category=$3,
        description=$4,
        date=$5
      WHERE id=$6 AND user_id=$7
      RETURNING *
      `,
      [
        type,
        amount,
        category,
        description,
        date,
        id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to update transaction",
    });
  }
};


// DELETE TRANSACTION (only if owned by the authenticated user)
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM transactions
      WHERE id=$1 AND user_id=$2
      `,
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.json({
      message: "Transaction deleted",
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to delete transaction",
    });
  }
};