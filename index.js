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

async function checkApiKey(req) {
  const key =
    req.headers["x-api-key"] ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!key || !key.startsWith("flash_")) return false;

  const result = await pool.query(
    "SELECT id FROM api_keys WHERE api_key = $1 AND active = TRUE",
    [key]
  );

  return result.rowCount > 0;
}

function flashAI(message) {
  const text = message
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:()[\]{}"'`]/g, "")
    .replace(/\s+/g, " ");

  const has = (...phrases) =>
    phrases.some(phrase => text === phrase);

  const includes = (...phrases) =>
    phrases.some(phrase => text.includes(phrase));

  // ПРИВЕТСТВИЯ
  if (
    has(
      "привет", "прив", "приве", "приветик",
      "приветствую", "здравствуйте", "здравствуй",
      "здорово", "здорова", "здоров", "салют",
      "хай", "хэй", "ку", "сап", "йо",
      "доброго дня", "добрый день",
      "доброе утро", "добрый вечер",
      "hello", "hi", "hey", "sup", "yo"
    )
  ) {
    const answers = [
      "Привет! Рад тебя видеть. Как дела?",
      "Здорова! Что интересного сегодня?",
      "Привет! Чем могу помочь?",
      "Сап! Как настроение?",
      "Ку! О чём поговорим?",
      "Здравствуйте! Чем могу быть полезен?",
      "Йо! Я на связи."
    ];
    return answers[Math.floor(Math.random() * answers.length)];
  }

  // ПРОЩАНИЯ
  if (
    has(
      "пока", "пока пока", "до свидания",
      "досвидания", "досвидос", "досвидосик",
      "прощай", "до встречи", "до завтра",
      "увидимся", "бывай", "счастливо",
      "мне пора", "я пошел", "я пошла",
      "ладно пока", "ну пока", "прощайте",
      "goodbye", "bye", "see you"
    )
  ) {
    const answers = [
      "Пока! Буду рад пообщаться снова.",
      "До встречи! Хорошего дня!",
      "Досвидос! Удачи!",
      "До завтра! Не пропадай.",
      "Счастливо! Возвращайся, когда захочешь.",
      "Бывай! Хорошего настроения!"
    ];
    return answers[Math.floor(Math.random() * answers.length)];
  }

  // КАК ДЕЛА
  if (
    includes(
      "как дела", "как ты", "как поживаешь",
      "как жизнь", "как настроение",
      "как сам", "как сама", "все хорошо",
      "всё хорошо", "че как", "чё как",
      "как оно", "как у тебя дела"
    )
  ) {
    const answers = [
      "У меня всё отлично! Готов отвечать на вопросы.",
      "Всё хорошо! А у тебя как?",
      "Работаю и обрабатываю сообщения. Как твои дела?",
      "Отлично! Спасибо, что спросил.",
      "Всё стабильно. Что нового у тебя?"
    ];
    return answers[Math.floor(Math.random() * answers.length)];
  }

  // ЧТО ДЕЛАЕШЬ
  if (
    includes(
      "что делаешь", "чем занимаешься",
      "что сейчас делаешь", "чем занят",
      "ты работаешь", "ты тут", "ты онлайн",
      "ты свободен", "что творишь"
    )
  ) {
    return "Сейчас общаюсь с тобой, анализирую сообщения и стараюсь помочь!";
  }

  // КТО ТЫ
  if (
    includes(
      "кто ты", "как тебя зовут",
      "твое имя", "твоё имя",
      "ты кто", "ты нейросеть",
      "ты искусственный интеллект"
    )
  ) {
    return "Я Flash AI — собственный ИИ-движок платформы Flash Plugin API.";
  }

  // ЧТО ТЫ УМЕЕШЬ
  if (
    includes(
      "что ты умеешь", "твои возможности",
      "что можешь", "твои функции",
      "расскажи о себе", "что ты можешь делать"
    )
  ) {
    return "Я умею поддерживать простой диалог, распознавать разные фразы и отвечать на них. Мои знания постепенно расширяются.";
  }

  // КАК ЭТО СДЕЛАТЬ
  if (
    includes(
      "как это сделать", "как сделать",
      "как создать", "как построить",
      "как настроить", "как установить",
      "как исправить", "как починить",
      "как подключить", "как запустить",
      "как написать", "как работает",
      "объясни как", "покажи как",
      "научи меня", "помоги сделать"
    )
  ) {
    return "Давай разберёмся! Опиши, что именно ты хочешь сделать, и я постараюсь объяснить это по шагам.";
  }

  // ПОЧЕМУ
  if (
    text.startsWith("почему") ||
    text.startsWith("отчего") ||
    text.startsWith("с чего это")
  ) {
    return "Интересный вопрос! Чтобы объяснить причину, мне нужно немного больше контекста. Что именно произошло?";
  }

  // ЗАЧЕМ
  if (
    text.startsWith("зачем") ||
    text.startsWith("для чего")
  ) {
    return "Обычно у каждого действия есть своя цель. Уточни, о чём именно спрашиваешь, и разберёмся.";
  }

  // КАК
  if (
    text === "как" ||
    text.startsWith("как ") ||
    text === "каким образом"
  ) {
    return "Можешь уточнить вопрос? Я постараюсь объяснить максимально понятно.";
  }

  // ЧТО
  if (
    text.startsWith("что ") ||
    text === "что" ||
    text.startsWith("чего ")
  ) {
    return "Можешь немного уточнить вопрос? Хочу правильно тебя понять.";
  }

  // НИЧЕГО
  if (
    has(
      "ничего", "ничего нового",
      "да ничего", "вроде ничего",
      "ничем", "ничего особенного",
      "нечего делать"
    )
  ) {
    const answers = [
      "Понятно! Может, придумаем интересную тему?",
      "Бывает. Иногда ничего не делать тоже нормально.",
      "Тогда можем просто поболтать!",
      "Ясно! Может, есть какой-нибудь вопрос?"
    ];
    return answers[Math.floor(Math.random() * answers.length)];
  }

  // СОГЛАСИЕ
  if (
    has(
      "да", "ага", "угу", "ок", "окей",
      "хорошо", "ладно", "договорились",
      "конечно", "точно", "верно"
    )
  ) {
    return "Отлично! Что будем делать дальше?";
  }

  // НЕСОГЛАСИЕ
  if (
    has(
      "нет", "неа", "не", "неправильно",
      "не согласен", "не согласна"
    )
  ) {
    return "Хорошо, давай уточним. Что именно не так?";
  }

  // СПАСИБО
  if (
    includes(
      "спасибо", "спс", "благодарю",
      "большое спасибо", "пасиб", "сенкс",
      "thanks", "thank you"
    )
  ) {
    return "Пожалуйста! Обращайся, если понадобится помощь.";
  }

  // ИЗВИНИТЬСЯ
  if (
    includes(
      "извини", "извините", "прости",
      "прошу прощения", "сорри", "sorry"
    )
  ) {
    return "Ничего страшного! Всё нормально.";
  }

  // ХОРОШЕЕ НАСТРОЕНИЕ
  if (
    includes(
      "я рад", "я рада", "мне весело",
      "отличное настроение", "всё отлично",
      "все отлично", "всё прекрасно"
    )
  ) {
    return "Здорово! Пусть настроение таким и остаётся!";
  }

  // ПЛОХОЕ НАСТРОЕНИЕ
  if (
    includes(
      "мне грустно", "мне плохо",
      "плохое настроение", "я расстроен",
      "я расстроена", "скучно", "мне скучно"
    )
  ) {
    return "Жаль, что так. Хочешь рассказать, что случилось? Я постараюсь тебя выслушать.";
  }

  // СКУЧАЮ
  if (
    includes(
      "ты скучал", "ты скучала",
      "скучаешь по мне", "я скучал"
    )
  ) {
    return "Я всегда готов продолжить разговор, когда ты возвращаешься!";
  }

  // ШУТКИ
  if (
    includes(
      "расскажи шутку", "пошути",
      "скажи шутку", "хочу шутку",
      "анекдот"
    )
  ) {
    const jokes = [
      "Почему программист не любит природу? Там слишком много багов!",
      "Почему компьютер замёрз? Потому что открыл Windows!",
      "Программист зашёл в магазин за хлебом. Увидел багет и начал искать ошибку.",
      "Что сказал ноль восьмёрке? Классный ремень!"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  // FLASH
  if (
    includes("flash")
  ) {
    return "Flash — это наша платформа ИИ. Её собственный движок постепенно получает новые правила и возможности.";
  }

  // ПОМОЩЬ
  if (
    includes("помоги", "помощь", "help")
  ) {
    return "Конечно! Напиши, с чем нужна помощь. Я постараюсь разобраться.";
  }

  // ВОПРОС О ЗНАНИЯХ
  if (
    includes(
      "ты знаешь", "ты понимаешь",
      "ты можешь ответить", "ты умный",
      "ты глупый", "ты глупая"
    )
  ) {
    return "Я постоянно развиваюсь. Пока мои ответы основаны на наборе правил, которые постепенно расширяются.";
  }

  // НЕПОНЯТНЫЙ ЗАПРОС
  return "Пока я не нашёл подходящего ответа. Попробуй задать вопрос другими словами — мои знания ещё расширяются!";
}

app.get("/", (req, res) => {
  res.json({
    name: "Flash Plugin API",
    version: "2.0.0",
    status: "online",
    engine: "Flash AI Engine"
  });
});

app.post("/api/keys/create", async (req, res) => {
  try {
    const apiKey = "flash_" + crypto.randomBytes(32).toString("hex");

    await pool.query(
      "INSERT INTO api_keys (api_key, active) VALUES ($1, TRUE)",
      [apiKey]
    );

    res.json({ success: true, api_key: apiKey });
  } catch (error) {
    console.error("Key creation error:", error);
    res.status(500).json({
      success: false,
      error: "Не удалось создать API-ключ"
    });
  }
});

app.get("/api/keys/check", async (req, res) => {
  try {
    const valid = await checkApiKey(req);
    res.json({ valid });
  } catch (error) {
    console.error("Key check error:", error);
    res.status(500).json({
      valid: false,
      error: "Ошибка проверки ключа"
    });
  }
});

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
      .find(item =>
        item.role === "user" &&
        typeof item.content === "string"
      );

    const message = typeof req.body.message === "string"
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
