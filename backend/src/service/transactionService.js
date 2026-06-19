import pool from "../config/db.js";

// GET ALL
export const getTransactionsService =
  async () => {
    const result = await pool.query(
      `
      SELECT *
      FROM transactions
      ORDER BY id DESC
      `
    );

    return result.rows;
  };

// CREATE
export const createTransactionService =
  async (data) => {
    const {
      amount,
      type,
      category,
      description,
      date,
    } = data;

    const result = await pool.query(
      `
      INSERT INTO transactions
      (
        amount,
        type,
        category,
        description,
        date
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [
        amount,
        type,
        category,
        description,
        date,
      ]
    );

    return result.rows[0];
  };

// DELETE
export const deleteTransactionService =
  async (id) => {
    await pool.query(
      `
      DELETE FROM transactions
      WHERE id = $1
      `,
      [id]
    );
  };

// UPDATE
export const updateTransactionService =
  async (id, data) => {
    const {
      amount,
      type,
      category,
      description,
      date,
    } = data;

    const result = await pool.query(
      `
      UPDATE transactions
      SET
        amount = $1,
        type = $2,
        category = $3,
        description = $4,
        date = $5
      WHERE id = $6
      RETURNING *
      `,
      [
        amount,
        type,
        category,
        description,
        date,
        id,
      ]
    );

    return result.rows[0];
  };