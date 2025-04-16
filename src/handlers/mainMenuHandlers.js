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
      
      ctx.session = {
        ...ctx.session,
        lastAction: 'order_start',
        lastActionTime: new Date().toISOString()
      };
      
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
      
      ctx.session = {
        ...ctx.session,
        lastAction: 'order_history',
        lastActionTime: new Date().toISOString()
      };
      
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
      
      ctx.session = {
        ...ctx.session,
        lastAction: 'aksiya',
        lastActionTime: new Date().toISOString()
      };
      
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
      
      ctx.session = {
        ...ctx.session,
        lastAction: 'join_team',
        lastActionTime: new Date().toISOString()
      };
      
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
      
      ctx.session = {
        ...ctx.session,
        lastAction: 'contact',
        lastActionTime: new Date().toISOString()
      };
      
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
      
      ctx.session = {
        ...ctx.session,
        lastAction: 'self_pickup',
        lastActionTime: new Date().toISOString()
      };
      
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
      
      ctx.session = {
        ...ctx.session,
        lastAction: 'select_branch_pickup',
        lastActionTime: new Date().toISOString()
      };

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
      
      ctx.session = {
        ...ctx.session,
        lastAction: 'select_branch',
        lastActionTime: new Date().toISOString()
      };

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
      
      ctx.session = {
        ...ctx.session,
        lastAction: 'find_nearest_branch',
        lastActionTime: new Date().toISOString()
      };

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
      
      ctx.session = {
        ...ctx.session,
        lastAction: 'show_menu_categories',
        lastActionTime: new Date().toISOString()
      };

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
      
      ctx.session = {
        ...ctx.session,
        lastAction: 'order_here',
        lastActionTime: new Date().toISOString()
      };

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
  
  // Обработка выбора филиала в обычном меню (не inline)
  bot.hears(match("self_pickup.select_branch"), async (ctx) => {
    try {
      // Получаем филиалы с API
      const response = await fetch('https://api.lesailes.uz/api/terminals');
      const data = await response.json();
      
      if (data.success) {
        // Находим филиал по имени
        const branchName = ctx.message.text;
        const branch = data.data.find(terminal => 
          terminal.name === branchName || 
          terminal.name_uz === branchName || 
          terminal.name_en === branchName
        );
        
        if (branch) {
          // Get user's language preference
          const userLanguage = ctx.session?.languageCode || 'uz';
          
          // Get localized branch name and description
          const localizedBranchName = userLanguage === 'uz' ? branch.name_uz : 
                                   userLanguage === 'en' ? branch.name_en : 
                                   branch.name;
          const localizedBranchDesc = userLanguage === 'uz' ? branch.desc_uz : 
                                   userLanguage === 'en' ? branch.desc_en : 
                                   branch.desc;
          
          // Get localized delivery type text
          const deliveryText = {
            ru: {
              all: '🚗 Доступна доставка',
              pickup: '🏃 Только самовывоз'
            },
            uz: {
              all: '🚗 Yetkazib berish mavjud',
              pickup: '🏃 Faqat o\'z-o\'zidan olish'
            },
            en: {
              all: '🚗 Delivery available',
              pickup: '🏃 Pickup only'
            }
          };
          
          // Формируем объект филиала с правильным форматом location
          const branchWithLocation = {
            ...branch,
            location: {
              lat: branch.latitude || "",
              lon: branch.longitude || ""
            }
          };
          
          // Сохраняем все данные о выбранном филиале
          ctx.session = {
            ...ctx.session,
            selectedBranch: branchWithLocation,
            lastAction: ctx.session.lastAction === 'select_branch_pickup' ? 'branch_selected_pickup' : 'branch_selected',
            lastActionTime: new Date().toISOString()
          };
          
          // Формируем сообщение о филиале
          let message = `<b>🏬 ${localizedBranchName}</b>\n`;
          if (localizedBranchDesc) message += `📍 ${localizedBranchDesc}\n`;
          if (branch.delivery_type === 'all') {
            message += `${deliveryText[userLanguage].all}\n`;
          } else if (branch.delivery_type === 'pickup') {
            message += `${deliveryText[userLanguage].pickup}\n`;
          }

          console.log('Final message mainMenuHandlers.js:', localizedBranchName);
          
          // Сначала отправляем информацию о филиале
          await ctx.reply(message, {
            parse_mode: 'HTML'
          });
          
          // Если есть координаты, отправляем локацию филиала
          if (branch.latitude && branch.longitude) {
            await ctx.replyWithLocation(branch.latitude, branch.longitude);
          }
          
          // Сразу после отображения информации о филиале показываем меню категорий
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
        }
      }
    } catch (error) {
      logger.error(`Ошибка при выборе филиала для пользователя ${ctx.from.id}`, error);
      await ctx.reply(ctx.i18n.t('error.unknown'));
    }
  });
  
  // Обработка кнопки "Показать на карте"
  bot.hears('📍 Показать на карте', async (ctx) => {
    try {
      const { selectedBranch } = ctx.session;
      
      if (selectedBranch?.location?.lat && selectedBranch?.location?.lon) {
        logger.info(`Отправка локации филиала ${selectedBranch.name} пользователю ${ctx.from.id}`);
        
        // Отправляем локацию филиала
        await ctx.replyWithLocation(selectedBranch.location.lat, selectedBranch.location.lon);
        
        // Показываем сообщение
        await ctx.reply(ctx.i18n.t('branch_info.location_sent'), {
          reply_markup: {
            keyboard: [
              [{ text: ctx.i18n.t('menu.back') }]
            ],
            resize_keyboard: true
          }
        });
      } else {
        logger.warn(`Нет координат филиала в сессии пользователя ${ctx.from.id}`);
        await ctx.reply(ctx.i18n.t('error.branch_location_failed'));
      }
    } catch (error) {
      logger.error(`Ошибка при отправке локации филиала для пользователя ${ctx.from.id}`, error);
      await ctx.reply(ctx.i18n.t('error.unknown'));
    }
  });

  // Обработка нажатия на кнопку с именем филиала
  bot.hears(/^[^/].*/, async (ctx) => {
    try {
      // Проверяем, что это не команда и что мы находимся в состоянии показа филиалов
      if (ctx.session?.lastAction === 'branches_list_shown') {
        const branchName = ctx.message.text;
        logger.info(`Пользователь ${ctx.from.id} выбрал филиал ${branchName}`);
        
        // Получаем филиалы с API
        const response = await fetch('https://api.lesailes.uz/api/terminals');
        const data = await response.json();
        
        if (data.success) {
          // Находим филиал по имени
          const branch = data.data.find(terminal => 
            terminal.name === branchName || 
            terminal.name_uz === branchName || 
            terminal.name_en === branchName
          );
          
          if (branch) {
            // Get user's language preference
            const userLanguage = ctx.session?.languageCode || 'uz';
            
            // Get localized branch name and description
            const localizedBranchName = userLanguage === 'uz' ? branch.name_uz : 
                                     userLanguage === 'en' ? branch.name_en : 
                                     branch.name;
            const localizedBranchDesc = userLanguage === 'uz' ? branch.desc_uz : 
                                     userLanguage === 'en' ? branch.desc_en : 
                                     branch.desc;
            
            // Get localized delivery type text
            const deliveryText = {
              ru: {
                all: '🚗 Доступна доставка',
                pickup: '🏃 Только самовывоз'
              },
              uz: {
                all: '🚗 Yetkazib berish mavjud',
                pickup: '🏃 Faqat o\'z-o\'zidan olish'
              },
              en: {
                all: '🚗 Delivery available',
                pickup: '🏃 Pickup only'
              }
            };
            
            // Формируем объект филиала с правильным форматом location
            const branchWithLocation = {
              ...branch,
              location: {
                lat: branch.latitude || "",
                lon: branch.longitude || ""
              }
            };
            
            // Сохраняем все данные о выбранном филиале
            ctx.session = {
              ...ctx.session,
              selectedBranch: branchWithLocation,
              lastAction: 'branch_selected',
              lastActionTime: new Date().toISOString()
            };
            
            // Формируем сообщение о филиале
            let message = `<b>🏬 ${localizedBranchName}</b>\n`;
            if (localizedBranchDesc) message += `📍 ${localizedBranchDesc}\n`;
            if (branch.delivery_type === 'all') {
              message += `${deliveryText[userLanguage].all}\n`;
            } else if (branch.delivery_type === 'pickup') {
              message += `${deliveryText[userLanguage].pickup}\n`;
            }
            
            // Сначала отправляем информацию о филиале
            await ctx.reply(message, {
              parse_mode: 'HTML'
            });
            
            // Если есть координаты, отправляем локацию филиала
            if (branch.latitude && branch.longitude) {
              await ctx.replyWithLocation(branch.latitude, branch.longitude);
            }
            
            // Сразу после отображения информации о филиале показываем меню категорий
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
          } else {
            // Это может быть просто другое сообщение, которое не является выбором филиала
            // Пропускаем его для обработки другими хендлерами
            return; 
          }
        }
      }
    } catch (error) {
      logger.error(`Ошибка при выборе филиала для пользователя ${ctx.from.id}`, error);
      await ctx.reply(ctx.i18n.t('error.unknown'));
    }
  });

  // Обработка выбора категории после выбора филиала
  bot.hears(/^[^🏪].*$/, async (ctx) => {
    try {
      // Проверяем, что мы находимся в состоянии выбора категории
      if (ctx.session?.lastAction === 'branch_selected' && ctx.session?.availableCategories) {
        const categoryName = ctx.message.text;
        
        // Находим выбранную категорию
        const category = ctx.session.availableCategories.find(
          cat => cat.attribute_data.name.chopar.ru === categoryName
        );
        
        if (category) {
          // Сохраняем выбранную категорию в сессии
          ctx.session = {
            ...ctx.session,
            selectedCategory: category.id,
            selectedCategoryName: category.attribute_data.name.chopar.ru,
            lastAction: 'category_selected',
            lastActionTime: new Date().toISOString()
          };
          
          try {
            // Получаем товары для выбранной категории
            const response = await fetch(`https://api.lesailes.uz/api/categories/${category.id}/root`);
            const data = await response.json();
            
            if (data.success && data.data.length > 0) {
              const products = data.data;
              const keyboard = [];
              
              // Создаем кнопки для каждого товара (по 2 в ряд)
              for (let i = 0; i < products.length; i += 2) {
                const row = [];
                // Добавляем эмодзи и форматируем цену
                const emoji = products[i].icon || '🍽️';
                row.push({ text: `${emoji} ${products[i].attribute_data.name.chopar.ru}` });
                
                if (i + 1 < products.length) {
                  const nextEmoji = products[i + 1].icon || '🍽️';
                  row.push({ text: `${nextEmoji} ${products[i + 1].attribute_data.name.chopar.ru}` });
                }
                
                keyboard.push(row);
              }
              
              // Добавляем кнопки управления
              keyboard.push([
                { text: '🛒 Корзина' },
                { text: '⬅️ Назад к категориям' }
              ]);
              
              // Отправляем сообщение с товарами
              await ctx.reply(`Выберите товар из категории "${category.attribute_data.name.chopar.ru}":`, {
                reply_markup: {
                  keyboard: keyboard,
                  resize_keyboard: true
                }
              });
              
              // Сохраняем список товаров в сессии
              ctx.session = {
                ...ctx.session,
                availableProducts: products,
                lastAction: 'products_shown'
              };
            } else {
              await ctx.reply(`В категории "${category.attribute_data.name.chopar.ru}" пока нет доступных товаров.`, {
                reply_markup: {
                  keyboard: [
                    [{ text: '⬅️ Назад к категориям' }]
                  ],
                  resize_keyboard: true
                }
              });
            }
          } catch (error) {
            console.error('Error fetching products:', error);
            await ctx.reply('Произошла ошибка при загрузке товаров. Попробуйте позже.', {
              reply_markup: {
                keyboard: [
                  [{ text: '⬅️ Назад к категориям' }]
                ],
                resize_keyboard: true
              }
            });
          }
        } else if (categoryName === '⬅️ Назад') {
          // Возвращаемся к выбору филиала
          await handleBranchSelection(ctx);
        }
      }
    } catch (error) {
      logger.error(`Ошибка при выборе категории для пользователя ${ctx.from.id}`, error);
      await ctx.reply(ctx.i18n.t('error.unknown'));
    }
  });
};

export default mainMenuHandlers;