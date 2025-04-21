import { Scenes } from 'telegraf';
import logger from '../utils/logger.js';
import { updateSceneInfo } from '../utils/sessionStorage.js';
import { match } from 'telegraf-i18n';

const cityScene = new Scenes.BaseScene('cityScene');

// Sahnaga kirganda
cityScene.enter(async (ctx) => {
    try {
        logger.info(`Foydalanuvchi ${ctx.from.id} shahar sahnasiga kirdi`);
        
        // Remember the source scene if it exists in the state
        if (ctx.scene.state && ctx.scene.state.source) {
            ctx.session.sourceScene = ctx.scene.state.source;
        }
        
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

// Shahar tanlash - individual handlers using match
cityScene.hears(match('city.tashkent'), async (ctx) => {
    await handleCitySelection(ctx, 'tashkent');
});

cityScene.hears(match('city.samarkand'), async (ctx) => {
    await handleCitySelection(ctx, 'samarkand');
});

cityScene.hears(match('city.bukhara'), async (ctx) => {
    await handleCitySelection(ctx, 'bukhara');
});

cityScene.hears(match('city.fergana'), async (ctx) => {
    await handleCitySelection(ctx, 'fergana');
});

cityScene.hears(match('city.andijan'), async (ctx) => {
    await handleCitySelection(ctx, 'andijan');
});

cityScene.hears(match('city.margilan'), async (ctx) => {
    await handleCitySelection(ctx, 'margilan');
});

cityScene.hears(match('city.chirchiq'), async (ctx) => {
    await handleCitySelection(ctx, 'chirchiq');
});

cityScene.hears(match('city.qoqand'), async (ctx) => {
    await handleCitySelection(ctx, 'qoqand');
});

cityScene.hears(match('city.urganch'), async (ctx) => {
    await handleCitySelection(ctx, 'urganch');
});

cityScene.hears(match('city.nukus'), async (ctx) => {
    await handleCitySelection(ctx, 'nukus');
});

// Orqaga qaytish tugmasi uchun handler
cityScene.hears(match('menu.back'), async (ctx) => {
    try {
        // Orqaga qaytish ma'lumotini saqlash
        await updateSceneInfo(ctx.from.id, 'cityScene', { action: 'back' });
        
        // Determine where to go back to based on the source scene
        const sourceScene = ctx.session.sourceScene || 'languageScene';
        
        if (sourceScene === 'settingsScene') {
            await ctx.scene.enter('settingsScene');
        } else {
            // Default is going back to language scene
            await ctx.scene.enter('languageScene');
        }
    } catch (error) {
        logger.error(`Orqaga qaytishda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Fallback handler for unrecognized messages
cityScene.hears(/.*/, async (ctx) => {
    try {
        await ctx.reply(ctx.i18n.t('city.unknown'));
    } catch (error) {
        logger.error(`Noto'g'ri shahar tanlashda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.city_selection'));
    }
});

// City selection handler function
async function handleCitySelection(ctx, selectedCityKey) {
    try {
        // Shaharni ID'sini aniqlash
        const cityId = getCityId(selectedCityKey);
        const cityName = ctx.i18n.t(`city.${selectedCityKey}`);
        
        // Sessiyaga shahar ma'lumotlarini saqlash
        ctx.session.selectedCity = selectedCityKey;
        ctx.session.currentCity = cityId;
        ctx.session.city = cityName;
        ctx.session.lastAction = 'city_selection';
        ctx.session.lastActionTime = new Date().toISOString();
        
        logger.info(`Foydalanuvchi ${ctx.from.id} ${cityName} shahrini tanladi`);
        
        // Shaharni tanlash ma'lumotini saqlash
        await updateSceneInfo(ctx.from.id, 'cityScene', { 
            selectedCity: selectedCityKey,
            currentCity: cityId,
            displayName: cityName 
        });
        
        // Determine where to go next based on source scene
        const sourceScene = ctx.session.sourceScene || 'main';
        
        if (sourceScene === 'settingsScene') {
            // Return to settings scene if that's where we came from
            await ctx.reply(ctx.i18n.t('city.selected') || `${cityName} shahri tanlandi.`);
            await ctx.scene.enter('settingsScene');
        } else {
            // Otherwise proceed to main menu
            await ctx.scene.leave();
            await showMainMenu(ctx);
        }
    } catch (error) {
        logger.error(`Shahar tanlashda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.city_selection'));
    }
}

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