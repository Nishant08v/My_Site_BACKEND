const express = require('express');
const bodyParser = require('body-parser');
const placesRoutes = require("./routes/places-routes");
const userRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

/* ✅ GLOBAL CORS — Render safe */
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://my-site-frontend-mizz8dpp6-nvs-projects-970ad677.vercel.app",
    "https://my-site-frontend-plum.vercel.app",
    "https://my-site-frontend-git-main-nvs-projects-970ad677.vercel.app"
  ],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
}));

/* ✅ HANDLE PREFLIGHT */
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(bodyParser.json());
app.use('/uploads/images', express.static(path.join('uploads','images')));

app.use("/api/places", placesRoutes);
app.use("/api/users", userRoutes);

/* ❌ route not found */
app.use((req, res, next) => {
  const error = new HttpError("Could Not Find This Route", 404);
  throw error;
});

/* ✅ error handler */
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, err => console.log(err));
  }

  if (res.headersSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({
    message: error.message || "An Unknown Error Occurred!"
  });
});

/* ✅ DATABASE */
mongoose
  .connect(
    `mongodb+srv://nishu:nishu0805@cluster0.id5wia3.mongodb.net/myDb?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(() => {
    app.listen(process.env.PORT || 5000);
    console.log("✅ Backend running");
  })
  .catch(err => {
    console.log("❌ Mongo error:", err);
  });
