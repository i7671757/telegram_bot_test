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

  bot.hears(match("city.fergana"), async (ctx) => {
    try {
      const city = 'fergana';
      await handleCitySelection(ctx, city);
      logger.info(`Пользователь ${ctx.from.id} выбрал город Фергана`);
    } catch (error) {
      logger.error(`Ошибка при выборе города Фергана для пользователя ${ctx.from.id}`, error);
      // Let the error handler middleware handle the error
    }
  });

  bot.hears(match("city.andijan"), async (ctx) => {
    try {
      const city = 'andijan';
      await handleCitySelection(ctx, city);
      logger.info(`Пользователь ${ctx.from.id} выбрал город Андижан`);
    } catch (error) {
      logger.error(`Ошибка при выборе города Андижан для пользователя ${ctx.from.id}`, error);
      // Let the error handler middleware handle the error
    }
  });

  bot.hears(match("city.margilan"), async (ctx) => {
    try {
      const city = 'margilan';
      await handleCitySelection(ctx, city);
      logger.info(`Пользователь ${ctx.from.id} выбрал город Маргилан`);
    } catch (error) {
      logger.error(`Ошибка при выборе города Маргилан для пользователя ${ctx.from.id}`, error);
      // Let the error handler middleware handle the error
    }
  });

  bot.hears(match("city.chirchiq"), async (ctx) => {
    try {
      const city = 'chirchiq';
      await handleCitySelection(ctx, city);
      logger.info(`Пользователь ${ctx.from.id} выбрал город Чирчик`);
    } catch (error) {
      logger.error(`Ошибка при выборе города Чирчик для пользователя ${ctx.from.id}`, error);
      // Let the error handler middleware handle the error
    }
  });

  bot.hears(match("city.qoqand"), async (ctx) => {  
    try {
      const city = 'qoqand';
      await handleCitySelection(ctx, city);
      logger.info(`Пользователь ${ctx.from.id} выбрал город Коканд`);
    } catch (error) {
      logger.error(`Ошибка при выборе города Коканд для пользователя ${ctx.from.id}`, error);   
      // Let the error handler middleware handle the error
    }
  });

  bot.hears(match("city.urganch"), async (ctx) => {
    try {
      const city = 'urganch';
      await handleCitySelection(ctx, city);
      logger.info(`Пользователь ${ctx.from.id} выбрал город Ургенч`);
    } catch (error) {
      logger.error(`Ошибка при выборе города Ургенч для пользователя ${ctx.from.id}`, error);
      // Let the error handler middleware handle the error
    }
  });

  bot.hears(match("city.nukus"), async (ctx) => {
    try {
      const city = 'nukus';
      await handleCitySelection(ctx, city);
      logger.info(`Пользователь ${ctx.from.id} выбрал город Нукус`);
    } catch (error) {
      logger.error(`Ошибка при выборе города Нукус для пользователя ${ctx.from.id}`, error);
      // Let the error handler middleware handle the error
    }
  });
  
  
};

// Функция обработки выбора города
async function handleCitySelection(ctx, city) {
  try {
    // Определяем ID города
    let cityId;
    switch(city) {
      case 'tashkent':
        cityId = 2;
        break;
      case 'fergana':
        cityId = 5;
        break;
      case 'bukhara':
        cityId = 6;
        break;
      case 'andijan':
        cityId = 1;
        break;
      case 'samarkand':
        cityId = 3;
        break;
      case 'chirchiq':
        cityId = 22;
        break;
      case 'margilan':
        cityId = 18;
        break;
      case 'qoqand':
        cityId = 23;
        break;
      case 'urganch':
        cityId = 21;
        break;
      case 'nukus':
        cityId = 19;
        break;
      default:
        cityId = null;
    }

    ctx.session = {
      ...ctx.session,
      selectedCity: city,
      currentCity: cityId,
      lastAction: 'city_selection',
      lastActionTime: new Date().toISOString()
    };
    
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
    ctx.session = {
      ...ctx.session,
      lastAction: 'main_menu',
      lastActionTime: new Date().toISOString(),
      previousAction: ctx.session.lastAction // Сохраняем предыдущее действие
    };
    
    await ctx.reply(`<b>${ctx.i18n.t('main_menu.title')}</b>`, {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [{ text: ctx.i18n.t('main_menu.order') }],
          [{ text: ctx.i18n.t('main_menu.order_history') }],
          [{ text: ctx.i18n.t('settings.settings') }, { text: ctx.i18n.t('main_menu.aksiya') }],
          [{ text: ctx.i18n.t('main_menu.join_team') }, { text: ctx.i18n.t('main_menu.contact') }],
        
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