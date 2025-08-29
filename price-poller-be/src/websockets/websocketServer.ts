import { WebSocketServer } from 'ws';
import http from 'http';
import { redis } from '../lib/redisClient';

const WS_PORT = 3002; // Choose a different port than the Express server

const BID_ASK_CHANNEL = "bid_ask_updates"; // Must match the channel in queryWorker.ts

export const startWebSocketServer = () => {
  const server = http.createServer(); // Create a standalone HTTP server for WebSocket
  const wss = new WebSocketServer({ server });

  wss.on('connection', ws => {
    console.log('WebSocket client connected to bid/ask server');

    ws.on('close', () => {
      console.log('WebSocket client disconnected from bid/ask server');
    });

    ws.on('error', error => {
      console.error('WebSocket error on bid/ask server:', error);
    });
  });

  // Subscribe to Redis channel
  const subscriber = redis.duplicate(); // Duplicate the client for pub/sub
  subscriber.subscribe(BID_ASK_CHANNEL, (err, count) => {
    if (err) {
      console.error("Failed to subscribe to Redis channel:", err);
    } else {
      console.log(`Subscribed to ${count} channel(s)`);
    }
  });

  subscriber.on('message', (channel, message) => {
    if (channel === BID_ASK_CHANNEL) {
      // Broadcast message to all connected WebSocket clients
      wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(message);
        }
      });
    }
  });

  server.listen(WS_PORT, () => {
    console.log(`WebSocket server for bid/ask updates is running on ws://localhost:${WS_PORT}`);
  });
};