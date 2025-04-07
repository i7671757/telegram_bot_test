import logger from '../utils/logger.js';
import { setCommandsMenu } from '../utils/commands.js';
const {match} =require("telegraf-i18n") 

// Обработка выбора города
const cityHandlers = (bot) => {
  bot.hears(match("city.tashkent"), async (ctx) => {
    try {
      const city = 'tashkent';
      await handleCitySelection(ctx, city);
      logger.info(`Пользователь ${ctx.from.id} выбрал город Ташкент`);
    } catch (error) {
      logger.error(`Ошибка при выборе города Ташкент для пользователя ${ctx.from.id}`, error);
      // Let the error handler middleware handle the error
    }
  });
  
  bot.hears(match("city.samarkand"), async (ctx) => {
    try {
      const city = 'samarkand';
      await handleCitySelection(ctx, city);
      logger.info(`Пользователь ${ctx.from.id} выбрал город Самарканд`);
    } catch (error) {
      logger.error(`Ошибка при выборе города Самарканд для пользователя ${ctx.from.id}`, error);
      // Let the error handler middleware handle the error
    }
  });
  
  bot.hears(match("city.bukhara"), async (ctx) => {
    try {
      const city = 'bukhara';
      await handleCitySelection(ctx, city);
      logger.info(`Пользователь ${ctx.from.id} выбрал город Бухара`);
    } catch (error) {
      logger.error(`Ошибка при выборе города Бухара для пользователя ${ctx.from.id}`, error);
      // Let the error handler middleware handle the error
    }
  });
};

// Функция обработки выбора города
async function handleCitySelection(ctx, city) {
  try {
    if (!ctx.updateSession) {
      throw new Error('Session middleware not properly initialized');
    }

    ctx.updateSession({
      selectedCity: city,
      lastAction: 'city_selection',
      lastActionTime: new Date().toISOString()
    });
    
    // Обновляем меню команд
    await setCommandsMenu(ctx);
    
    // Показываем главное меню
    await showMainMenu(ctx);
  } catch (error) {
    logger.error(`Ошибка в handleCitySelection для города ${city}`, error);
    throw error;
  }
}

// Функция отображения главного меню (как на скриншоте)
async function showMainMenu(ctx) {
  try {
    logger.debug(`Отправка главного меню для пользователя ${ctx.from.id}`);
    
    if (!ctx.i18n) {
      throw new Error('i18n middleware not properly initialized');
    }
    
    // Сохраняем состояние в истории навигации
    ctx.updateSession({
      lastAction: 'main_menu',
      lastActionTime: new Date().toISOString(),
      previousAction: ctx.session.lastAction // Сохраняем предыдущее действие
    });
    
    await ctx.reply(`<b>${ctx.i18n.t('main_menu.title')}</b>`, {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [{ text: ctx.i18n.t('main_menu.order') }],
          [{ text: ctx.i18n.t('main_menu.order_history') }],
          [{ text: ctx.i18n.t('main_menu.select_branch') }],
          [{ text: ctx.i18n.t('settings.settings') }, { text: ctx.i18n.t('main_menu.aksiya') }],
          [{ text: ctx.i18n.t('main_menu.join_team') },{ text: ctx.i18n.t('main_menu.contact') }],
        
          // [{ text: ctx.i18n.t('menu.back') }]
        ],
        resize_keyboard: true
      }
    });
  } catch (error) {
    logger.error(`Ошибка при отображении главного меню для пользователя ${ctx.from.id}`, error);
    throw error;
  }
}

export { cityHandlers, showMainMenu }; 