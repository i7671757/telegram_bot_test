import logger from '../utils/logger.js';
import { setCommandsMenu } from '../utils/commands.js';
import { showMainMenu } from './cityHandlers.js';
const {match} =require("telegraf-i18n") 

// Обработчик настроек пользователя
const settingsHandler = (bot) => {
  // Обработка команды и кнопки Настройки
  bot.command('settings', handleSettings);
  bot.hears(match("settings.settings"), handleSettings);
  
  // Обработка выбора настройки языка
  bot.hears(match("settings.change_language"), async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} выбрал настройку языка`);
      
      ctx.updateSession({
        lastAction: 'settings_language',
        lastActionTime: new Date().toISOString()
      });
      
      await ctx.reply(ctx.i18n.t('language.select'), {
        reply_markup: {
          keyboard: [
            [
              { text: ctx.i18n.t('menuLanguage.ru') },
              { text: ctx.i18n.t('menuLanguage.uz') },
              { text: ctx.i18n.t('menuLanguage.en') }
            ],
            [{ text: ctx.i18n.t('menu.back') }]
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при выборе настройки языка для пользователя ${ctx.from.id}`, error);
      await ctx.reply(ctx.i18n.t('navigation.back_error'));
    }
  });
  
  // Обработка выбора настройки города
  bot.hears(match("settings.change_city"), async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} выбрал настройку города`);
      
      ctx.updateSession({
        lastAction: 'settings_city',
        lastActionTime: new Date().toISOString()
      });
      
      await ctx.reply(ctx.i18n.t('select_city'), {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [ { text: ctx.i18n.t('city.tashkent') }, { text: ctx.i18n.t('city.samarkand') }],
            [ { text: ctx.i18n.t('city.bukhara') }, { text: ctx.i18n.t('city.fergana') }],
            [ { text: ctx.i18n.t('city.andijan') }, { text: ctx.i18n.t('city.margilan') }],
            [ { text: ctx.i18n.t('city.qoqand') }, { text: ctx.i18n.t('city.urganch') }],
            [ { text: ctx.i18n.t('city.nukus') }, {text: ctx.i18n.t('city.chirchiq')}],
            [{ text: ctx.i18n.t('menu.back') }]
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при выборе настройки города для пользователя ${ctx.from.id}`, error);
      await ctx.reply(ctx.i18n.t('navigation.back_error'));
    }
  });
  
  // Обработка выбора настройки филиала
  bot.hears(match("settings.change_branch"), async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} выбрал настройку филиала`);
      
      // Проверяем, выбран ли город
      if (!ctx.session.selectedCity) {
        logger.warn(`Пользователь ${ctx.from.id} пытается изменить филиал без выбранного города`);
        await ctx.reply(ctx.i18n.t('settings.need_city_first'), {
          reply_markup: {
            keyboard: [
              [{ text: ctx.i18n.t('settings.change_city') }],
              [{ text: ctx.i18n.t('menu.back') }]
            ],
            resize_keyboard: true
          }
        });
        return;
      }
      
      const city = ctx.session.selectedCity;
      
      ctx.updateSession({
        lastAction: 'settings_branch',
        lastActionTime: new Date().toISOString()
      });
      
      // Получаем список филиалов для города
      const branches = {
        tashkent: ['Tashkent Branch 1', 'Tashkent Branch 2', 'Tashkent Branch 3'],
        samarkand: ['Samarkand Branch 1', 'Samarkand Branch 2'],
        bukhara: ['Bukhara Branch 1', 'Bukhara Branch 2']
      };
      
      const branchButtons = branches[city].map(branch => ({
        text: branch
      }));
      
      const branchRows = [];
      for (let i = 0; i < branchButtons.length; i += 2) {
        const row = [branchButtons[i]];
        if (i + 1 < branchButtons.length) {
          row.push(branchButtons[i + 1]);
        }
        branchRows.push(row);
      }
      
      // Добавляем кнопку "Назад"
      branchRows.push([{ text: ctx.i18n.t('menu.back') }]);
      
      await ctx.reply(ctx.i18n.t('select_branch'), {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: branchRows,
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при выборе настройки филиала для пользователя ${ctx.from.id}`, error);
      await ctx.reply(ctx.i18n.t('navigation.back_error'));
    }
  });
  
  // Обработка просмотра текущих настроек
  bot.hears(match("settings.my_settings"), async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} запросил свои текущие настройки`);
      
      if (!ctx.i18n || !ctx.i18n.t) {
        logger.warn('i18n middleware not properly initialized');
        return;
      }
      
      const settings = {
        languageCode: ctx.i18n.t(`language.current`),
        city: ctx.session.selectedCity ? ctx.i18n.t(`city.${ctx.session.selectedCity}`) : ctx.i18n.t('settings.not_selected'),
        branch: ctx.session.selectedBranch || ctx.i18n.t('settings.not_selected')
      };
      
      await ctx.reply(ctx.i18n.t('settings.current', { 
        languageCode: settings.languageCode,
        city: settings.city,
        branch: settings.branch
      }), {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: getSettingsKeyboard(ctx),
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при показе текущих настроек для пользователя ${ctx.from.id}`, error);
      await ctx.reply(ctx.i18n.t('navigation.back_error'));
    }
  });
};

// Функция обработки открытия настроек
async function handleSettings(ctx) {
  try {
    logger.info(`Пользователь ${ctx.from.id} открыл настройки`);
    
    // Обновляем сессию
    ctx.session.lastAction = 'open_settings';
    ctx.session.lastActionTime = new Date().toISOString();
    
    // Обновляем меню команд
    await setCommandsMenu(ctx);
    
    await ctx.reply(ctx.i18n.t('settings.title'), {
      reply_markup: {
        keyboard: getSettingsKeyboard(ctx),
        resize_keyboard: true
      }
    });
  } catch (error) {
    logger.error(`Ошибка при открытии настроек для пользователя ${ctx.from.id}`, error);
    await ctx.reply(ctx.i18n.t('navigation.back_error'));
  }
}

// Функция для получения клавиатуры настроек
function getSettingsKeyboard(ctx) {
  return [
    [
      { text: ctx.i18n.t('settings.change_language') },
      { text: ctx.i18n.t('settings.change_city') }
    ],
    [
      { text: ctx.i18n.t('settings.change_branch') },
      { text: ctx.i18n.t('settings.my_settings') }
    ],
    [
      // { text: ctx.i18n.t('menu.main') },
      { text: ctx.i18n.t('menu.back') }
    ]
  ];
}

export default settingsHandler; 