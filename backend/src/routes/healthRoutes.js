import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running successfully",
  });
});
router.post("/", async (req, res) => {
  try {
    console.log("BODY:", req.body);

    res.json({
      success: true,
      received: req.body,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;