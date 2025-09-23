// middleware/errorHandler.js

function globalErrorHandler(err, req, res, next) {
  console.error("🔥 Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
}

function performanceMonitor(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`⏱️ ${req.method} ${req.originalUrl} - ${duration}ms`);
  });
  next();
}

module.exports = { globalErrorHandler, notFoundHandler, performanceMonitor };
