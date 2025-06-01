const mc = require('minecraft-protocol');
const UUID = require('uuid');

// Bot configuration - support environment variables for Railway
const BOT_USERNAME = process.env.BOT_USERNAME || 'AFKBot123';
const SERVER_IP = process.env.SERVER_IP || 'saifhakengl.aternos.me';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '60701');
const RETRY_DELAY = 30000; // 30 seconds
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// Track bot state
let currentPosition = {
  x: 0,
  y: 72,
  z: 0,
  onGround: true,
  yaw: 0,
  pitch: 0
};
let hasSpawned = false;
let initialTeleportConfirmed = false;
let positionInterval = null;

async function pingServer() {
  return new Promise((resolve, reject) => {
    console.log(`Pinging server ${SERVER_IP}:${SERVER_PORT}...`);
    mc.ping({
      host: SERVER_IP,
      port: SERVER_PORT,
      version: '1.21.1'
    })
    .then(response => {
      console.log('Server ping successful:', {
        version: response.version,
        playersOnline: response.players?.online || 0,
        maxPlayers: response.players?.max || 0
      });
      resolve(true);
    })
    .catch(err => {
      console.error('Server ping failed:', err.message);
      resolve(false);
    });
  });
}

async function createBot() {
  if (isConnecting) {
    console.log('Already attempting to connect, skipping new connection attempt');
    return;
  }

  // Try to ping the server first
  const serverResponding = await pingServer();
  if (!serverResponding) {
    console.log('Server not responding to ping, will retry later');
    cleanup(null);
    return;
  }
  
  console.log(`Attempting to connect to server ${SERVER_IP}:${SERVER_PORT} as ${BOT_USERNAME}...`);
  isConnecting = true;

  const client = mc.createClient({
    host: SERVER_IP,
    port: SERVER_PORT,
    username: BOT_USERNAME,
    version: '1.21.1',
    hideErrors: false,
    keepAlive: true,
    skipValidation: true,
    closeTimeout: 120000, // Increased timeout
    connectTimeout: 120000, // Increased timeout
    auth: 'offline',
    uuid: UUID.v4(),
    locale: 'en_US',
    viewDistance: 2,
    chatMode: 0,
    chatColors: true,
    skinParts: 0xff,
    mainHand: 1,
    enableTextFiltering: false,
    allowServerListings: true
  });

  client.on('error', (err) => {
    console.error('CLIENT CONNECTION ERROR:', err);
    console.log('Error details:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      syscall: err.syscall
    });
    cleanup(client);
  });

  client.on('end', () => {
    console.log('Connection ended (event from client)');
    cleanup(client);
  });

  client.on('disconnect', (packet) => {
    console.log('Disconnected by server. Reason:', packet?.reason ? JSON.stringify(packet.reason) : 'No reason provided');
    cleanup(client);
  });

  client.on('kick_disconnect', (data) => {
    console.log('Kicked from server. Reason:', typeof data === 'string' ? data : JSON.stringify(data));
    cleanup(client);
  });

  client.on('connect', () => {
    console.log('Successfully established connection with server (connect event).');
  });

  client.on('state', (newState) => {
    console.log('Client state changed to:', newState);
    if (newState === mc.states.PLAY && !hasSpawned) {
      hasSpawned = true;
      console.log('Entered PLAY state, bot should now be visible in game.');
      
      // Start position updates after successful spawn
      if (!positionInterval) {
        positionInterval = setInterval(() => {
          if (client.state === mc.states.PLAY && hasSpawned) {
            client.write('position_look', currentPosition);
          }
        }, 1000);
      }
    }
  });

  // Handle server position updates
  client.on('position', (packet) => {
    if (packet.teleportId !== undefined) {
      currentPosition.x = packet.x;
      currentPosition.y = packet.y;
      currentPosition.z = packet.z;
      currentPosition.yaw = packet.yaw;
      currentPosition.pitch = packet.pitch;
      currentPosition.onGround = true;
      
      client.write('teleport_confirm', { teleportId: packet.teleportId });
      client.write('position_look', currentPosition);
      
      if (!initialTeleportConfirmed) {
        initialTeleportConfirmed = true;
        console.log('Initial position synchronized with server');
      }
    }
  });
}

function cleanup(client) {
  console.log('Cleanup routine called.');
  if (positionInterval) {
    console.log('Clearing position interval in cleanup.');
    clearInterval(positionInterval);
    positionInterval = null;
  }
  try {
    if (client) {
      console.log('Removing all listeners and ending client connection in cleanup.');
      client.removeAllListeners();
      client.end('Disconnecting gracefully');
    }
  } catch (e) {
    console.error('Error during cleanup:', e);
  }
  
  isConnecting = false;
  hasSpawned = false;
  initialTeleportConfirmed = false;
  
  handleDisconnect();
}

function handleDisconnect() {
  console.log('handleDisconnect routine called.');
  reconnectAttempts++;
  console.log(`Preparing to reconnect. Attempt: ${reconnectAttempts} of ${MAX_RECONNECT_ATTEMPTS}`);

  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
    console.log(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Waiting for 5 minutes before resetting counter...`);
    reconnectAttempts = 0;
    setTimeout(createBot, 300000);
  } else {
    console.log(`Waiting ${RETRY_DELAY/1000} seconds before reconnecting...`);
    setTimeout(createBot, RETRY_DELAY);
  }
}

// Start the bot
console.log('Starting Minecraft AFK Bot...');
console.log('Configuration:', {
  username: BOT_USERNAME,
  server: SERVER_IP,
  port: SERVER_PORT
});
createBot();

process.on('SIGINT', () => {
  console.log('SIGINT received. Bot shutting down...');
  process.exit(0);
}); 