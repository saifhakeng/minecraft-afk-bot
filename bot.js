const mc = require('minecraft-protocol');
const UUID = require('uuid');

// Bot configuration - support environment variables for Railway
const BOT_USERNAME = process.env.BOT_USERNAME || 'AFKBot123';
const SERVER_IP = process.env.SERVER_IP || 'saifhakengl.aternos.me';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '60701');
const RETRY_DELAY = 20000;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

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
let positionInterval = null; // To store the interval ID

function createBot() {
  if (isConnecting) return;
  isConnecting = true;

  console.log('Attempting to connect to server...');

  const client = mc.createClient({
    host: SERVER_IP,
    port: SERVER_PORT,
    username: BOT_USERNAME,
    version: '1.21.1',
    hideErrors: false,
    keepAlive: true,
    skipValidation: false,
    closeTimeout: 30000, 
    connectTimeout: 90000, 
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
    console.error('CLIENT CONNECTION ERROR:', err); // Log as error for visibility
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

  client.on('login', (packet) => {
    console.log('Successfully logged in (login event). Entity ID:', packet.entityId);
  });

  client.on('state', (newState) => {
    console.log('Client state changed to:', newState);
    if (newState === mc.states.PLAY && !hasSpawned) {
      hasSpawned = true; 
      console.log('Entered PLAY state.');
    }
  });

  client.on('spawn_position', (packet) => {
    console.log('Received world spawn_position (informational packet from server):', packet);
  });

  client.on('position', (packet) => {
    try {
      console.log('Server sent position packet (player sync):', JSON.stringify(packet));
      if (packet.teleportId !== undefined) {
        if (!initialTeleportConfirmed && hasSpawned) {
          console.log(`Initial server position sync with teleportId: ${packet.teleportId}. Confirming and synchronizing.`);
          currentPosition.x = packet.x;
          currentPosition.y = packet.y;
          currentPosition.z = packet.z;
          currentPosition.yaw = packet.yaw;
          currentPosition.pitch = packet.pitch;
          currentPosition.onGround = true; 

          client.write('teleport_confirm', { teleportId: packet.teleportId });
          console.log('Initial teleport_confirm sent for ID:', packet.teleportId);

          client.write('position_look', {
            x: currentPosition.x,
            y: currentPosition.y,
            z: currentPosition.z,
            yaw: currentPosition.yaw,
            pitch: currentPosition.pitch,
            onGround: currentPosition.onGround
          });
          console.log('Initial position_look sent to confirm synchronization:', currentPosition);
          
          initialTeleportConfirmed = true;

          if (positionInterval) clearInterval(positionInterval);
          console.log('Starting periodic position_look updates...');
          positionInterval = setInterval(() => {
            try {
              if (client.state === mc.states.PLAY && hasSpawned && initialTeleportConfirmed) {
                // console.log('[Periodic] Attempting to send position_look:', currentPosition); // Very verbose, uncomment if needed
                client.write('position_look', {
                  x: currentPosition.x,
                  y: currentPosition.y,
                  z: currentPosition.z,
                  yaw: currentPosition.yaw,
                  pitch: currentPosition.pitch,
                  onGround: currentPosition.onGround
                });
                // console.log('[Periodic] position_look sent.'); // Very verbose
              } else {
                // console.log('[Periodic] Skipped sending position_look. State:', { state: client.state, hasSpawned, initialTeleportConfirmed });
              }
            } catch (err) {
              console.error('CRITICAL ERROR sending periodic position_look update:', err);
            }
          }, 1000);
          console.log('Periodic position_look updates started successfully.');

        } else if (initialTeleportConfirmed && hasSpawned) {
          console.log(`Subsequent server position sync with teleportId: ${packet.teleportId}. Confirming.`);
          currentPosition.x = packet.x;
          currentPosition.y = packet.y;
          currentPosition.z = packet.z;
          currentPosition.yaw = packet.yaw;
          currentPosition.pitch = packet.pitch;
          currentPosition.onGround = true; 

          client.write('teleport_confirm', { teleportId: packet.teleportId });
          console.log('Subsequent teleport_confirm sent for ID:', packet.teleportId);
        } else {
          console.warn('Received position with teleportId but conditions not met (initialTeleportConfirmed or hasSpawned is false). Ignoring for confirm logic.', 
                      {teleportId: packet.teleportId, initialTeleportConfirmed, hasSpawned });
        }
      } else {
        // console.log('Received position packet from server without teleportId (likely relative player move, not a teleport sync):', packet);
      }
    } catch (err) {
      console.error('CRITICAL ERROR handling server position packet:', err);
    }
  });

  client.on('success', (packet) => { // login success
    console.log('Successfully authenticated and joined game (login success packet)! Entity ID from this packet:', packet.entityId, 'UUID:', packet.uuid);
    isConnecting = false;
    reconnectAttempts = 0;
  });

  client.on('end', () => {
    // This is already handled by the specific 'end' handler defined earlier.
    // console.log('Connection ended event from client side or error.');
    // if (positionInterval) clearInterval(positionInterval);
    // positionInterval = null;
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
      client.end('disconnect.quitting'); // Attempt graceful disconnect
    }
  } catch (e) {
    console.error('Error while ending client during cleanup:', e);
  }
  
  if (!isConnecting) { // Avoid triggering reconnect if we are already in the process of connecting
    console.log('Calling handleDisconnect from cleanup.');
    handleDisconnect(); 
  } else {
    console.log('Skipping handleDisconnect in cleanup as isConnecting is true.');
  }
}

function handleDisconnect() {
  console.log('handleDisconnect routine called.');
  // Check if a reconnection attempt is already scheduled or in progress implicitly by isConnecting being false
  if (isConnecting && reconnectAttempts > 0) { 
    console.warn('handleDisconnect: A connection attempt is likely already in progress or scheduled (isConnecting=true with attempts > 0). Suppressing new reconnect attempt.');
    return;
  }
  
  isConnecting = false;
  hasSpawned = false; 
  initialTeleportConfirmed = false;
  
  // If positionInterval was somehow not cleared, ensure it is.
  if (positionInterval) {
      console.warn('positionInterval was still active in handleDisconnect. Clearing now.');
      clearInterval(positionInterval);
      positionInterval = null;
  }

  reconnectAttempts++;
  console.log(`Preparing to reconnect. Attempt: ${reconnectAttempts} of ${MAX_RECONNECT_ATTEMPTS}.`);

  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) { 
    console.log(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Waiting for 5 minutes before trying again...`);
    reconnectAttempts = 0;
    setTimeout(createBot, 300000); 
  } else {
    console.log(`Waiting ${RETRY_DELAY/1000} seconds before reconnecting...`);
    setTimeout(createBot, RETRY_DELAY);
  }
}

// Start the bot
createBot();

process.on('SIGINT', () => {
  console.log('SIGINT received. Bot shutting down...');
  if (positionInterval) {
    console.log('Clearing position interval due to SIGINT.');
    clearInterval(positionInterval);
  }
  // Ideally, get a reference to the current client and call cleanup(client) or client.end()
  // For now, exiting directly after attempting to clear interval.
  process.exit(0);
}); 