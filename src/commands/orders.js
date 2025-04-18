import { Markup } from 'telegraf';

export async function handleOrder(ctx) {
    try {
        // Buyurtma berish uchun pastgi menyu tugmalarini yaratish
        const keyboard = Markup.keyboard([
            ['🚗 Yetkazib berish', '🏃‍♂️ Olib ketish'],
            ['⬅️ Orqaga']
        ]).resize();

        await ctx.reply('Buyurtma turini tanlang:', keyboard);
        
        // Sessiyaga yangi buyurtma boshlanganligini yozish
        ctx.session.orderStarted = true;
    } catch (error) {
        console.error('Error in handleOrder:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
}

export async function handleOrderCallback(ctx) {
    try {
        const action = ctx.match[0];
        
        switch (action) {
            case 'order_delivery':
                // Yetkazib berish uchun manzil so'rash
                await ctx.scene.enter('orderScene', { type: 'delivery' });
                break;
                
            case 'order_pickup':
                // Filiallarni ko'rsatish
                const pickupKeyboard = Markup.inlineKeyboard([
                    [Markup.button.callback('🏪 Olib ketish filiali', 'select_branch')],
                    [Markup.button.callback('⬅️ Orqaga', 'back_to_order')]
                ]);
                await ctx.editMessageText('Olib ketish uchun filialni tanlang:', pickupKeyboard);
                break;
                
            case 'back_to_order':
                // Buyurtma berish menyusiga qaytish
                await handleOrder(ctx);
                break;
        }
        
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Error in handleOrderCallback:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
} 