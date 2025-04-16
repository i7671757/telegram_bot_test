import { setCommandsMenu } from '../utils/commands.js';
import logger from '../utils/logger.js';

// Обработчики команд
const commandHandlers = (bot) => {
  // Команда /start - начало работы
  bot.start(async (ctx) => {
    try {
      // Инициализируем сессию, если её нет
      if (!ctx.session) {
        ctx.session = {
          languageCode: 'en',
          navigationHistory: [],
          startTime: new Date().toISOString(),
          visits: 1
        };
      } else {
        ctx.session.visits = (ctx.session.visits || 0) + 1;
      }
      
      // Устанавливаем язык по умолчанию
      ctx.i18n.locale(ctx.session.languageCode || 'en');
      
      // Обновляем меню команд
      await setCommandsMenu(ctx);
      
      logger.info(`Пользователь ${ctx.from.id} запустил бота (visits: ${ctx.session.visits})`);
      
      // Отправляем приветственное сообщение с выбором языка
      await ctx.reply('<b>Assalomu alaykum! Les Ailes yetkazib berish xizmatiga xush kelibsiz.\n\nЗдравствуйте! Добро пожаловать в службу доставки Les Ailes.\n\nHello! Welcome to Les Ailes delivery service.</b>',
        {
          parse_mode: 'HTML',
          reply_markup: {
            keyboard: [
              [
                { text: ctx.i18n.t('menuLanguage.ru') }, 
                { text: ctx.i18n.t('menuLanguage.uz') }, 
                { text: ctx.i18n.t('menuLanguage.en') }
              ]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
          }
        });
    } catch (error) {
      logger.error(`Ошибка при обработке команды /start для пользователя ${ctx.from.id}`, error);
      await ctx.reply('Произошла ошибка при запуске бота. Пожалуйста, попробуйте позже.');
    }
  });

  // Команда для просмотра данных сессии
  bot.command('session', async (ctx) => {
    try {
      const sessionInfo = JSON.stringify(ctx.session, null, 2);
      logger.info(`Пользователь ${ctx.from.id} запросил информацию о сессии`);
      
      await ctx.reply(`<b>Ваши данные сессии:</b>\n<pre>${sessionInfo}</pre>`, {
        parse_mode: 'HTML'
      });
    } catch (error) {
      logger.error(`Ошибка при выполнении команды /session для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });

  // Команда для сброса сессии
  bot.command('reset', async (ctx) => {
    try {
      const oldVisits = ctx.session.visits || 0;
      
      ctx.session = {
        ...ctx.session,
        languageCode: 'en',
        visits: oldVisits,
        reset: true,
        resetTime: new Date().toISOString()
      };
      
      logger.info(`Пользователь ${ctx.from.id} сбросил настройки сессии`);
      
      await ctx.reply(ctx.i18n.t('session.reset'));
    } catch (error) {
      logger.error(`Ошибка при выполнении команды /reset для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });
};

export default commandHandlers; 