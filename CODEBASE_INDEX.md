# Exness Trading Platform - Codebase Index

## Overview
A full-stack trading platform with real-time price data, candlestick charts, and trading functionality. Built with React/TypeScript frontend and Node.js/TypeScript backend using TimescaleDB for time-series data.

## Project Structure

### Frontend (`frontend/`)
- **Framework**: React 19 + TypeScript + Vite
- **Charting**: Lightweight Charts library
- **Real-time**: WebSocket connections for live price updates

#### Key Files:
- `src/App.tsx` - Main application component with trading interface
- `src/components/Auth.tsx` - Authentication component (login/signup)
- `src/components/CandleSticks.tsx` - Candlestick chart component
- `src/main.tsx` - Application entry point

#### Dependencies:
- `react`, `react-dom` - UI framework
- `lightweight-charts` - Trading chart library
- `vite` - Build tool and dev server

### Backend (`price-poller-be/`)
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL with TimescaleDB extension
- **Real-time**: WebSocket server + Redis pub/sub
- **Authentication**: JWT tokens

#### Key Components:

##### Core Services:
- `src/services/tradeService.ts` - Trade management, PnL calculation, liquidation monitoring
- `src/services/timescaleService.ts` - TimescaleDB operations
- `src/services/userService.ts` - User management
- `src/services/aggregrator.ts` - Data aggregation

##### WebSocket Services:
- `src/websockets/binanceSocket.ts` - Binance WebSocket connection for price data
- `src/websockets/websocketServer.ts` - WebSocket server for real-time updates

##### Background Workers:
- `src/workers/pnlWorker.ts` - Profit/Loss calculation worker
- `src/workers/queryWorker.ts` - Database query processing worker
- `src/workers/tradeWorker.ts` - Trade processing worker

##### Controllers:
- `src/controllers/candleController.ts` - Candlestick data endpoints
- `src/controllers/tradeController.ts` - Trade operations
- `src/controllers/userController.ts` - User authentication and management

##### Routes:
- `src/routes/authRoutes.ts` - Authentication endpoints
- `src/routes/tradeRoutes.ts` - Trade endpoints

##### Database:
- `src/config/db.ts` - PostgreSQL connection pool
- `src/db/init.ts` - Database schema initialization
- `src/lib/redisClient.ts` - Redis client configuration

##### Models:
- `src/models/ticker.ts` - Price ticker data model
- `src/models/trade.ts` - Trade data model
- `src/models/user.ts` - User data model

#### Dependencies:
- `express` - Web framework
- `pg` - PostgreSQL client
- `ioredis` - Redis client
- `ws` - WebSocket library
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `zod` - Schema validation

## Database Schema

### Tables:
1. **tickers** - Time-series price data (TimescaleDB hypertable)
   - `time` (TIMESTAMPTZ), `symbol`, `trade_price`, `bid_price`, `ask_price`, `volume`

2. **users** - User accounts
   - `id` (UUID), `email`, `password`

3. **balances** - User balances
   - `user_id` (UUID), `balance` (DOUBLE PRECISION)

4. **trades** - Trading positions
   - `order_id` (UUID), `user_id`, `type` (buy/sell), `margin`, `leverage`, `symbol`
   - `entry_price`, `status` (open/closed/liquidated), `quantity`
   - `stop_loss`, `take_profit`, `exit_price`, `realized_pnl`

### Views:
- **tickers_hourly** - Materialized view for aggregated hourly data

## Key Features

### Real-time Price Data
- Connects to Binance WebSocket for live price feeds
- Redis pub/sub for broadcasting price updates
- WebSocket server for frontend real-time updates

### Trading System
- Buy/sell orders with leverage
- Stop loss and take profit orders
- Automatic liquidation monitoring
- PnL calculation (realized and unrealized)

### Authentication
- JWT-based authentication
- User registration and login
- Protected API endpoints

### Charting
- Interactive candlestick charts
- Multiple time intervals (1m, 1h, etc.)
- Real-time chart updates

## Architecture

### Data Flow:
1. Binance WebSocket → Price data → TimescaleDB
2. Redis pub/sub → Real-time price updates → Frontend
3. Frontend trades → Backend API → Database
4. Background workers monitor positions for liquidation

### Services:
- **Main API Server** (port 3001) - REST endpoints
- **WebSocket Server** (port 3002) - Real-time updates
- **Background Workers** - Async processing

## Development Setup

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Backend:
```bash
cd price-poller-be
npm install
npm start
```

### Database Requirements:
- PostgreSQL with TimescaleDB extension
- Redis server

## Environment Configuration

### Database:
- PostgreSQL: `localhost:5432`
- Database: `my_timescaledb`
- User: `postgres`
- Password: `newpassword`

### Redis:
- Default localhost configuration

### Ports:
- Frontend: 5173 (Vite dev server)
- Backend API: 3001
- WebSocket: 3002

## API Endpoints

### Authentication:
- `POST /api/v1/user/signup` - User registration
- `POST /api/v1/user/signin` - User login
- `GET /api/v1/user/balance` - Get user balance

### Trading:
- `POST /api/v1/trade` - Place a trade
- `POST /api/v1/trade/close` - Close a trade
- `GET /api/v1/trade/closed` - Get closed trades
- `GET /api/v1/trade/open` - Get open trades

### Market Data:
- `GET /candles/:symbol` - Get historical candlestick data

## Real-time Channels

### Redis Pub/Sub Channels:
- `bid_ask_updates` - Price updates
- `trade_updates` - Trade notifications
- `unrealized_pnl` - PnL updates

## Security Features

- JWT authentication middleware
- Password hashing with bcrypt
- Protected API routes
- Input validation

## Monitoring & Logging

- Console logging for key operations
- Trade liquidation monitoring
- Error handling throughout

## Scalability Considerations

- TimescaleDB for high-frequency time-series data
- Redis for real-time pub/sub
- Background workers for async processing
- Connection pooling for database
