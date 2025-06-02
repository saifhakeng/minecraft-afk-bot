require('dotenv').config();
const mineflayer = require('mineflayer');

// Bot configuration
const BOT_USERNAME = process.env.MC_USERNAME;
const BOT_PASSWORD = process.env.MC_PASSWORD;
const SERVER_IP = 'donutsmp.net';  // Hardcoded server IP
const SERVER_PORT = 25565;  // Hardcoded server port

// Check if credentials are provided
if (!BOT_USERNAME || !BOT_PASSWORD) {
  console.error('Error: Minecraft credentials not found in environment variables!');
  console.error('Please set MC_USERNAME and MC_PASSWORD environment variables.');
  process.exit(1);
}

function createBot() {
  console.log('Starting Minecraft AFK Bot...');
  console.log('Configuration:', {
    username: BOT_USERNAME,
    server: SERVER_IP,
    port: SERVER_PORT
  });

  const bot = mineflayer.createBot({
    host: SERVER_IP,
    port: SERVER_PORT,
    username: BOT_USERNAME,
    password: BOT_PASSWORD,
    auth: 'microsoft'
  });

  bot.on('spawn', () => {
    console.log('Bot has spawned in game');
    // Start anti-AFK movement
    setInterval(() => {
      bot.swingArm('right');
    }, 10000);
  });

  bot.on('error', (err) => {
    console.error('Error:', err);
    setTimeout(createBot, 30000);
  });

  bot.on('kicked', (reason) => {
    console.log('Bot was kicked:', reason);
    setTimeout(createBot, 30000);
  });

  bot.on('end', () => {
    console.log('Bot disconnected, attempting to reconnect...');
    setTimeout(createBot, 30000);
  });
}

// Start the bot
createBot();

process.on('SIGINT', () => {
  console.log('Bot shutting down...');
  process.exit(0);
}); 