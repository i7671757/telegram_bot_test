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
    
    ctx.updateSession({
      language: lang,
      languageSelected: true,
      lastAction: 'language_change',
      lastActionTime: new Date().toISOString()
    });
    
    ctx.i18n.locale(lang);
    await setCommandsMenu(ctx);
    
    const userName = ctx.from?.first_name || '';
    logger.debug(`Отправка меню выбора города для пользователя ${ctx.from.id}`);
    
    await ctx.reply(`<b>${ctx.i18n.t('select_city', { name: userName })}</b>`, {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [
            { text: ctx.i18n.t('city.tashkent') },
            { text: ctx.i18n.t('city.samarkand') },
            { text: ctx.i18n.t('city.bukhara') }
          ],
          [{ text: ctx.i18n.t('menu.back') }]
        ],
        resize_keyboard: true
      }
    });
  } catch (error) {
    logger.error(`Ошибка в handleLanguageSelection для языка ${lang}: ${error.message}`);
    await ctx.reply(ctx.i18n.t('error.language_selection'));
  }
}

export default languageHandlers; 