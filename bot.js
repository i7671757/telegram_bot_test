import { Telegraf, Markup, Scenes, session } from 'telegraf';
import { config } from 'dotenv';
import { handleBranchSelection, handleBranchCallback } from './src/commands/branches.js';
import { 
    handleTerminalsCommand,
    handleShowActiveTerminals,
    handleTerminalsPagination,
    handleShowTerminalsMenu,
    handleShowTerminalsMap,
    handleShowMapTerminal,
    handleShowTerminalsStats
} from './src/commands/terminals.js';
import languageScene from './src/scenes/languageScene.js';
import cityScene from './src/scenes/cityScene.js';
import settingsScene from './src/scenes/settingsScene.js';
import { updateSceneInfo } from './src/utils/sessionStorage.js';
import sessionMiddleware from './src/middleware/session.js';
import TelegrafI18n from 'telegraf-i18n';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

// I18n ni sozlash
const i18n = new TelegrafI18n({
    directory: path.resolve(__dirname, './src/locales'),
    defaultLanguage: 'uz',
    sessionName: 'session',
    useSession: true,
    allowMissing: true,
    fallbackToDefaultLanguage: true
});

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Session middleware'ini ulash
bot.use(session());

// Sahnalarni yaratish
const stage = new Scenes.Stage([languageScene, cityScene, settingsScene]);

// Middleware'larni to'g'ri tartibda qo'shish
bot.use(i18n.middleware()); // Birinchi i18n
bot.use(stage.middleware()); // Keyin sahna
bot.use(sessionMiddleware); // Oxirida sessiya middleware'i

// Start komandasi
bot.command('start', async (ctx) => {
    try {
        // Start komandasi ishlatilganligini sessiyaga yozish
        await updateSceneInfo(ctx.from.id, 'start', {
            action: 'bot_start',
            startTime: new Date().toISOString()
        });
        
        // Til tanlash sahnasiga o'tish
        await ctx.scene.enter('languageScene');
    } catch (error) {
        console.error('Error in start command:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

// Sahnalar ma'lumotlarini ko'rish komandasi
bot.command('scenesinfo', async (ctx) => {
    try {
        // Foydalanuvchi ma'lumotlarini json.session faylidan topish
        const fs = await import('fs/promises');
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
        if (Object.keys(sceneInfo).length > 0) {
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
    } catch (error) {
        console.error('Error in scenesinfo command:', error);
        await ctx.reply('Ma\'lumotlarni olishda xatolik yuz berdi.');
    }
});

// Обработка нажатия на кнопку "Выбрать филиал"
bot.hears('🏪 Выбрать филиал', async (ctx) => {
    await updateSceneInfo(ctx.from.id, 'branch_selection', {
        action: 'select_branch_menu',
        actionTime: new Date().toISOString()
    });
    await handleBranchSelection(ctx);
});

// Обработка нажатия на кнопку "Информация о терминалах"
bot.hears('📊 Информация о терминалах', async (ctx) => {
    await updateSceneInfo(ctx.from.id, 'terminals_info', {
        action: 'show_terminals_info',
        actionTime: new Date().toISOString()
    });
    await handleTerminalsCommand(ctx);
});
bot.command('terminals', async (ctx) => {
    await updateSceneInfo(ctx.from.id, 'terminals_info', {
        action: 'terminals_command',
        actionTime: new Date().toISOString()
    });
    await handleTerminalsCommand(ctx);
});

// Обработка выбора конкретного филиала
bot.action(/^select_branch_\d+$/, async (ctx) => {
    const branchId = ctx.match[0].split('_').pop();
    await updateSceneInfo(ctx.from.id, 'branch_selection', {
        action: 'select_specific_branch',
        branchId: branchId,
        actionTime: new Date().toISOString()
    });
    await handleBranchCallback(ctx);
});

// Обработка кнопки "Назад к филиалам"
bot.action('show_branches', async (ctx) => {
    await updateSceneInfo(ctx.from.id, 'branch_selection', {
        action: 'back_to_branches',
        actionTime: new Date().toISOString()
    });
    await handleBranchSelection(ctx);
});

// Обработка кнопки "Назад в главное меню"
bot.action('back_to_menu', async (ctx) => {
    await updateSceneInfo(ctx.from.id, 'main_menu', {
        action: 'back_to_main_menu',
        actionTime: new Date().toISOString()
    });
    
    await ctx.deleteMessage();
    const keyboard = Markup.keyboard([
        ['🏪 Выбрать филиал'],
        ['📊 Информация о терминалах'],
        ['🛍 Заказать', '📱 Контакты']
    ]).resize();
    await ctx.reply('Выберите действие:', keyboard);
});

// Обработчики для работы с терминалами
bot.action('show_active_terminals', async (ctx) => {
    await updateSceneInfo(ctx.from.id, 'terminals_info', {
        action: 'show_active_terminals',
        actionTime: new Date().toISOString()
    });
    await handleShowActiveTerminals(ctx);
});
bot.action(/^terminals_page_\d+$/, async (ctx) => {
    const page = ctx.match[0].split('_').pop();
    await updateSceneInfo(ctx.from.id, 'terminals_info', {
        action: 'terminals_pagination',
        page: page,
        actionTime: new Date().toISOString()
    });
    await handleTerminalsPagination(ctx);
});
bot.action('show_terminals_menu', async (ctx) => {
    await updateSceneInfo(ctx.from.id, 'terminals_info', {
        action: 'show_terminals_menu',
        actionTime: new Date().toISOString()
    });
    await handleShowTerminalsMenu(ctx);
});
bot.action('show_terminals_map', async (ctx) => {
    await updateSceneInfo(ctx.from.id, 'terminals_info', {
        action: 'show_terminals_map',
        actionTime: new Date().toISOString()
    });
    await handleShowTerminalsMap(ctx);
});
bot.action(/^show_map_\d+$/, async (ctx) => {
    const terminalId = ctx.match[0].split('_').pop();
    await updateSceneInfo(ctx.from.id, 'terminals_info', {
        action: 'show_map_terminal',
        terminalId: terminalId,
        actionTime: new Date().toISOString()
    });
    await handleShowMapTerminal(ctx);
});
bot.action('show_terminals_stats', async (ctx) => {
    await updateSceneInfo(ctx.from.id, 'terminals_info', {
        action: 'show_terminals_stats',
        actionTime: new Date().toISOString()
    });
    await handleShowTerminalsStats(ctx);
});
bot.action('noop', (ctx) => ctx.answerCbQuery());

// Handler for the settings button
bot.hears(['⚙️Sozlash ℹ️ Ma\'lumotlar', '⚙️Настройки ℹ️ Информация', '⚙️Settings ℹ️ Information'], async (ctx) => {
    try {
        await updateSceneInfo(ctx.from.id, 'settings', {
            action: 'enter_settings',
            actionTime: new Date().toISOString()
        });
        await ctx.scene.enter('settingsScene');
    } catch (error) {
        console.error('Error in settings command:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

// Запуск бота
bot.launch().then(() => {
    console.log('Bot started successfully');
}).catch((err) => {
    console.error('Error starting bot:', err);
});

// Включаем graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 