import pool from "../config/db.js";

// GET ALL (scoped to a user)
export const getTransactionsService =
  async (userId) => {
    const result = await pool.query(
      `
      SELECT *
      FROM transactions
      WHERE user_id = $1
      ORDER BY id DESC
      `,
      [userId]
    );

    return result.rows;
  };

// CREATE (owned by a user)
export const createTransactionService =
  async (userId, data) => {
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
        user_id,
        amount,
        type,
        category,
        description,
        date
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        userId,
        amount,
        type,
        category,
        description,
        date,
      ]
    );

    return result.rows[0];
  };

// DELETE (only if owned by the user)
export const deleteTransactionService =
  async (userId, id) => {
    await pool.query(
      `
      DELETE FROM transactions
      WHERE user_id = $1 AND id = $2
      `,
      [userId, id]
    );
  };

// UPDATE (only if owned by the user)
export const updateTransactionService =
  async (userId, id, data) => {
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
      WHERE user_id = $6 AND id = $7
      RETURNING *
      `,
      [
        amount,
        type,
        category,
        description,
        date,
        userId,
        id,
      ]
    );

    return result.rows[0];
  };
