import { WebSocketServer } from 'ws';
import http from 'http';
import { BID_ASK_CHANNEL, redis, UNREALIZED_PNL_CHANNEL } from '../lib/redisClient';

const WS_PORT = 3002;

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

  // Subscribe to all relevant channels
  subscriber.subscribe(BID_ASK_CHANNEL, TRADE_UPDATES_CHANNEL, UNREALIZED_PNL_CHANNEL, (err, count) => {
    if (err) {
      return console.error("Failed to subscribe to Redis channels:", err);
    }
    console.log(`Subscribed to ${count} channel(s).`);
  });

  subscriber.on('message', (channel, message) => {
    try {
      // To help the client distinguish message types, we can wrap the data
      const outgoingPayload = JSON.stringify({
        channel: channel,
        data: JSON.parse(message), // We assume the message from Redis is a JSON string
      });

      wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(outgoingPayload);
        }
      });
    } catch (error) {
      console.error(`Error parsing or sending message on channel ${channel}:`, error);
    }
  });

  server.listen(WS_PORT, () => {
    console.log(`WebSocket server is running on ws://localhost:${WS_PORT}`);
  });
};

// A specific function for broadcasting trade updates
export const broadcastTradeUpdate = (message: string) => {
  redis.publish(TRADE_UPDATES_CHANNEL, message);
};