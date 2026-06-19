import pool from "../config/db.js";


// GET ALL TRANSACTIONS
export const getTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM transactions
      ORDER BY date DESC
      `
    );

    res.json(result.rows);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to fetch transactions",
    });
  }
};


// CREATE TRANSACTION
export const createTransaction = async (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      description,
      date,
    } = req.body;

    console.log(req.body);

    const result = await pool.query(
      `
      INSERT INTO transactions
      (
        type,
        amount,
        category,
        description,
        date
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [
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
      message: err.message,
    });
  }
};


// UPDATE TRANSACTION
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
      WHERE id=$6
      RETURNING *
      `,
      [
        type,
        amount,
        category,
        description,
        date,
        id,
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Failed to update transaction",
    });
  }
};


// DELETE TRANSACTION
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `
      DELETE FROM transactions
      WHERE id=$1
      `,
      [id]
    );

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