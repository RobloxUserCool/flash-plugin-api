import express from "express";
import cors from "cors";
import crypto from "crypto";
import pg from "pg";

const { Pool } = pg;

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initializeDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS api_keys (
            id SERIAL PRIMARY KEY,
            api_key TEXT UNIQUE NOT NULL,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// Главная
app.get("/", (req, res) => {
    res.json({
        name: "Flash Plugin API",
        version: "1.0.0",
        status: "online",
        database: "connected"
    });
});

// Создание API-ключа
app.post("/api/keys/create", async (req, res) => {
    try {
        const key = "flash_" + crypto.randomBytes(32).toString("hex");

        await pool.query(
            "INSERT INTO api_keys (api_key) VALUES ($1)",
            [key]
        );

        res.json({
            success: true,
            api_key: key
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: "Key creation failed"
        });
    }
});

// Проверка API-ключа
app.get("/api/keys/check", async (req, res) => {
    try {
        const key = req.headers["x-api-key"];

        const result = await pool.query(
            "SELECT id FROM api_keys WHERE api_key = $1 AND active = TRUE",
            [key]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: "Invalid API key"
            });
        }

        res.json({
            success: true,
            message: "API key is valid"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Database error"
        });
    }
});

// Запуск
async function start() {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log("Flash Plugin API started");
        });
    } catch (error) {
        console.error("Startup error:", error);
        process.exit(1);
    }
}

start();
