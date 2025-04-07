import logger from '../utils/logger.js';
import { setCommandsMenu } from '../utils/commands.js';
import { showMainMenu } from './cityHandlers.js';
const {match} =require("telegraf-i18n") 

// Обработчик для кнопки "Назад"
const backHandler = (bot) => {
  bot.hears(match("menu.back"), async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} нажал кнопку "Назад"`);
      
      // Проверяем наличие необходимых методов
      if (!ctx.getPreviousState) {
        logger.error(`Метод getPreviousState не найден для пользователя ${ctx.from.id}`);
        return;
      }
      
      if (!ctx.updateSession) {
        logger.error(`Метод updateSession не найден для пользователя ${ctx.from.id}`);
        return;
      }
      
      const previousState = ctx.getPreviousState();
      
      if (!previousState) {
        logger.warn(`Пользователь ${ctx.from.id} попытался вернуться назад, но история навигации пуста`);
        await ctx.reply(ctx.i18n.t('navigation.history_empty'), {
          reply_markup: {
            keyboard: [[
              { text: ctx.i18n.t('menu.main') }
            ]],
            resize_keyboard: true
          }
        });
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
          // Возвращаемся к предыдущему состоянию из истории
          if (previousState.data && previousState.data.previousAction) {
            switch (previousState.data.previousAction) {
              case 'city_selection':
                await handleBackToCitySelection(ctx, previousState.data);
                break;
              case 'branch_selection':
                await handleBackToBranchSelection(ctx, previousState.data);
                break;
              default:
                await handleBackToMainMenu(ctx);
            }
          } else {
            await handleBackToMainMenu(ctx);
          }
          break;
          
        case 'order_start':
          await handleBackToMainMenu(ctx);
          break;
          
        case 'order_history':
          await handleBackToMainMenu(ctx);
          break;
          
        case 'aksiya':
          await handleBackToMainMenu(ctx);
          break;
          
        case 'join_team':
          await handleBackToMainMenu(ctx);
          break;
          
        case 'contact':
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
          { text: ctx.i18n.t('city.tashkent') },
          { text: ctx.i18n.t('city.samarkand') },
          { text: ctx.i18n.t('city.bukhara') }
        ]],
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