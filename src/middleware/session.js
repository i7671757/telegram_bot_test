import logger from '../utils/logger.js';
import { updateSession, getPreviousState } from '../utils/sessionStorage.js';

// Middleware для управления сессиями
const sessionMiddleware = async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return next();
  
  // Инициализируем сессию, если она не существует
  if (!ctx.session) {
    ctx.session = { language: 'ru', navigationHistory: [] };
  }
  
  // Добавляем методы для работы с сессией
  ctx.updateSession = async (data) => {
    ctx.session = await updateSession(userId, data);
    return ctx.session;
  };
  
  ctx.getPreviousState = async () => {
    return await getPreviousState(userId);
  };
  
  if (ctx.session.language) {
    ctx.i18n.locale(ctx.session.language);
  }
  
  return next();
};

export default sessionMiddleware; 