import { setCommandsMenu } from '../utils/commands.js';
import logger from '../utils/logger.js';
const {match} =require("telegraf-i18n") 
// Обработка выбора языка по тексту
const languageHandlers = (bot) => {
  bot.hears(match("menuLanguage.ru"), async (ctx) => {
    try {
      await handleLanguageSelection(ctx, 'ru');
      logger.info(`Пользователь ${ctx.from.id} выбрал русский язык`);
    } catch (error) {
      logger.error(`Ошибка при выборе русского языка для пользователя ${ctx.from.id}`, error);
      await ctx.reply('Произошла ошибка при выборе языка. Пожалуйста, попробуйте еще раз.');
    }
  });

  bot.hears(match("menuLanguage.uz"), async (ctx) => {
    try {
      await handleLanguageSelection(ctx, 'uz');
      logger.info(`Пользователь ${ctx.from.id} выбрал узбекский язык`);
    } catch (error) {
      logger.error(`Ошибка при выборе узбекского языка для пользователя ${ctx.from.id}`, error);
      await ctx.reply("Tilni tanlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    }
  });

  bot.hears(match("menuLanguage.en"), async (ctx) => {
    try {
      await handleLanguageSelection(ctx, 'en');
      logger.info(`Пользователь ${ctx.from.id} выбрал английский язык`);
    } catch (error) {
      logger.error(`Ошибка при выборе английского языка для пользователя ${ctx.from.id}`, error);
      await ctx.reply('An error occurred while selecting the language. Please try again.');
    }
  });
};

async function handleLanguageSelection(ctx, lang) {
  try {
    if (!ctx.i18n || !ctx.i18n.locale) {
      logger.warn('i18n middleware not properly initialized');
      await ctx.reply(ctx.i18n.t('error.i18n_not_initialized'));
      return;
    }

    // Устанавливаем язык в i18n
    ctx.i18n.locale(lang);
    
    // Обновляем сессию
    ctx.session = {
      ...ctx.session,
      languageCode: lang,
      languageSelected: true,
      lastAction: 'language_change',
      lastActionTime: new Date().toISOString()
    };
    
    console.log('Language set to:', lang);
    // console.log('Updated session:', ctx.session);
    
    // Обновляем меню команд
    await setCommandsMenu(ctx);
    
    // Создаем клавиатуру с городами
    const cityKeyboard = [
      [{ text: ctx.i18n.t('city.tashkent') }, { text: ctx.i18n.t('city.samarkand') }],
      [{ text: ctx.i18n.t('city.bukhara') }, { text: ctx.i18n.t('city.fergana') }],
      [{ text: ctx.i18n.t('city.andijan') }, { text: ctx.i18n.t('city.margilan') }],
      [{ text: ctx.i18n.t('city.qoqand') }, { text: ctx.i18n.t('city.urganch') }],
      [{ text: ctx.i18n.t('city.nukus') }, { text: ctx.i18n.t('city.chirchiq') }],
      [{ text: ctx.i18n.t('menu.back') }]
    ];
    
    // Отправляем сообщение с клавиатурой
    await ctx.reply(ctx.i18n.t('select_city'), {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: cityKeyboard,
        resize_keyboard: true,
        one_time_keyboard: false
      }
    });
    
    logger.debug(`Язык установлен на ${lang} для пользователя ${ctx.from.id}`);
  } catch (error) {
    logger.error(`Ошибка в handleLanguageSelection для языка ${lang}: ${error.message}`);
    await ctx.reply(ctx.i18n.t('error.language_selection'));
  }
}

export default languageHandlers; 