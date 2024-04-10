const TelegramBot = require("node-telegram-bot-api");
const sqlite3 = require("sqlite3").verbose();
const dotenv = require("dotenv");
import { createClient } from "@libsql/client";

dotenv.config();

const worksID = {};
const token = process.env.TOKENTELEGRAM;

// Crea un nuevo bot usando el token
const bot = new TelegramBot(token, { polling: true });

const client = createClient({
  url: "127.0.0.1:8080",
});

// Maneja los mensajes de texto
bot.on("text", async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // Puedes realizar acciones o enviar respuestas aquí
  // Por ejemplo, puedes responder al mensaje recibido
  bot.sendMessage(chatId, `Recibí el siguiente mensaje: ${messageText}`);
  console.log(messageText);
  console.log(chatId);

  // Split the message and store in worksID object
  const messageParts = messageText.split(",");

  if (messageParts.length >= 3) {
    worksID.patente = messageParts[0].trim();
    worksID.workid = messageParts[1].trim();
    worksID.container = messageParts[2].trim();

    console.log(worksID);

    try {
      // Insertar datos en la base de datos SQLite

      console.log("Datos insertados correctamente en la base de datos");
    } catch (error) {
      console.error(
        "Error al insertar datos en la base de datos:",
        error.message
      );
      console.error("Stack trace:", error.stack);
    }
  }
});

// Inicia el bot
bot;
