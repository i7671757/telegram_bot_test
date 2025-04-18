import { Scenes } from 'telegraf';
import logger from '../utils/logger.js';
import { updateSceneInfo } from '../utils/sessionStorage.js';

const cityScene = new Scenes.BaseScene('cityScene');

// Sahnaga kirganda
cityScene.enter(async (ctx) => {
    try {
        logger.info(`Foydalanuvchi ${ctx.from.id} shahar sahnasiga kirdi`);
        
        // Sahnaga kirganlik to'g'risida ma'lumot qoldirish
        await updateSceneInfo(ctx.from.id, 'cityScene');
        
        // Ensure we use the language that was selected
        const userLanguage = ctx.session.languageCode || 'uz';
        ctx.i18n.locale(userLanguage);
        
        // Foydalanuvchi tiliga qarab shaharlar ro'yxatini ko'rsatish
        const cityKeys = ['tashkent', 'samarkand', 'bukhara', 'fergana', 'andijan', 
                         'margilan', 'chirchiq', 'qoqand', 'urganch', 'nukus'];
        
        // Get city names in user's selected language
        const cityNames = cityKeys.map(cityKey => ctx.i18n.t(`city.${cityKey}`));
        
        // Shaharlarni 2 qatorli qilib joylashtirish
        const rows = [];
        for (let i = 0; i < cityNames.length; i += 2) {
            const row = [cityNames[i]];
            if (i + 1 < cityNames.length) {
                row.push(cityNames[i + 1]);
            }
            rows.push(row);
        }
        
        // Orqaga tugmasini qo'shish
        rows.push([`${ctx.i18n.t('menu.back')}`]);
        
        await ctx.reply(ctx.i18n.t('select_city'), {
            reply_markup: {
                keyboard: rows,
                resize_keyboard: true
            }
        });
    } catch (error) {
        logger.error(`Shahar sahnasiga kirishda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Shahar tanlash
cityScene.hears(/.*/, async (ctx) => {
    try {
        const cityName = ctx.message.text;
        
        // Ensure we use the language that was selected
        const userLanguage = ctx.session.languageCode || 'uz';
        ctx.i18n.locale(userLanguage);
        
        // Har bir shahar uchun
        const cityKeys = ['tashkent', 'samarkand', 'bukhara', 'fergana', 'andijan', 
                       'margilan', 'chirchiq', 'qoqand', 'urganch', 'nukus'];
        
        // Find which city was selected
        let selectedCityKey = null;
        for (const cityKey of cityKeys) {
            if (ctx.i18n.t(`city.${cityKey}`) === cityName) {
                selectedCityKey = cityKey;
                break;
            }
        }
        
        if (selectedCityKey) {
            // Shaharni ID'sini aniqlash
            const cityId = getCityId(selectedCityKey);
            
            // Sessiyaga shahar ma'lumotlarini saqlash
            ctx.session.selectedCity = selectedCityKey;
            ctx.session.currentCity = cityId;
            ctx.session.lastAction = 'city_selection';
            ctx.session.lastActionTime = new Date().toISOString();
            
            logger.info(`Foydalanuvchi ${ctx.from.id} ${cityName} shahrini tanladi`);
            
            // Shaharni tanlash ma'lumotini saqlash
            await updateSceneInfo(ctx.from.id, 'cityScene', { 
                selectedCity: selectedCityKey,
                currentCity: cityId,
                displayName: cityName 
            });
            
            // Asosiy menyuga o'tish
            await ctx.scene.leave();
            await showMainMenu(ctx);
        } else if (cityName === ctx.i18n.t('menu.back')) {
            // Orqaga qaytish ma'lumotini saqlash
            await updateSceneInfo(ctx.from.id, 'cityScene', { action: 'back_to_language' });
            
            // Til tanlash sahnasiga qaytish
            await ctx.scene.enter('languageScene');
        } else {
            // Noto'g'ri shahar nomi
            await ctx.reply(ctx.i18n.t('city.unknown'));
        }
    } catch (error) {
        logger.error(`Shahar tanlashda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.city_selection'));
    }
});

// Shahar ID'sini olish funksiyasi
function getCityId(city) {
    switch(city) {
        case 'tashkent':
            return 2;
        case 'fergana':
            return 5;
        case 'bukhara':
            return 6;
        case 'andijan':
            return 1;
        case 'samarkand':
            return 3;
        case 'chirchiq':
            return 22;
        case 'margilan':
            return 18;
        case 'qoqand':
            return 23;
        case 'urganch':
            return 21;
        case 'nukus':
            return 19;
        default:
            return null;
    }
}

// Asosiy menyuni ko'rsatish funksiyasi
async function showMainMenu(ctx) {
    try {
        // Ensure the selected language is used
        const userLanguage = ctx.session.languageCode || 'uz';
        ctx.i18n.locale(userLanguage);
        
        // Asosiy menyuni ko'rsatganlik haqida ma'lumot saqlash
        await updateSceneInfo(ctx.from.id, 'mainMenu', { 
            from: 'cityScene',
            action: 'show_main_menu',
            lastAction: 'main_menu',
            lastActionTime: new Date().toISOString(),
            previousAction: ctx.session.lastAction
        });
        
        // Session'ni yangilash
        ctx.session = {
            ...ctx.session,
            lastAction: 'main_menu',
            lastActionTime: new Date().toISOString(),
            previousAction: ctx.session.lastAction
        };
        
        await ctx.reply(ctx.i18n.t('main_menu.title'), {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [
                    [{ text: ctx.i18n.t('main_menu.order') }],
                    [{ text: ctx.i18n.t('main_menu.order_history') }],
                    [{ text: ctx.i18n.t('settings.settings') }, { text: ctx.i18n.t('main_menu.aksiya') }],
                    [{ text: ctx.i18n.t('main_menu.join_team') }, { text: ctx.i18n.t('main_menu.contact') }]
                ],
                resize_keyboard: true
            }
        });
    } catch (error) {
        logger.error(`Asosiy menyuni ko'rsatishda xatolik: ${error.message}`);
        throw error;
    }
}

export default cityScene; 