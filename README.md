# Minecraft AFK Bot

A Node.js-based Minecraft AFK bot that can maintain a persistent connection to your Minecraft server.

## Features

- Automatic reconnection on disconnection
- Environment variable support for configuration
- Position tracking and synchronization
- Configurable retry attempts

## Configuration

The bot can be configured using environment variables:
- `BOT_USERNAME`: The username for the bot (default: 'AFKBot123')
- `SERVER_IP`: The Minecraft server IP address (default: 'saifhakengl.aternos.me')
- `SERVER_PORT`: The server port (default: 60701)

## Deployment on Railway

### Prerequisites
1. Create a [Railway account](https://railway.app/)
2. Install the [Railway CLI](https://docs.railway.app/develop/cli)

### Steps to Deploy
1. Login to Railway:
   ```bash
   railway login
   ```

2. Initialize Railway in your project:
   ```bash
   railway init
   ```

3. Add environment variables in Railway dashboard:
   - `BOT_USERNAME`
   - `SERVER_IP`
   - `SERVER_PORT`

4. Deploy the bot:
   ```bash
   railway up
   ```

### Monitoring
- Monitor your bot's status in the Railway dashboard
- Check logs for any connection issues
- The bot will automatically restart on failure (up to 10 retries)

## Local Development
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your configuration
4. Run the bot:
   ```bash
   node bot.js
   ```

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

## Environment Variables

The following environment variables can be set:
- `BOT_USERNAME`: (Optional) Override the bot username
- `SERVER_IP`: (Optional) Override the server IP
- `SERVER_PORT`: (Optional) Override the server port 