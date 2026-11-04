import express from "express";
import cors from "cors";
import crypto from "crypto";
import pg from "pg";

const { Pool } = pg;
const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

// Создание таблицы ключей
async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id SERIAL PRIMARY KEY,
      api_key TEXT UNIQUE NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Проверка API-ключа
async function checkApiKey(req) {
  const key =
    req.headers["x-api-key"] ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!key || !key.startsWith("flash_")) {
    return false;
  }

  const result = await pool.query(
    "SELECT id FROM api_keys WHERE api_key = $1 AND active = TRUE",
    [key]
  );

  return result.rowCount > 0;
}

// Собственный движок Flash AI
function flashAI(message) {
  const text = message.toLowerCase().trim();

  if (/^(привет|прив|здравствуй|добрый день|хай|hello|hi)\b/.test(text)) {
    return "Привет! Я Flash AI — собственный ИИ, работающий на Flash Plugin API. Чем могу помочь?";
  }

  if (text.includes("кто ты") || text.includes("как тебя зовут")) {
    return "Я Flash AI. Мой движок разработан для платформы Flash Plugin API.";
  }

  if (
    text.includes("что ты умеешь") ||
    text.includes("твои возможности")
  ) {
    return "Пока я умею отвечать на базовые запросы. Мои возможности будут постепенно расширяться.";
  }

  if (
    text.includes("спасибо") ||
    text.includes("благодарю")
  ) {
    return "Пожалуйста! Рад помочь.";
  }

  if (
    text.includes("пока") ||
    text.includes("до свидания")
  ) {
    return "До встречи! Буду ждать новых сообщений.";
  }

  if (
    text.includes("помощь") ||
    text.includes("help")
  ) {
    return "Я Flash AI. Напиши мне вопрос или команду. Мои ответы и правила можно будет постепенно настраивать.";
  }

  if (text.includes("flash")) {
    return "Flash — это наша собственная платформа ИИ. Мы постепенно развиваем её движок.";
  }

  return "Я пока не знаю, как ответить на этот запрос. Мои правила и знания ещё будут расширяться.";
}

// Главная страница
app.get("/", (req, res) => {
  res.json({
    name: "Flash Plugin API",
    version: "2.0.0",
    status: "online",
    engine: "Flash AI Engine"
  });
});

// Создание API-ключа
app.post("/api/keys/create", async (req, res) => {
  try {
    const apiKey = "flash_" + crypto.randomBytes(32).toString("hex");

    await pool.query(
      "INSERT INTO api_keys (api_key, active) VALUES ($1, TRUE)",
      [apiKey]
    );

    res.json({
      success: true,
      api_key: apiKey
    });
  } catch (error) {
    console.error("Key creation error:", error);
    res.status(500).json({
      success: false,
      error: "Не удалось создать API-ключ"
    });
  }
});

// Проверка API-ключа
app.get("/api/keys/check", async (req, res) => {
  try {
    const valid = await checkApiKey(req);

    res.json({
      valid
    });
  } catch (error) {
    console.error("Key check error:", error);
    res.status(500).json({
      valid: false,
      error: "Ошибка проверки ключа"
    });
  }
});

// Генерация ответа Flash AI
app.post("/api/chat", async (req, res) => {
  try {
    const valid = await checkApiKey(req);

    if (!valid) {
      return res.status(401).json({
        success: false,
        error: "Неверный или неактивный Flash API ключ"
      });
    }

    const messages = Array.isArray(req.body.messages)
      ? req.body.messages
      : [];

    const lastUserMessage = [...messages]
      .reverse()
      .find(item => item.role === "user" && typeof item.content === "string");

    const message =
      typeof req.body.message === "string"
        ? req.body.message
        : lastUserMessage?.content;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Сообщение не должно быть пустым"
      });
    }

    const reply = flashAI(message);

    res.json({
      success: true,
      model: "flash-ai",
      reply
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      success: false,
      error: "Ошибка Flash AI Engine"
    });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Flash Plugin API started on port ${PORT}`);
      console.log("Flash AI Engine is ready");
    });
  })
  .catch(error => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });
