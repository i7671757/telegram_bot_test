import logger from '../utils/logger.js';
import { setCommandsMenu } from '../utils/commands.js';
import { showMainMenu } from './cityHandlers.js';
const {match} =require("telegraf-i18n") 

// Обработчик для кнопки "Назад"
const backHandler = (bot) => {
  bot.hears(match("menu.back"), async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} нажал кнопку "Назад"`);
      
      // Проверяем lastAction для определения текущего состояния
      const lastAction = ctx.session?.lastAction || null;
      
      // Специальная обработка для возврата из меню филиалов
      if (lastAction === 'branches_list_shown') {
        // Если предыдущее действие было выбор филиалов из самовывоза, возвращаемся в меню самовывоза
        if (ctx.session?.previousAction === 'select_branch_pickup') {
          logger.info(`Возврат в меню самовывоза для пользователя ${ctx.from.id}`);
          
          ctx.updateSession({
            lastAction: 'self_pickup',
            lastActionTime: new Date().toISOString()
          });
          
          await ctx.reply(ctx.i18n.t('self_pickup.select_option'), {
            parse_mode: 'HTML',
            reply_markup: {
              keyboard: [
                [{ text: ctx.i18n.t('self_pickup.send_location'), request_location: true }, { text: ctx.i18n.t('self_pickup.order_here') }],
                [{ text: ctx.i18n.t('self_pickup.select_branch') }, { text: ctx.i18n.t('menu.back') }]
              ],
              resize_keyboard: true
            }
          });
          
          return;
        } else {
          // Если это был просто просмотр филиалов из главного меню, возвращаемся в главное меню
          await handleBackToMainMenu(ctx);
          return;
        }
      }
      
      // Проверяем наличие необходимых методов
      if (!ctx.getPreviousState) {
        logger.error(`Метод getPreviousState не найден для пользователя ${ctx.from.id}`);
        return;
      }
      
      if (!ctx.updateSession) {
        logger.error(`Метод updateSession не найден для пользователя ${ctx.from.id}`);
        return;
      }
      
      const previousState = await ctx.getPreviousState();
      
      if (!previousState) {
        logger.warn(`Пользователь ${ctx.from.id} попытался вернуться назад, но история навигации пуста`);
        await handleBackToMainMenu(ctx);
        return;
      }
      
      logger.debug(`Предыдущее состояние для пользователя ${ctx.from.id}: ${JSON.stringify(previousState)}`);
      
      // Восстанавливаем предыдущее состояние на основе действия
      switch (previousState.action) {
        case 'language_change':
          await handleBackToLanguageSelection(ctx);
          break;
          
        case 'city_selection':
          await handleBackToCitySelection(ctx, previousState.data);
          break;
          
        case 'branch_selection':
          await handleBackToBranchSelection(ctx, previousState.data);
          break;
          
        case 'main_menu':
        case 'back_to_main':
        case 'open_settings':
        case 'settings_language':
        case 'settings_city':
        case 'settings_branch':
          await handleBackToMainMenu(ctx);
          break;
          
        default:
          // Если неизвестное состояние, возвращаемся в главное меню
          await handleBackToMainMenu(ctx);
      }
      
      // Отправляем сообщение об успешном возврате
      await ctx.reply(ctx.i18n.t('navigation.back_success'));
      
    } catch (error) {
      logger.error(`Ошибка при обработке кнопки "Назад" для пользователя ${ctx.from.id}`, error);
      // В случае ошибки показываем сообщение об ошибке
      await ctx.reply(ctx.i18n.t('navigation.back_error'));
    }
  });
};

// Обработчик возврата к выбору языка
async function handleBackToLanguageSelection(ctx) {
  try {
    ctx.updateSession({
      lastAction: 'back_to_language',
      lastActionTime: new Date().toISOString()
    });
    
    await ctx.reply(ctx.i18n.t('language.select'), {
      reply_markup: {
        keyboard: [[
          { text: ctx.i18n.t('menuLanguage.ru') },
          { text: ctx.i18n.t('menuLanguage.uz') },
          { text: ctx.i18n.t('menuLanguage.en') }
        ]],
        resize_keyboard: true
      }
    });
  } catch (error) {
    logger.error(`Ошибка при возврате к выбору языка для пользователя ${ctx.from.id}`, error);
    throw error;
  }
}

// Обработчик возврата к выбору города
async function handleBackToCitySelection(ctx, data) {
  try {
    // Если есть сохраненный язык, восстанавливаем его
    if (data && data.language) {
      ctx.i18n.locale(data.language);
    }
    
    ctx.updateSession({
      lastAction: 'back_to_city',
      lastActionTime: new Date().toISOString()
    });
    
    // Обновляем меню команд с учетом текущего языка
    await setCommandsMenu(ctx);
    
    await ctx.reply(ctx.i18n.t('select_city'), {
      reply_markup: {
        keyboard: [[
          { text: ctx.i18n.t('city.tashkent') }, { text: ctx.i18n.t('city.samarkand') }],
          [ { text: ctx.i18n.t('city.bukhara') }, { text: ctx.i18n.t('city.fergana') }],
          [ { text: ctx.i18n.t('city.andijan') }, { text: ctx.i18n.t('city.margilan') }],
          [ { text: ctx.i18n.t('city.qoqand') }, { text: ctx.i18n.t('city.urganch') }],
          [ { text: ctx.i18n.t('city.nukus') }, { text: ctx.i18n.t('city.chirchiq') }],
        ],
        resize_keyboard: true
      }
    });
  } catch (error) {
    logger.error(`Ошибка при возврате к выбору города для пользователя ${ctx.from.id}`, error);
    throw error;
  }
}

// Обработчик возврата к выбору филиала
async function handleBackToBranchSelection(ctx, data) {
  try {
    // Если есть сохраненный город, восстанавливаем его
    if (!data || !data.selectedCity) {
      logger.warn(`Отсутствует информация о выбранном городе для пользователя ${ctx.from.id}`);
      await handleBackToCitySelection(ctx, data);
      return;
    }
    
    const city = data.selectedCity;
    
    ctx.updateSession({
      selectedCity: city,
      lastAction: 'back_to_branch',
      lastActionTime: new Date().toISOString()
    });
    
    // Обновляем меню команд
    await setCommandsMenu(ctx);
    
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
    logger.error(`Ошибка при возврате к выбору филиала для пользователя ${ctx.from.id}`, error);
    throw error;
  }
}

// Обработчик возврата в главное меню
async function handleBackToMainMenu(ctx) {
  try {
    ctx.updateSession({
      lastAction: 'back_to_main',
      lastActionTime: new Date().toISOString()
    });
    
    // Показываем главное меню
    await showMainMenu(ctx);
  } catch (error) {
    logger.error(`Ошибка при возврате в главное меню для пользователя ${ctx.from.id}`, error);
    throw error;
  }
}

export default backHandler; 