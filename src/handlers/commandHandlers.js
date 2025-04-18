import { setCommandsMenu } from '../utils/commands.js';
import logger from '../utils/logger.js';
import { updateSceneInfo } from '../utils/sessionStorage.js';
import fs from 'fs/promises';

// Обработчики команд
const commandHandlers = (bot) => {
  // Команда /start - начало работы
  bot.start(async (ctx) => {
    try {
      // Инициализируем сессию, если её нет
      if (!ctx.session) {
        ctx.session = {
          languageCode: 'en',
          navigationHistory: [],
          startTime: new Date().toISOString(),
          visits: 1
        };
      } else {
        ctx.session.visits = (ctx.session.visits || 0) + 1;
      }
      
      // Устанавливаем язык по умолчанию
      ctx.i18n.locale(ctx.session.languageCode || 'en');
      
      // Сохраняем информацию о запуске бота
      await updateSceneInfo(ctx.from.id, 'start', {
        action: 'bot_start',
        startTime: new Date().toISOString(),
        visits: ctx.session.visits
      });
      
      // Обновляем меню команд
      await setCommandsMenu(ctx);
      
      logger.info(`Пользователь ${ctx.from.id} запустил бота (visits: ${ctx.session.visits})`);
      
      // Отправляем приветственное сообщение с выбором языка
      await ctx.reply('<b>Assalomu alaykum! Les Ailes yetkazib berish xizmatiga xush kelibsiz.\n\nЗдравствуйте! Добро пожаловать в службу доставки Les Ailes.\n\nHello! Welcome to Les Ailes delivery service.</b>',
        {
          parse_mode: 'HTML',
          reply_markup: {
            keyboard: [
              [
                { text: ctx.i18n.t('menuLanguage.ru') }, 
                { text: ctx.i18n.t('menuLanguage.uz') }, 
                { text: ctx.i18n.t('menuLanguage.en') }
              ]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
          }
        });
    } catch (error) {
      logger.error(`Ошибка при обработке команды /start для пользователя ${ctx.from.id}`, error);
      await ctx.reply('Произошла ошибка при запуске бота. Пожалуйста, попробуйте позже.');
    }
  });

  // Команда для просмотра данных сессии
  bot.command('session', async (ctx) => {
    try {
      const sessionInfo = JSON.stringify(ctx.session, null, 2);
      logger.info(`Пользователь ${ctx.from.id} запросил информацию о сессии`);
      
      await ctx.reply(`<b>Ваши данные сессии:</b>\n<pre>${sessionInfo}</pre>`, {
        parse_mode: 'HTML'
      });
      
      // Сохраняем информацию о просмотре сессии
      await updateSceneInfo(ctx.from.id, 'command', {
        action: 'view_session_info',
        actionTime: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Ошибка при выполнении команды /session для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });

  // Команда для сброса сессии
  bot.command('reset', async (ctx) => {
    try {
      const oldVisits = ctx.session.visits || 0;
      
      ctx.session = {
        ...ctx.session,
        languageCode: 'en',
        visits: oldVisits,
        reset: true,
        resetTime: new Date().toISOString()
      };
      
      logger.info(`Пользователь ${ctx.from.id} сбросил настройки сессии`);
      
      // Сохраняем информацию о сбросе сессии
      await updateSceneInfo(ctx.from.id, 'command', {
        action: 'reset_session',
        actionTime: new Date().toISOString()
      });
      
      await ctx.reply(ctx.i18n.t('session.reset'));
    } catch (error) {
      logger.error(`Ошибка при выполнении команды /reset для пользователя ${ctx.from.id}`, error);
      throw error;
    }
  });
  
  // Sahnalar ma'lumotlarini ko'rish komandasi
  bot.command('scenesinfo', async (ctx) => {
    try {
      // Foydalanuvchi ma'lumotlarini json.session faylidan topish
      const sessionFile = await fs.readFile('./session.json', 'utf8');
      const sessions = JSON.parse(sessionFile);
      
      // Foydalanuvchi sessiyasini topish
      const userSession = sessions.sessions.find(s => s.id === `${ctx.from.id}:${ctx.from.id}`);
      
      if (!userSession) {
        return await ctx.reply('Sizning ma\'lumotlaringiz topilmadi.');
      }
      
      // Sahnalar ma'lumotlarini chiqarish
      const sceneInfo = userSession.data.sceneData || {};
      const currentScene = userSession.data.currentScene;
      
      let message = `<b>🔍 Sahnalar ma'lumotlari:</b>\n\n`;
      
      // Foydalanuvchi haqida ma'lumot
      message += `👤 Foydalanuvchi: <code>${ctx.from.id}</code>\n`;
      message += `🌐 Til: <code>${userSession.data.languageCode || 'Tanlanmagan'}</code>\n`;
      message += `🏙 Shahar: <code>${userSession.data.selectedCity || 'Tanlanmagan'}</code>\n`;
      
      // Joriy sahna haqida ma'lumot
      message += `\n📌 <b>Joriy sahna:</b> <code>${currentScene || 'Mavjud emas'}</code>\n\n`;
      
      // Sahnalar tarixi
      if (sceneInfo && Object.keys(sceneInfo).length > 0) {
        message += `<b>📚 Sahnalar tarixi:</b>\n\n`;
        
        // Sahnalarni vaqt bo'yicha tartiblash
        const sortedScenes = Object.keys(sceneInfo).sort((a, b) => {
          const timeA = sceneInfo[a].lastAccessed ? new Date(sceneInfo[a].lastAccessed).getTime() : 0;
          const timeB = sceneInfo[b].lastAccessed ? new Date(sceneInfo[b].lastAccessed).getTime() : 0;
          return timeB - timeA; // Eng so'nggi sahna birinchi
        });
        
        sortedScenes.forEach(sceneName => {
          const scene = sceneInfo[sceneName];
          message += `<b>📑 ${sceneName}</b>\n`;
          
          // Sahna ma'lumotlarini chiroyli ko'rsatish
          if (scene.enterTime) {
            message += `   ⏱ Kirish vaqti: <code>${new Date(scene.enterTime).toLocaleString()}</code>\n`;
          }
          
          if (scene.leaveTime) {
            message += `   ⏱ Chiqish vaqti: <code>${new Date(scene.leaveTime).toLocaleString()}</code>\n`;
          }
          
          if (scene.timeSpent) {
            message += `   ⏳ Sarflangan vaqt: <code>${scene.timeSpent} soniya</code>\n`;
          }
          
          if (scene.action) {
            message += `   🔄 Harakat: <code>${scene.action}</code>\n`;
          }
          
          // Boshqa ma'lumotlarni ko'rsatish
          Object.keys(scene).forEach(key => {
            // Avval ko'rsatilgan maydonlarni o'tkazib yuborish
            if (!['enterTime', 'leaveTime', 'timeSpent', 'action', 'lastAccessed', 'entered', 'left'].includes(key)) {
              let value = scene[key];
              
              // Agar qiymat obyekt bo'lsa, uni JSON formatiga o'tkazish
              if (typeof value === 'object' && value !== null) {
                value = JSON.stringify(value);
              }
              
              message += `   📊 ${key}: <code>${value}</code>\n`;
            }
          });
          
          message += '\n';
        });
      } else {
        message += '❌ <i>Sahnalar ma\'lumotlari mavjud emas.</i>';
      }
      
      // Habar uzunligini tekshirish va kerak bo'lsa qisqartirish
      if (message.length > 4000) {
        message = message.substring(0, 3900) + '...\n\n<i>⚠️ Habar uzunligi cheklanganligi sababli qisqartirildi.</i>';
      }
      
      await ctx.reply(message, { parse_mode: 'HTML' });
      
      // Ma'lumotlar ko'rilganligini sessiyaga yozish
      await updateSceneInfo(ctx.from.id, 'command', {
        action: 'view_scenes_info',
        actionTime: new Date().toISOString()
      });
      
      logger.info(`Пользователь ${ctx.from.id} запросил информацию о сценах`);
    } catch (error) {
      logger.error(`Ошибка при выполнении команды /scenesinfo для пользователя ${ctx.from.id}`, error);
      await ctx.reply('Ma\'lumotlarni olishda xatolik yuz berdi.');
    }
  });
};

export default commandHandlers; 