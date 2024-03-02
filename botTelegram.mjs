import TelegramBot from "node-telegram-bot-api";

const worksID = {};
const token = "7092211064:AAHlRsgA1D0H7nddcQOJtj2iZRwvZne_U7c";

// Crea un nuevo bot usando el token
const bot = new TelegramBot(token, { polling: true });

// Maneja los mensajes de texto
bot.on("text", (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // Puedes realizar acciones o enviar respuestas aquí
  // Por ejemplo, puedes responder al mensaje recibido
  bot.sendMessage(chatId, `Recibí el siguiente mensaje: ${messageText}`);
  console.log(messageText);
  console.log(chatId);

  // Split the message and store in worksID object
  worksID.patente = messageText.split(',')[0].trim();
  worksID.codigo = messageText.split(',')[1].trim();

  console.log(worksID);
});

// Start the bot
bot;
