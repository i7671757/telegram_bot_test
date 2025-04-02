import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import logger from './utils/logger.js';

const app = new Elysia()
  .use(cors())
  .get('/', () => 'Telegram Bot API Server is running')
  .get('/health', () => ({ status: 'ok' }))
  .onError(({ code, error, set }) => {
    logger.error(`Server error: ${error.message}`);
    set.status = code === 'NOT_FOUND' ? 404 : 500;
    return { error: error.message };
  });

export const startServer = (port = process.env.PORT || 3000) => {
  app.listen(port, () => {
    logger.success(`Server is running on port ${port}`);
  });
};

export default app; 