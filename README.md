# Minecraft AFK Bot

A simple Minecraft AFK bot that maintains connection to a specified server.

## Features

- Connects to Minecraft servers
- Maintains connection with proper keep-alive responses
- Handles position updates and teleportation
- Automatically reconnects on disconnection

## Setup

1. Make sure you have Node.js installed
2. Clone this repository
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the bot:
   ```bash
   npm start
   ```

## Configuration

Edit the following variables in `bot.js` to configure the bot:

- `BOT_USERNAME`: The username for the bot
- `SERVER_IP`: The server IP address
- `SERVER_PORT`: The server port

## Environment Variables

The following environment variables can be set:
- `BOT_USERNAME`: (Optional) Override the bot username
- `SERVER_IP`: (Optional) Override the server IP
- `SERVER_PORT`: (Optional) Override the server port 