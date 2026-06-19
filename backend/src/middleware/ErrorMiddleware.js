/*const ErrorMiddleware = (err, req, res, next) => {
  console.log("ERROR:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
};

export default ErrorMiddleware;*/