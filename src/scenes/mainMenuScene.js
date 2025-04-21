import { Scenes, Telegraf } from 'telegraf';
import { match } from 'telegraf-i18n';

const mainMenuScene = new Scenes.BaseScene('mainMenuScene');

mainMenuScene.enter(async (ctx) => {
    await updateSceneInfo(ctx.from.id, 'mainMenuScene');
    ctx.session = {
        ...ctx.session,
        lastAction: 'join_team',
        lastActionTime: new Date().toISOString()
      };
      
    await ctx.reply(ctx.i18n.t('join_team.info'), {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: "O'tish", url: 'http://t.me/HavoqandJamoa_Bot' }]
            ]
        }
    });
});