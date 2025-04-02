import logger from '../utils/logger.js';

/**
 * Middleware для обработки ошибок в Telegraf
 * @param {Object} ctx - Контекст Telegraf
 * @param {Function} next - Следующий middleware
 */
const errorHandler = async (ctx, next) => {
  try {
    // Логируем входящие сообщения для отладки
    if (ctx.message) {
      logger.debug(`Входящее сообщение от ${ctx.from.id} (${ctx.from.username || 'no username'}): ${ctx.message.text || JSON.stringify(ctx.message)}`);
    }
    await next();
  } catch (error) {
    // Логируем ошибку
    logger.error(`Ошибка при обработке обновления [${ctx.updateType}]`, error);
    
    // Отправляем пользователю сообщение об ошибке, если возможно
    try {
      await ctx.reply('Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.');
    } catch (replyError) {
      logger.error('Не удалось отправить сообщение об ошибке пользователю', replyError);
    }
  }
};

export default errorHandler; 