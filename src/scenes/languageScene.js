import { Scenes } from 'telegraf';
import logger from '../utils/logger.js';
import { updateSceneInfo } from '../utils/sessionStorage.js';

const languageScene = new Scenes.BaseScene('languageScene');

// Sahnaga kirganda
languageScene.enter(async (ctx) => {
    try {
        logger.info(`Foydalanuvchi ${ctx.from.id} til sahnasiga kirdi`);
        
        // Sahnaga kirganlik to'g'risida ma'lumot qoldirish
        await updateSceneInfo(ctx.from.id, 'languageScene');
        
        await ctx.reply('<b>Assalomu alaykum! Les Ailes yetkazib berish xizmatiga xush kelibsiz.\n\nЗдравствуйте! Добро пожаловать в службу доставки Les Ailes.\n\nHello! Welcome to Les Ailes delivery service.</b>', {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [
                    ['🇺🇿 O\'zbekcha', '🇷🇺 Русский', '🇬🇧 English'],
                ],
                resize_keyboard: true
            }
        });
    } catch (error) {
        logger.error(`Til sahnasiga kirishda xatolik: ${error.message}`);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

// Til tanlash
languageScene.hears('🇺🇿 O\'zbekcha', async (ctx) => {
    try {
        ctx.session.languageCode = 'uz';
        logger.info(`Foydalanuvchi ${ctx.from.id} o'zbek tilini tanladi`);
        
        // Tilni tanlash ma'lumotini saqlash
        await updateSceneInfo(ctx.from.id, 'languageScene', { selectedLanguage: 'uz' });
        
        await ctx.scene.enter('cityScene');
    } catch (error) {
        logger.error(`O'zbek tilini tanlashda xatolik: ${error.message}`);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

languageScene.hears('🇷🇺 Русский', async (ctx) => {
    try {
        ctx.session.languageCode = 'ru';
        logger.info(`Foydalanuvchi ${ctx.from.id} rus tilini tanladi`);
        
        // Tilni tanlash ma'lumotini saqlash
        await updateSceneInfo(ctx.from.id, 'languageScene', { selectedLanguage: 'ru' });
        
        await ctx.scene.enter('cityScene');
    } catch (error) {
        logger.error(`Rus tilini tanlashda xatolik: ${error.message}`);
        await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте снова.');
    }
});

languageScene.hears('🇬🇧 English', async (ctx) => {
    try {
        ctx.session.languageCode = 'en';
        logger.info(`Foydalanuvchi ${ctx.from.id} ingliz tilini tanladi`);
        
        // Tilni tanlash ma'lumotini saqlash
        await updateSceneInfo(ctx.from.id, 'languageScene', { selectedLanguage: 'en' });
        
        await ctx.scene.enter('cityScene');
    } catch (error) {
        logger.error(`Ingliz tilini tanlashda xatolik: ${error.message}`);
        await ctx.reply('An error occurred. Please try again.');
    }
});

export default languageScene; 