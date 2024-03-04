import TelegramBot from "node-telegram-bot-api";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config();
const worksID = {};
const token = process.env.TOKENTELEGRAM;

// Crea un nuevo bot usando el token
const bot = new TelegramBot(token, { polling: true });

const client = createClient({
  url: "http://127.0.0.1:8080",
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
  worksID.patente = messageText.split(",")[0].trim();
  worksID.workid = messageText.split(",")[1].trim();
  worksID.container = messageText.split(",")[2].trim();

  console.log(worksID);

  try {
    // Insertar datos en la base de datos
    await client.query(
      "INSERT INTO Maersk (Patente, WorkId, Contenedor) VALUES ($1, $2, $3)",
      [worksID.patente, worksID.workid, worksID.container]
    );

    console.log("Datos insertados correctamente en la base de datos");
  } catch (error) {
    console.error("Error al insertar datos en la base de datos:", error.message);
  }
});

bot;
