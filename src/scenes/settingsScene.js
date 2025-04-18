import { Scenes, Markup } from 'telegraf';
import logger from '../utils/logger.js';
import { updateSceneInfo } from '../utils/sessionStorage.js';

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
settingsScene.hears(/👤.*name|👤.*исм|👤.*ism/i, async (ctx) => {
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
settingsScene.hears(/📞.*number|📞.*номер|📞.*raqam/i, async (ctx) => {
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
settingsScene.hears(/🏙️.*city|🏙️.*город|🏙️.*shahar/i, async (ctx) => {
    try {
        await updateSceneInfo(ctx.from.id, 'settingsScene', { action: 'change_city' });
        
        // Enter the city selection scene
        await ctx.scene.enter('cityScene');
    } catch (error) {
        logger.error(`Shaharni o'zgartirishda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Handle change language button
settingsScene.hears(/🌐.*language|🌐.*язык|🌐.*til/i, async (ctx) => {
    try {
        await updateSceneInfo(ctx.from.id, 'settingsScene', { action: 'change_language' });
        
        // Enter the language selection scene
        await ctx.scene.enter('languageScene');
    } catch (error) {
        logger.error(`Tilni o'zgartirishda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Handle branch information button
settingsScene.hears(/ℹ️.*branch|ℹ️.*филиал|ℹ️.*fillial/i, async (ctx) => {
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
settingsScene.hears(/📄.*offer|📄.*оферта|📄.*taklif/i, async (ctx) => {
    try {
        await updateSceneInfo(ctx.from.id, 'settingsScene', { action: 'public_offer' });
        
        // For now, just acknowledge the button press
        await ctx.reply('Public offer functionality will be implemented here');
    } catch (error) {
        logger.error(`Ommaviy taklifda xatolik: ${error.message}`);
        await ctx.reply(ctx.i18n.t('error.unknown'));
    }
});

// Handle back button
settingsScene.hears(/◀️.*back|◀️.*назад|◀️.*ortga/i, async (ctx) => {
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