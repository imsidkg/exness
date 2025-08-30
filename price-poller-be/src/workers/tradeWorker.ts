
import { redis } from '../lib/redisClient';
import { createTrade } from '../services/tradeService';
import { broadcastTradeUpdate } from '../websockets/websocketServer'; // Corrected import

const TRADE_QUEUE_NAME = 'trade:order:queue';
const MAX_RETRIES = 3;

interface TradeJob {
  userId: number;
  tradeDetails: Omit<TradeRequest, 'margin'>;
}

const processTradeJob = async (job: TradeJob) => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt} for user ${job.userId}, trade: ${job.tradeDetails.symbol}`);
      const orderId = await createTrade(job.userId, job.tradeDetails);

      // On success, broadcast and exit
      console.log(`Successfully created trade ${orderId} for user ${job.userId}`);
      // Use the new, specific broadcast function
      broadcastTradeUpdate(JSON.stringify({
        type: 'TRADE_SUCCESS',
        userId: job.userId,
        orderId: orderId,
        tradeDetails: job.tradeDetails
      }));
      return; // Exit after success
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed for user ${job.userId}: ${error.message}`);
      if (attempt === MAX_RETRIES) {
        // All retries failed, broadcast failure and give up
        console.error(`All ${MAX_RETRIES} retries failed for user ${job.userId}. Job will be discarded.`);
        // Use the new, specific broadcast function
        broadcastTradeUpdate(JSON.stringify({
          type: 'TRADE_FAILURE',
          userId: job.userId,
          reason: error.message,
          tradeDetails: job.tradeDetails
        }));
      }
      // Optional: Add a small delay before retrying
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
    }
  }
};

export const startTradeWorker = async () => {
  console.log('Trade worker started, waiting for jobs...');
  while (true) {
    try {
      // BRPOP is a blocking call, it will wait until a job is available
      const result = await redis.brpop(TRADE_QUEUE_NAME, 0);
      if (result) {
        const jobString = result[1];
        const job: TradeJob = JSON.parse(jobString);
        // Process the job without awaiting it to allow the loop to continue listening
        processTradeJob(job);
      }
    } catch (error) {
      console.error('Critical error in trade worker loop:', error);
      // Avoid crashing the worker on a single job parse error
    }
  }
};

// Start the worker if this file is run directly
if (require.main === module) {
  startTradeWorker();
}
