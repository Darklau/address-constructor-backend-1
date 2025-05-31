const express = require("express");
const fetch = require("node-fetch");
const multer = require("multer");
const FormData = require("form-data");
const cors = require("cors");

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",") || ["*"];

console.log(allowedOrigins)

app.use(
  cors({
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-access-token", "x-refresh-token", '*'],
    credentials: true,
    origin: allowedOrigins,
  })
);

// Хранилище в памяти — файл доступен как Buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed!"), false);
    }
  },
});

// Функция загрузки файла на imgbb
const uploadImage = async (imageBuffer, name) => {
  const key = process.env.IMGBB_API_KEY;

  const formData = new FormData();
  formData.append("image", imageBuffer.toString("base64"));
  formData.append("name", name);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
    method: "POST",
    body: formData,
    headers: formData.getHeaders(),
  });

  return response.json();
};


// Маршрут загрузки
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const name = req.query.name;
    if (!name) {
      return res.status(400).json({ message: "Укажите имя" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Файл не загружен" });
    }

    const result = await uploadImage(req.file.buffer, name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Ошибка сервера", error: error.message });
  }
});

app.listen(3000, () => console.log("Сервер запущен на порту 3000"));
