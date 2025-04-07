import logger from '../utils/logger.js';
import { setCommandsMenu } from '../utils/commands.js';
import { showMainMenu } from './cityHandlers.js';
import axios from 'axios';
import { handleBranchSelection, handleBranchCallback, handleProceedToOrder } from '../commands/branches.js';
const {match} =require("telegraf-i18n") 

// Обработчики главного меню
const mainMenuHandlers = (bot) => {
  // Обработка нажатия на кнопку "Сделать заказ"
  bot.hears(match("main_menu.order"), async (ctx) => {
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
  bot.hears(match("main_menu.order_history"), async (ctx) => {
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
  bot.hears(match("main_menu.aksiya"), async (ctx) => {
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
  bot.hears(match("main_menu.join_team"), async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} выбрал "Присоединиться к нашей команде"`);
      
      ctx.updateSession({
        lastAction: 'join_team',
        lastActionTime: new Date().toISOString()
      });
      
      // Отправляем информацию с inline кнопкой для перехода к боту
      await ctx.reply(ctx.i18n.t('join_team.info'), {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Перейти', url: 'http://t.me/HavoqandJamoa_Bot' }]
          ]
        }
      });

      // Показываем основное меню
      await ctx.reply(ctx.i18n.t('main_menu.title'), {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: ctx.i18n.t('main_menu.order') } ],
            [{ text: ctx.i18n.t('main_menu.order_history') }],
            [{ text: ctx.i18n.t('settings.settings') },{ text: ctx.i18n.t('main_menu.aksiya') }],
            [{ text: ctx.i18n.t('main_menu.join_team') }, { text: ctx.i18n.t('main_menu.contact') }]
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
  bot.hears(match("main_menu.contact"), async (ctx) => {
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
            [{ text: ctx.i18n.t('contact.write_review') }, { text: ctx.i18n.t('contact.write_complaint') }],
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
  bot.hears(match("order.self_pickup"), async (ctx) => {
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
            [{ text: ctx.i18n.t('self_pickup.send_location'), request_location: true }, { text: ctx.i18n.t('self_pickup.order_here') }],
            [{ text: ctx.i18n.t('self_pickup.select_branch') }, { text: ctx.i18n.t('menu.back') }]
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при обработке выбора самовывоза для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });

  // Обработка кнопки "Выбрать филиал" в меню самовывоза
  bot.hears(match("self_pickup.select_branch"), async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} выбрал "Выбрать филиал" в меню самовывоза`);
      
      ctx.updateSession({
        lastAction: 'select_branch_pickup',
        lastActionTime: new Date().toISOString()
      });

      // Используем функцию из branches.js для отображения списка филиалов
      await handleBranchSelection(ctx);
    } catch (error) {
      logger.error(`Ошибка при выборе филиала для самовывоза для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });
  
  // Обработка выбора конкретного филиала (callback)
  bot.action(/select_branch_\d+/, handleBranchCallback);
  
  // Обработка кнопки "Подтвердить заказ" после выбора филиала
  bot.action('proceed_to_order', handleProceedToOrder);
  
  // Обработка кнопки "Выбрать филиал" в главном меню
  bot.hears(match("main_menu.select_branch"), async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} выбрал "Выбрать филиал" в главном меню`);
      
      ctx.updateSession({
        lastAction: 'select_branch',
        lastActionTime: new Date().toISOString()
      });

      // Используем функцию из branches.js для отображения списка филиалов
      await handleBranchSelection(ctx);
    } catch (error) {
      logger.error(`Ошибка при выборе филиала из главного меню для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });

  // Обработка кнопки "Определить ближайший филиал"
  bot.hears(match("main_menu.find_nearest_branch"), async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} запросил определение ближайшего филиала`);
      
      ctx.updateSession({
        lastAction: 'find_nearest_branch',
        lastActionTime: new Date().toISOString()
      });

      // Отправляем сообщение с кнопкой для отправки локации
      await ctx.reply(ctx.i18n.t('self_pickup.location_request'), {
        reply_markup: {
          keyboard: [
            [{ text: '📍 Отправить мою локацию', request_location: true }],
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

  // Обработка получения локации от пользователя
  bot.on('location', async (ctx) => {
    try {
      const location = ctx.message.location;
      logger.info(`Пользователь ${ctx.from.id} отправил локацию: ${JSON.stringify(location)}`);
      
      // Получаем адрес через OpenStreetMap Nominatim API
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.append('format', 'json');
      url.searchParams.append('lat', location.latitude);
      url.searchParams.append('lon', location.longitude);
      url.searchParams.append('zoom', '18');
      url.searchParams.append('addressdetails', '1');
      
      logger.info(`Отправка запроса к Nominatim API: ${url.toString()}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Nominatim API вернул ошибку: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      logger.info(`Ответ от Nominatim API: ${JSON.stringify(data)}`);
      
      let address = 'Не удалось определить адрес';
      if (data && data.display_name) {
        address = data.display_name;
      }
      
      await ctx.reply(`Ваш адрес: ${address}\n\nМы определили ваше местоположение и найдем ближайший филиал.`, {
        reply_markup: {
          keyboard: [
            [{ text: ctx.i18n.t('self_pickup.back') }, {text: ctx.i18n.t('self_pickup.confirm')}],
            [{ text: ctx.i18n.t('self_pickup.send_location'), request_location: true }]
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при обработке локации от пользователя ${ctx.from.id}: ${error.message}`, error);
      await ctx.reply('Извините, произошла ошибка при определении адреса. Пожалуйста, попробуйте еще раз или выберите другой способ.', {
        reply_markup: {
          keyboard: [
            [{ text: ctx.i18n.t('self_pickup.send_location'), request_location: true }, { text: ctx.i18n.t('self_pickup.order_here') }],
            [{ text: ctx.i18n.t('self_pickup.select_branch') }, { text: ctx.i18n.t('menu.back') }]
          ],
          resize_keyboard: true
        }
      });
    }
  });

  // Обработка кнопки "Подтвердить"
  bot.hears(match('self_pickup.confirm'), async (ctx) => {
    try {
      logger.info(`Пользователь ${ctx.from.id} нажал кнопку "Подтвердить"`);
      
      ctx.updateSession({
        lastAction: 'show_menu_categories',
        lastActionTime: new Date().toISOString()
      });

      await ctx.reply(ctx.i18n.t('menu_categories.title'), {
        parse_mode: 'HTML',
        reply_markup: {
          keyboard: [
            [{ text: ctx.i18n.t('menu_categories.sets') }],
            [{ text: ctx.i18n.t('menu_categories.snacks') }],
            [{ text: ctx.i18n.t('menu_categories.burgers') }],
            [{ text: ctx.i18n.t('menu_categories.chicken') }],
            [
              { text: ctx.i18n.t('menu_categories.back') },
              { text: ctx.i18n.t('menu_categories.basket') }
            ]
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error(`Ошибка при отображении категорий меню для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });

  // Обработка кнопки "Заказать тут"
  bot.hears(match("self_pickup.order_here"), async (ctx) => {
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
            [{ text: ctx.i18n.t('self_pickup.goTo'), url: 'https://lesailes.uz/' }]
          ]
        }
      });
    } catch (error) {
      logger.error(`Ошибка при обработке "Заказать тут" для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });

  // Обработка кнопки "Назад" в списке филиалов
  bot.action('back_to_menu', async (ctx) => {
    try {
      await ctx.deleteMessage();
      await showMainMenu(ctx);
    } catch (error) {
      logger.error(`Ошибка при возврате в главное меню: ${error.message}`);
    }
  });
  
  // Обработка кнопки "Назад к филиалам"
  bot.action('show_branches', async (ctx) => {
    try {
      await handleBranchSelection(ctx);
    } catch (error) {
      logger.error(`Ошибка при возврате к списку филиалов: ${error.message}`);
    }
  });
};

export default mainMenuHandlers;