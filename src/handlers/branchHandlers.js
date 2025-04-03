import logger from '../utils/logger.js';
import { setCommandsMenu } from '../utils/commands.js';
import { showMainMenu } from './cityHandlers.js';

// Обработка выбора филиала
const branchHandlers = (bot) => {
  bot.hears(/^(Tashkent|Samarkand|Bukhara) Branch \d+$/i, async (ctx) => {
    try {
      const branchName = ctx.message.text;
      
      if (!ctx.i18n || !ctx.i18n.t) {
        logger.warn('i18n middleware not properly initialized');
        return;
      }
      
      let city;
      if (branchName.includes('Tashkent')) {
        city = 'tashkent';
      } else if (branchName.includes('Samarkand')) {
        city = 'samarkand';
      } else if (branchName.includes('Bukhara')) {
        city = 'bukhara';
      }
      
      ctx.updateSession({
        selectedBranch: branchName,
        lastAction: 'branch_selection',
        lastActionTime: new Date().toISOString()
      });
    
      logger.info(`Пользователь ${ctx.from.id} выбрал филиал ${branchName} в городе ${city}`);
      logger.debug(`Сессия пользователя ${ctx.from.id}: ${JSON.stringify(ctx.session)}`);
      
      // Обновляем меню команд
      await setCommandsMenu(ctx);
      
      // Отображаем сообщение об успешном выборе филиала
      await ctx.reply(`<b>${ctx.i18n.t('branch_selected', { city, branch: branchName })}</b>`, {
        parse_mode: 'HTML'
      });
      
      // Показываем главное меню
      await showMainMenu(ctx);
      
    } catch (error) {
      logger.error(`Ошибка при выборе филиала для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });

  // Обработка возврата в главное меню
  bot.hears(/Главное меню|Main menu/i, async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} вернулся в главное меню`);
      
      if (!ctx.i18n || !ctx.i18n.t) {
        logger.warn('i18n middleware not properly initialized');
        return;
      }
      
      // Обновляем меню команд с учетом текущего языка
      await setCommandsMenu(ctx);
      
      // Показываем главное меню
      await showMainMenu(ctx);
      
    } catch (error) {
      logger.error(`Ошибка при возврате в главное меню для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });
};

export default branchHandlers; 