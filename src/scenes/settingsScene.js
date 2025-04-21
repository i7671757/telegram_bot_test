import { Scenes, Markup } from 'telegraf';
import logger from '../utils/logger.js';
import { updateSceneInfo } from '../utils/sessionStorage.js';
import { match } from 'telegraf-i18n';

const settingsScene = new Scenes.BaseScene('settingsScene');

// Scene entry point
settingsScene.enter(async (ctx) => {
    try {
        logger.info(`Foydalanuvchi ${ctx.from.id} sozlamalar sahnasiga kirdi`);
        
        // Save scene entry information
        await updateSceneInfo(ctx.from.id, 'settingsScene');
        
        // Ensure we use the language that was selected
        const userLanguage = ctx.session.languageCode || 'uz';
        ctx.i18n.locale(userLanguage);
        
        // Create the settings menu with regular keyboard buttons
        const keyboard = Markup.keyboard([
            [ctx.i18n.t('settings.change_name'), ctx.i18n.t('settings.change_number')],
            [ctx.i18n.t('settings.change_city'), ctx.i18n.t('settings.change_language')],
            [ctx.i18n.t('settings.branch_info'), ctx.i18n.t('settings.public_offer')],
            [ctx.i18n.t('settings.back')]
        ]).resize();
        
        await ctx.reply(ctx.i18n.t('settings.title'), keyboard);
    } catch (error) {
        logger.error(`Sozlamalar sahnasiga kirishda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Handle change name button
settingsScene.hears(match("settings.change_name"), async (ctx) => {
    try {
        await updateSceneInfo(ctx.from.id, 'settingsScene', { action: 'change_name' });
        
        // For now, just acknowledge the button press
        await ctx.reply('Name change functionality will be implemented here');
    } catch (error) {
        logger.error(`Ismni o'zgartirishda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Handle change number button
settingsScene.hears(match("settings.change_number"), async (ctx) => {
    try {
        await updateSceneInfo(ctx.from.id, 'settingsScene', { action: 'change_number' });
        
        // For now, just acknowledge the button press
        await ctx.reply('Number change functionality will be implemented here');
    } catch (error) {
        logger.error(`Raqamni o'zgartirishda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Handle change city button
settingsScene.hears(match("settings.change_city"), async (ctx) => {
    try {
        await updateSceneInfo(ctx.from.id, 'settingsScene', { action: 'change_city' });
        
        // Choose the implementation method based on what you prefer:
        // Option 1: Use the dedicated cityScene with source information
        await ctx.scene.enter('cityScene', { source: 'settingsScene' });
        
        // Option 2: Use the inline city selection (Comment out the above line and uncomment below if you want to use this)
        /*
        // Instead of entering cityScene, show city options directly using localized city names
        const cityKeyboard = Markup.keyboard([
            [
                ctx.i18n.t('city.tashkent'), 
                ctx.i18n.t('city.samarkand'), 
                ctx.i18n.t('city.bukhara')
            ],
            [
                ctx.i18n.t('city.andijan'), 
                ctx.i18n.t('city.fergana'), 
                ctx.i18n.t('city.margilan')
            ],
            [
                ctx.i18n.t('city.qoqand'), 
                ctx.i18n.t('city.urganch'), 
                ctx.i18n.t('city.nukus')
            ],
            [ctx.i18n.t('settings.back')]
        ]).resize();
        
        await ctx.reply(ctx.i18n.t('city.select_city') || 'Shaharni tanlang:', cityKeyboard);
        */
    } catch (error) {
        logger.error(`Shaharni o'zgartirishda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Add handlers for all city options
settingsScene.hears([
    match('city.tashkent'),
    match('city.samarkand'),
    match('city.bukhara'),
    match('city.andijan'),
    match('city.fergana'),
    match('city.margilan'),
    match('city.qoqand'),
    match('city.urganch'),
    match('city.nukus'),
    match('city.chirchiq')
], async (ctx) => {
    try {
        // Save the selected city
        ctx.session.city = ctx.message.text;
        
        // Confirm city selection
        await ctx.reply(ctx.i18n.t('city.selected') || `${ctx.message.text} shahri tanlandi.`);
        
        // Return to settings menu
        const keyboard = Markup.keyboard([
            [ctx.i18n.t('settings.change_name'), ctx.i18n.t('settings.change_number')],
            [ctx.i18n.t('settings.change_city'), ctx.i18n.t('settings.change_language')],
            [ctx.i18n.t('settings.branch_info'), ctx.i18n.t('settings.public_offer')],
            [ctx.i18n.t('settings.back')]
        ]).resize();
        
        await ctx.reply(ctx.i18n.t('settings.title'), keyboard);
    } catch (error) {
        logger.error(`Shaharni saqlashda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Handle change language button
settingsScene.hears(match("settings.change_language"), async (ctx) => {
    try {
        await updateSceneInfo(ctx.from.id, 'settingsScene', { action: 'change_language' });
        
        // Instead of entering languageScene, show language options directly
        const languageKeyboard = Markup.keyboard([
            [ctx.i18n.t('menuLanguage.uz'), ctx.i18n.t('menuLanguage.ru'), ctx.i18n.t('menuLanguage.en')],
            [ctx.i18n.t('settings.back')]
        ]).resize();
        
        await ctx.reply(ctx.i18n.t('language.select_language'), languageKeyboard);
    } catch (error) {
        logger.error(`Tilni o'zgartirishda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Handle Uzbek language selection
settingsScene.hears(match("menuLanguage.uz"), async (ctx) => {
    try {
        ctx.session.languageCode = 'uz';
        ctx.i18n.locale('uz');
        
        await ctx.reply(ctx.i18n.t('language.changed'));
        
        // Return to settings menu
        const keyboard = Markup.keyboard([
            [ctx.i18n.t('settings.change_name'), ctx.i18n.t('settings.change_number')],
            [ctx.i18n.t('settings.change_city'), ctx.i18n.t('settings.change_language')],
            [ctx.i18n.t('settings.branch_info'), ctx.i18n.t('settings.public_offer')],
            [ctx.i18n.t('settings.back')]
        ]).resize();
        
        await ctx.reply(ctx.i18n.t('settings.title'), keyboard);
    } catch (error) {
        logger.error(`O'zbek tilini tanlashda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Handle Russian language selection
settingsScene.hears(match("menuLanguage.ru"), async (ctx) => {
    try {
        ctx.session.languageCode = 'ru';
        ctx.i18n.locale('ru');
        
        await ctx.reply(ctx.i18n.t('language.changed'));
        
        // Return to settings menu
        const keyboard = Markup.keyboard([
            [ctx.i18n.t('settings.change_name'), ctx.i18n.t('settings.change_number')],
            [ctx.i18n.t('settings.change_city'), ctx.i18n.t('settings.change_language')],
            [ctx.i18n.t('settings.branch_info'), ctx.i18n.t('settings.public_offer')],
            [ctx.i18n.t('settings.back')]
        ]).resize();
        
        await ctx.reply(ctx.i18n.t('settings.title'), keyboard);
    } catch (error) {
        logger.error(`Rus tilini tanlashda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Handle English language selection
settingsScene.hears(match("menuLanguage.en"), async (ctx) => {
    try {
        ctx.session.languageCode = 'en';
        ctx.i18n.locale('en');
        
        await ctx.reply(ctx.i18n.t('language.changed'));
        
        // Return to settings menu
        const keyboard = Markup.keyboard([
            [ctx.i18n.t('settings.change_name'), ctx.i18n.t('settings.change_number')],
            [ctx.i18n.t('settings.change_city'), ctx.i18n.t('settings.change_language')],
            [ctx.i18n.t('settings.branch_info'), ctx.i18n.t('settings.public_offer')],
            [ctx.i18n.t('settings.back')]
        ]).resize();
        
        await ctx.reply(ctx.i18n.t('settings.title'), keyboard);
    } catch (error) {
        logger.error(`Ingliz tilini tanlashda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Handle branch information button
settingsScene.hears(match("settings.branch_info"), async (ctx) => {
    try {
        await updateSceneInfo(ctx.from.id, 'settingsScene', { action: 'branch_info' });
        
        // For now, just acknowledge the button press
        await ctx.reply('Branch information functionality will be implemented here');
    } catch (error) {
        logger.error(`Fillial ma'lumotlarida xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Handle public offer button
settingsScene.hears(match("settings.public_offer"), async (ctx) => {
    try {
        await updateSceneInfo(ctx.from.id, 'settingsScene', { action: 'public_offer' });
        
        // For now, just acknowledge the button press
        await ctx.reply('Public offer functionality will be implemented here');
        await ctx.scene.enter('publicOfferScene');
    } catch (error) {
        logger.error(`Ommaviy taklifda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Handle back button
settingsScene.hears(match("settings.back"), async (ctx) => {
    try {
        await updateSceneInfo(ctx.from.id, 'settingsScene', { action: 'back_to_main_menu' });
        
        // Leave the scene and return to main menu
        await ctx.scene.leave();
        
        // Get user language
        const userLanguage = ctx.session.languageCode || 'uz';
        ctx.i18n.locale(userLanguage);
        
        // Show main menu
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
        logger.error(`Asosiy menyuga qaytishda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

export default settingsScene; 