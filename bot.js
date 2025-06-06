require('dotenv').config();
const mineflayer = require('mineflayer');

// Bot configuration
const BOT_USERNAME = process.env.MC_USERNAME;
const SERVER_IP = 'donutsmp.net';
const SERVER_PORT = 25565;
const MAX_RETRY_DELAY = 300000; // 5 minutes
let retryCount = 0;

// Check if credentials are provided
if (!BOT_USERNAME) {
  console.error('Error: Minecraft username not found in environment variables!');
  console.error('Please set MC_USERNAME environment variable.');
  process.exit(1);
}

function getRetryDelay() {
  // Exponential backoff: 30 seconds * 2^retryCount, max 5 minutes
  return Math.min(30000 * Math.pow(2, retryCount), MAX_RETRY_DELAY);
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
    version: '1.20.1',
    username: BOT_USERNAME,
    auth: 'microsoft',
    onMsaCode: (data) => {
      console.log('To authenticate:');
      console.log('1. Open this URL:', data.verification_uri);
      console.log('2. Enter this code:', data.user_code);
    }
  });

  bot.on('spawn', () => {
    console.log('Bot has spawned in game');
    retryCount = 0; // Reset retry count on successful connection
    // Start anti-AFK movement
    setInterval(() => {
      bot.swingArm('right');
    }, 10000);
  });

  bot.on('error', (err) => {
    console.error('Error:', err);
    
    // Check for specific error types
    if (err.toString().includes('ACCOUNT_SUSPENDED')) {
      console.error('Account is suspended. Please check your account status at minecraft.net');
      process.exit(1); // Exit as this requires manual intervention
    }
    
    if (err.toString().includes('Too Many Requests')) {
      console.log('Rate limited by authentication service. Increasing retry delay...');
      retryCount++;
    }

    const delay = getRetryDelay();
    console.log(`Attempting reconnection in ${delay/1000} seconds...`);
    setTimeout(createBot, delay);
  });

  bot.on('kicked', (reason) => {
    console.log('Bot was kicked:', reason);
    retryCount++;
    const delay = getRetryDelay();
    console.log(`Attempting reconnection in ${delay/1000} seconds...`);
    setTimeout(createBot, delay);
  });

  bot.on('end', () => {
    console.log('Bot disconnected, attempting to reconnect...');
    retryCount++;
    const delay = getRetryDelay();
    console.log(`Attempting reconnection in ${delay/1000} seconds...`);
    setTimeout(createBot, delay);
  });
}

// Start the bot
createBot();

process.on('SIGINT', () => {
  console.log('Bot shutting down...');
  process.exit(0);
}); 