import logger from './logger.js';

/**
 * Получает список команд с описаниями для бота
 * @param {Object} i18n - Объект i18n для перевода (опционально)
 * @returns {Array} Массив объектов команд
 */
function getCommandsList(i18n) {
  try {
    // Безопасный вызов i18n.t с запасным вариантом
    const t = (key, defaultValue) => {
      try {
        return i18n && i18n.t ? i18n.t(key) : defaultValue;
      } catch (error) {
        return defaultValue;
      }
    };

    return [
      { command: 'start', description: t('commands.start', '🚀 Начать работу') },
      // { command: 'language', description: t('commands.language', '🌐 Изменить язык') },
      // { command: 'session', description: t('commands.session', '⚙️ Настройки сессии') },
      // { command: 'reset', description: t('commands.reset', '🔄 Сбросить настройки') },
      // { command: 'update_menu', description: t('commands.update_menu', '🔄 Обновить меню команд') },
      { command: 'settings', description: t('commands.settings', '🔧 Настройки') }
    ];
  } catch (error) {
    logger.error('Ошибка при получении списка команд', error);
    // Возвращаем базовый список команд в случае ошибки
    return [
      { command: 'start', description: '🚀 Начать работу' },
      {command: 'settings', description: '🔧 Настройки'},       
        // { command: 'language', description: '🌐 Изменить язык' },
        // { command: 'session', description: '⚙️ Настройки сессии' },
        // { command: 'reset', description: '🔄 Сбросить настройки' },
        // { command: 'update_menu', description: '🔄 Обновить меню команд' }
    ];
  }
}

/**
 * Функция для установки команд меню бота
 * @param {Object} ctx - Контекст Telegraf
 * @returns {Promise<void>}
 */
async function setCommandsMenu(ctx) {
  try {
    if (!ctx || !ctx.telegram) {
      throw new Error('Отсутствует контекст Telegraf или клиент telegram');
    }

    if (!ctx.i18n || !ctx.i18n.t) {
      logger.warn('Отсутствует i18n в контексте, используются значения по умолчанию для команд');
    }

    const commands = getCommandsList(ctx.i18n);

    // Если у пользователя есть ID, то устанавливаем команды только для него
    if (ctx.from && ctx.from.id) {
      await ctx.telegram.setMyCommands(commands, { scope: { type: 'chat', chat_id: ctx.from.id } });
      logger.debug(`Установлены команды меню для пользователя ${ctx.from.id}`);
    } else {
      // Иначе устанавливаем глобальные команды
      await ctx.telegram.setMyCommands(commands);
      logger.debug('Установлены глобальные команды меню');
    }
  } catch (error) {
    logger.error('Ошибка при установке команд меню', error);
    throw error;
  }
}

export { setCommandsMenu, getCommandsList }; 