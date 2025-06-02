require('dotenv').config();
const mineflayer = require('mineflayer');

// Bot configuration
const BOT_USERNAME = process.env.MC_USERNAME;
const SERVER_IP = 'donutsmp.net';
const SERVER_PORT = 25565;

// Check if credentials are provided
if (!BOT_USERNAME) {
  console.error('Error: Minecraft username not found in environment variables!');
  console.error('Please set MC_USERNAME environment variable.');
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
    auth: 'microsoft',
    authTitle: 'Minecraft AFK Bot',
    flow: 'msal',
    password: process.env.MC_PASSWORD,
    authOptions: {
      clientId: '389b1b32-b5d5-43b2-bddc-84ce938d6737',
      flow: 'msal'
    }
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