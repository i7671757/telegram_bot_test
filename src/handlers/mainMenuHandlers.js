import logger from '../utils/logger.js';
import { setCommandsMenu } from '../utils/commands.js';
import { showMainMenu } from './cityHandlers.js';

// Обработчики главного меню
const mainMenuHandlers = (bot) => {
  // Обработка нажатия на кнопку "Сделать заказ"
  bot.hears(/🎁 .+berish|🎁 .+order|🎁 .+заказ/i, async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} выбрал "Сделать заказ"`);
      
      ctx.updateSession({
        lastAction: 'order_start',
        lastActionTime: new Date().toISOString()
      });
      
      await ctx.reply(ctx.i18n.t('order.start_message'), {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [
              { text: ctx.i18n.t('order.self_pickup') },
              { text: ctx.i18n.t('order.delivery') }
            ],
            [{ text: ctx.i18n.t('menu.back') }]
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при обработке кнопки "Сделать заказ" для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });
  
  // Обработка нажатия на кнопку "История заказов"
  bot.hears(/📋 .+tarixi|📋 .+history|📋 .+истор/i, async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} выбрал "История заказов"`);
      
      ctx.updateSession({
        lastAction: 'order_history',
        lastActionTime: new Date().toISOString()
      });
      
      await ctx.reply(ctx.i18n.t('order.history_empty'), {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: ctx.i18n.t('menu.back') }]
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при обработке кнопки "История заказов" для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });
  
  // Обработка нажатия на кнопку "Акции"
  bot.hears(/🔥 Aksiya|🔥 Promotions|🔥 Акции/i, async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} выбрал "Акции"`);
      
      ctx.updateSession({
        lastAction: 'aksiya',
        lastActionTime: new Date().toISOString()
      });
      
      await ctx.reply(ctx.i18n.t('aksiya.no_active'), {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: ctx.i18n.t('menu.back') }]
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при обработке кнопки "Акции" для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });
  
  // Обработка нажатия на кнопку "Присоединиться к нашей команде"
  bot.hears(/👤 .+qo['']shiling|👤 .+team|👤 .+команд/i, async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} выбрал "Присоединиться к нашей команде"`);
      
      ctx.updateSession({
        lastAction: 'join_team',
        lastActionTime: new Date().toISOString()
      });
      
      await ctx.reply(ctx.i18n.t('join_team.info'), {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: ctx.i18n.t('menu.back') }]
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при обработке кнопки "Присоединиться к команде" для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });
  
  // Обработка нажатия на кнопку "Связаться с Les Ailes"
  bot.hears(/🍗 .+aloqa|🍗 .+contact|🍗 .+связ/i, async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} выбрал "Связаться с Les Ailes"`);
      
      ctx.updateSession({
        lastAction: 'contact',
        lastActionTime: new Date().toISOString()
      });
      
      await ctx.reply(ctx.i18n.t('contact.info'), {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: ctx.i18n.t('menu.back') }]
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при обработке кнопки "Связаться" для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });

  // Обработка нажатия на кнопку самовывоза
  bot.hears(/.*самовывоз.*|.*self.?pickup.*|.*olib ketish.*/i, async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} выбрал "Самовывоз"`);
      
      ctx.updateSession({
        lastAction: 'self_pickup',
        lastActionTime: new Date().toISOString()
      });
      
      await ctx.reply(ctx.i18n.t('self_pickup.select_option'), {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: ctx.i18n.t('self_pickup.find_nearest') }, { text: ctx.i18n.t('self_pickup.order_here') }],
            [{ text: ctx.i18n.t('self_pickup.select_branch') },   { text: ctx.i18n.t('menu.back') } ],
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при обработке выбора самовывоза для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });

  // Обработка кнопки "Определить ближайший филиал"
  bot.hears(/📍.*ближайший.*|📍.*nearest.*|📍.*yaqin.*/i, async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} запросил определение ближайшего филиала`);
      
      ctx.updateSession({
        lastAction: 'find_nearest_branch',
        lastActionTime: new Date().toISOString()
      });

      await ctx.reply(ctx.i18n.t('self_pickup.location_request'), {
        reply_markup: {
          keyboard: [
            [{ text: ctx.i18n.t('menu.back'), request_location: true }],
            [{ text: ctx.i18n.t('menu.back') }]
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при запросе местоположения для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });

  // Обработка кнопки "Заказать тут"
  bot.hears(/🌐.*заказать тут.*|🌐.*order here.*|🌐.*buyurtma.*/i, async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} выбрал "Заказать тут"`);
      
      ctx.updateSession({
        lastAction: 'order_here',
        lastActionTime: new Date().toISOString()
      });

      // Отправляем сообщение со ссылкой на сайт
      await ctx.reply(ctx.i18n.t('self_pickup.order_website'), {
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Перейти', url: 'https://lesailes.uz/' }]
          ]
        }
      });

      // Показываем клавиатуру с кнопкой "Назад"
      await ctx.reply(ctx.i18n.t('navigation.back_option'), {
        reply_markup: {
          keyboard: [
            [{ text: ctx.i18n.t('menu.back') }]
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при обработке "Заказать тут" для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });

  // Обработка кнопки "Выбрать филиал"
  bot.hears(/выбрать филиал|select branch|filial tanlash/i, async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} выбрал "Выбрать филиал"`);
      
      ctx.updateSession({
        lastAction: 'select_branch',
        lastActionTime: new Date().toISOString()
      });

      await ctx.reply(ctx.i18n.t('select_city'), {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: ctx.i18n.t('city.tashkent') }],
            [{ text: ctx.i18n.t('city.samarkand') }],
            [{ text: ctx.i18n.t('city.bukhara') }],
            [{ text: ctx.i18n.t('menu.back') }]
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при выборе филиала для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });

  // Обработка выбора города для филиалов
  bot.hears(/Ташкент|Tashkent|Toshkent|Самарканд|Samarkand|Samarqand|Бухара|Bukhara|Buxoro/i, async (ctx) => {
    try {
      const cityText = ctx.message.text;
      let cityKey;
      
      if (/Ташкент|Tashkent|Toshkent/i.test(cityText)) {
        cityKey = 'tashkent';
      } else if (/Самарканд|Samarkand|Samarqand/i.test(cityText)) {
        cityKey = 'samarkand';
      } else if (/Бухара|Bukhara|Buxoro/i.test(cityText)) {
        cityKey = 'bukhara';
      }

      if (!cityKey) return;

      logger.info(`Пользователь ${ctx.from.id} выбрал город ${cityText}`);
      
      ctx.updateSession({
        selectedCity: cityKey,
        lastAction: 'city_selected',
        lastActionTime: new Date().toISOString()
      });

      // Получаем список филиалов для выбранного города
      const branchButtons = Object.values(ctx.i18n.t(`branches.${cityKey}.list`)).map(branch => [{ text: branch }]);
      
      // Добавляем кнопку "Назад"
      branchButtons.push([{ text: ctx.i18n.t('menu.back') }]);

      await ctx.reply(ctx.i18n.t(`branches.${cityKey}.title`), {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: branchButtons,
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при обработке выбора города для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });

  // Обработка выбора конкретного филиала
  bot.hears(/🏪.*/i, async (ctx) => {
    try {
      const branchName = ctx.message.text;
      logger.info(`Пользователь ${ctx.from.id} выбрал филиал ${branchName}`);
      
      ctx.updateSession({
        selectedBranch: branchName,
        lastAction: 'branch_selected',
        lastActionTime: new Date().toISOString()
      });

      // Отправляем подтверждение выбора филиала
      await ctx.reply(ctx.i18n.t('branch_selected', {
        city: ctx.i18n.t(`city.${ctx.session.selectedCity}`),
        branch: branchName
      }), {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: ctx.i18n.t('menu.back') }]
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при выборе филиала для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });
};

export default mainMenuHandlers; 