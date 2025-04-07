import { Markup } from 'telegraf';
import i18n from '../config/i18n.js';
import logger from '../utils/logger.js';

export const locationHandlers = (bot) => {
  // Handle "Самовывоз" button
  bot.hears('🚶 Самовывоз', async (ctx) => {
    try {
      // Очищаем предыдущую локацию при начале нового процесса
      ctx.session.pendingLocation = null;
      
      await ctx.reply('Где Вы находитесь 👀? Если Вы отправите локацию 📍, мы определим ближайший к Вам филиал', 
        Markup.keyboard([
          [{ text: '📍 Отправить локацию', request_location: true }],
          ['⬅️ Назад']
        ]).resize()
      );
      logger.info(`Пользователь ${ctx.from.id} выбрал самовывоз`);
    } catch (error) {
      logger.error(`Ошибка при запросе локации для пользователя ${ctx.from.id}:`, error);
      await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
  });

  // Handle location sharing
  bot.on('location', async (ctx) => {
    try {
      const { latitude, longitude } = ctx.message.location;
      
      // Инициализируем сессию, если она не существует
      if (!ctx.session) {
        ctx.session = {};
      }
      
      // Store location in session
      ctx.session.pendingLocation = { latitude, longitude };

      // First send the location back
      await ctx.replyWithLocation(latitude, longitude);
      
      // Then send the address and confirmation message with confirmation buttons
      await ctx.reply(
        'Ваш адрес: Sharof Rashidov ko\'chasi, Qashg\'ar (C-4) dahasi, Yunusobod Tumani, Toshkent, 100000, O\'zbekiston\n\n' +
        'Подтвердите или заново отправьте локацию 📍',
        Markup.keyboard([
          ['✅ Подтвердить'],
          [{ text: '📍 Отправить локацию', request_location: true }],
          ['⬅️ Назад']
        ]).resize()
      );
      
      logger.info(`Пользователь ${ctx.from.id} отправил локацию: ${latitude}, ${longitude}`);
    } catch (error) {
      logger.error(`Ошибка при обработке локации от пользователя ${ctx.from.id}:`, error);
      await ctx.reply('Произошла ошибка при обработке локации. Попробуйте позже.');
    }
  });

  // Handle confirmation button
  bot.hears('✅ Подтвердить', async (ctx) => {
    try {
      // Инициализируем сессию, если она не существует
      if (!ctx.session) {
        ctx.session = {};
      }

      // Проверяем наличие локации в сессии
      if (!ctx.session.pendingLocation) {
        logger.warn(`Пользователь ${ctx.from.id} пытается подтвердить локацию, но она не найдена в сессии`);
        await ctx.reply('Пожалуйста, отправьте локацию заново.',
          Markup.keyboard([
            [{ text: '📍 Отправить локацию', request_location: true }],
            ['⬅️ Назад']
          ]).resize()
        );
        return;
      }

      const { latitude, longitude } = ctx.session.pendingLocation;
      
      // Process the confirmed location here
      // For example, find the nearest branch
      
      await ctx.reply(
        'Мы определили ваше местоположение и найдем ближайший филиал.',
        Markup.keyboard([
          ['⬅️ Назад']
        ]).resize()
      );
      
      logger.info(`Пользователь ${ctx.from.id} подтвердил локацию: ${latitude}, ${longitude}`);
      
      // Clear the pending location after confirmation
      ctx.session.pendingLocation = null;
    } catch (error) {
      logger.error(`Ошибка при подтверждении локации пользователя ${ctx.from.id}:`, error);
      await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
  });

  // Handle back button
  bot.hears('⬅️ Назад', async (ctx) => {
    try {
      ctx.session.pendingLocation = null;
      
      // Return to main menu
      const mainMenuKeyboard = Markup.keyboard([
        ['🛍 Заказать'],
        ['🚶 Самовывоз']
      ]).resize();

      await ctx.reply('Главное меню', mainMenuKeyboard);
    } catch (error) {
      logger.error(`Ошибка при возврате в главное меню для пользователя ${ctx.from.id}:`, error);
      await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
  });
}; 