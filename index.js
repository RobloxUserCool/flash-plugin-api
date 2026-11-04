import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Хранилище API-ключей
const apiKeys = new Map();

// Генерация ключа
app.post("/api/keys/create", (req, res) => {
    const key = "flash_" + crypto.randomBytes(32).toString("hex");

    apiKeys.set(key, {
        active: true,
        created: new Date().toISOString()
    });

    res.json({
        success: true,
        api_key: key
    });
});

// Проверка ключа
app.get("/api/keys/check", (req, res) => {
    const key = req.headers["x-api-key"];

    if (!key || !apiKeys.has(key)) {
        return res.status(401).json({
            success: false,
            error: "Invalid API key"
        });
    }

    res.json({
        success: true,
        message: "API key is valid"
    });
});

// Информация об API
app.get("/", (req, res) => {
    res.json({
        name: "Flash Plugin API",
        version: "1.0.0",
        status: "online"
    });
});

app.listen(PORT, () => {
    console.log(`Flash Plugin API running on port ${PORT}`);
});
