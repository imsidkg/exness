import { WebSocketServer } from 'ws';
import http from 'http';
import { redis } from '../lib/redisClient';

const WS_PORT = 3002;

const BID_ASK_CHANNEL = "bid_ask_updates";
const TRADE_UPDATES_CHANNEL = "trade_updates"; // The new dedicated channel

export const startWebSocketServer = () => {
  const server = http.createServer();
  const wss = new WebSocketServer({ server });

  wss.on('connection', ws => {
    console.log('WebSocket client connected');
    ws.on('close', () => console.log('WebSocket client disconnected'));
    ws.on('error', error => console.error('WebSocket error:', error));
  });

  const subscriber = redis.duplicate();

  // Subscribe to both channels
  subscriber.subscribe(BID_ASK_CHANNEL, TRADE_UPDATES_CHANNEL, (err, count) => {
    if (err) {
      return console.error("Failed to subscribe to Redis channels:", err);
    }
    console.log(`Subscribed to ${count} channel(s).`);
  });

  // Listen for messages on any subscribed channel
  subscriber.on('message', (channel, message) => {
    // To help the client distinguish message types, we can wrap the data
    const outgoingPayload = JSON.stringify({
      channel: channel,
      data: JSON.parse(message) // We assume the message from Redis is a JSON string
    });

    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(outgoingPayload);
      }
    });
  });

  server.listen(WS_PORT, () => {
    console.log(`WebSocket server is running on ws://localhost:${WS_PORT}`);
  });
};

// A specific function for broadcasting trade updates
export const broadcastTradeUpdate = (message: string) => {
  redis.publish(TRADE_UPDATES_CHANNEL, message);
};
