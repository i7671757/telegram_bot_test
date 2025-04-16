import { Telegraf } from 'telegraf';
import path from 'path';
import { startServer } from './server.js';

// Импорт конфигурации и middleware
import i18n from './config/i18n.js';
import sessionMiddleware from './middleware/session.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import { setCommandsMenu } from './utils/commands.js';

// Импорт обработчиков
import commandHandlers from './handlers/commandHandlers.js';
import languageHandlers from './handlers/languageHandlers.js';
import { cityHandlers } from './handlers/cityHandlers.js';
import branchHandlers from './handlers/branchHandlers.js';
import backHandler from './handlers/backHandler.js';
import settingsHandler from './handlers/settingsHandler.js';
import mainMenuHandlers from './handlers/mainMenuHandlers.js';
import { locationHandlers } from './handlers/locationHandlers.js';

const LocalSession = require('telegraf-session-local');

// Проверка наличия токена
if (!process.env.TELEGRAM_TOKEN) {
  logger.error('TELEGRAM_TOKEN не найден в переменных окружения. Убедитесь, что файл .env существует и содержит правильный токен.');
  process.exit(1);
}

// Проверка формата токена (примерная валидация)
if (process.env.TELEGRAM_TOKEN === 'your_telegram_token_here' || 
    !process.env.TELEGRAM_TOKEN.includes(':')) {
  logger.error('Указан некорректный TELEGRAM_TOKEN. Получите настоящий токен у @BotFather и обновите файл .env');
  logger.info('Инструкция: напишите @BotFather в Telegram, создайте бота командой /newbot и получите токен');
  process.exit(1);
}

// Инициализация бота
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Подключаем middleware
bot.use(i18n.middleware());
bot.use(new LocalSession({ database: 'session.json' }).middleware());
bot.use(sessionMiddleware);
bot.use(errorHandler);

// Добавляем обработчик для ошибок в запуске бота
bot.catch((err, ctx) => {
  logger.error(`Ошибка при обработке обновления Telegraf: ${ctx.updateType}`, err);
});

// Регистрируем обработчики
commandHandlers(bot);
languageHandlers(bot);
cityHandlers(bot);
branchHandlers(bot);
backHandler(bot);
settingsHandler(bot);
mainMenuHandlers(bot);
locationHandlers(bot);

// Добавляем специальную команду для обновления меню команд
bot.command('update_menu', async (ctx) => {
  try {
    logger.info(`Пользователь ${ctx.from.id} запросил обновление меню команд`);
    await setCommandsMenu(ctx);
    await ctx.reply('Меню команд успешно обновлено!');
    logger.success(`Меню команд обновлено для пользователя ${ctx.from.id}`);
  } catch (error) {
    logger.error(`Ошибка при обновлении меню команд для пользователя ${ctx.from.id}`, error);
    await ctx.reply('Произошла ошибка при обновлении меню команд.');
  }
});

// Запуск бота и сервера
Promise.all([
  bot.launch(),
  startServer()
])
  .then(async () => {
    logger.success('Бот и сервер запущены!');
    logger.info(`Режим отладки: ${process.env.DEBUG === 'true' ? 'включен' : 'выключен'}`);
    
    try {
      // Устанавливаем глобальные команды для бота при запуске
      const fakeCtx = { 
        telegram: bot.telegram
      };
      
      await setCommandsMenu(fakeCtx);
      logger.info('Глобальные команды меню установлены');
    } catch (error) {
      logger.error('Ошибка при установке глобальных команд меню', error);
    }
  })
  .catch(err => {
    logger.error('Ошибка запуска:', err);
    process.exit(1);
  });

// Обработчик необработанных исключений
process.on('uncaughtException', (err) => {
  logger.error('Необработанное исключение:', err);
});

// Обработчик необработанных отклонений промисов
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Необработанное отклонение промиса:', reason);
});

// Корректное завершение работы
process.once('SIGINT', () => {
  logger.info('Получен сигнал SIGINT, закрытие бота...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  logger.info('Получен сигнал SIGTERM, закрытие бота...');
  bot.stop('SIGTERM');
});