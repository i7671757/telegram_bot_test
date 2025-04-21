import { Scenes, Markup } from 'telegraf';
import { updateSceneInfo } from '../utils/sessionStorage.js';
import { match } from 'telegraf-i18n';
const orderScene = new Scenes.BaseScene('orderScene');

orderScene.enter(async (ctx) => {
    try {
        const { type } = ctx.scene.state;
        ctx.session.orderType = type;
        
        if (type === 'delivery') {
            const keyboard = Markup.keyboard([
                [ctx.i18n.t('order.location_button')],
                [ctx.i18n.t('order.back')]
            ]).resize();
            
            await ctx.reply(ctx.i18n.t('order.send_location'), keyboard);
        }
        
        await updateSceneInfo(ctx.from.id, 'orderScene', {
            action: 'enter_scene',
            type: type,
            enterTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in orderScene enter:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

// Lokatsiya yuborish tugmasi uchun handler (barcha tillarda)
orderScene.hears(match("order.location_button"), async (ctx) => {
    try {
        await ctx.reply(ctx.i18n.t('order.send_location'), {
            reply_markup: {
                keyboard: [
                    [{
                        text: ctx.i18n.t('order.location_button'),
                        request_location: true
                    }],
                    [ctx.i18n.t('order.back')]
                ],
                resize_keyboard: true
            }
        });
        
        await updateSceneInfo(ctx.from.id, 'orderScene', {
            action: 'request_location',
            actionTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in location request:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

orderScene.on('location', async (ctx) => {
    try {
        const { latitude, longitude } = ctx.message.location;
        ctx.session.orderLocation = { latitude, longitude };
        
        // Menyuni ko'rsatish
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback(ctx.i18n.t('order.chicken'), 'menu_chicken')],
            [Markup.button.callback(ctx.i18n.t('order.sides'), 'menu_sides')],
            [Markup.button.callback(ctx.i18n.t('order.drinks'), 'menu_drinks')],
            [Markup.button.callback(ctx.i18n.t('order.sauces'), 'menu_sauces')],
            [Markup.button.callback(ctx.i18n.t('order.back'), 'back_to_order')]
        ]);
        
        await ctx.reply(ctx.i18n.t('order.select_menu'), keyboard);
        
        await updateSceneInfo(ctx.from.id, 'orderScene', {
            action: 'location_received',
            location: { latitude, longitude },
            actionTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in location handling:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

// Menyu seksiyasi uchun handler
orderScene.action(match("order.menu_category"), async (ctx) => {
    try {
        const category = ctx.match[0].split('_')[1];
        let products = [];
        
        // Kategoriya bo'yicha mahsulotlarni olish
        switch (category) {
            case 'chicken':
                products = [
                    { id: 1, name: '🍗 Original', price: 25000 },
                    { id: 2, name: '🔥 Hot', price: 27000 },
                    { id: 3, name: '🌶 Extra Hot', price: 27000 }
                ];
                break;
            case 'sides':
                products = [
                    { id: 4, name: '🍟 Kartoshka Fri', price: 15000 },
                    { id: 5, name: '🥗 Coleslaw', price: 12000 }
                ];
                break;
            case 'drinks':
                products = [
                    { id: 6, name: '🥤 Coca-Cola', price: 10000 },
                    { id: 7, name: '🥤 Fanta', price: 10000 },
                    { id: 8, name: '🥤 Sprite', price: 10000 }
                ];
                break;
            case 'sauces':
                products = [
                    { id: 9, name: '🥫 Chesnok', price: 3000 },
                    { id: 10, name: '🥫 BBQ', price: 3000 },
                    { id: 11, name: '🥫 Cheese', price: 3000 }
                ];
                break;
        }
        
        // Mahsulotlar uchun tugmalar yaratish
        const keyboard = Markup.inlineKeyboard([
            ...products.map(product => [
                Markup.button.callback(
                    `${product.name} - ${product.price} so'm`,
                    `add_product_${product.id}`
                )
            ]),
            [Markup.button.callback(ctx.i18n.t('order.back'), 'back_to_menu')]
        ]);
        
        await ctx.editMessageText(ctx.i18n.t('order.select_product'), keyboard);
        
        await updateSceneInfo(ctx.from.id, 'orderScene', {
            action: 'show_products',
            category: category,
            actionTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in menu handling:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

// Mahsulotlarni savatga qo'shish uchun handler
orderScene.action(match("order.add_product"), async (ctx) => {
    try {
        const productId = parseInt(ctx.match[0].split('_')[2]);
        
        // Mahsulotni savatga qo'shish
        if (!ctx.session.cart) {
            ctx.session.cart = [];
        }
        
        ctx.session.cart.push(productId);
        
        // Savatni ko'rsatish
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback(ctx.i18n.t('order.view_cart'), 'show_cart')],
            [Markup.button.callback(ctx.i18n.t('order.continue_order'), 'back_to_menu')]
        ]);
        
        await ctx.editMessageText(ctx.i18n.t('order.added_to_cart'), keyboard);
        
        await updateSceneInfo(ctx.from.id, 'orderScene', {
            action: 'add_to_cart',
            productId: productId,
            actionTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in adding product:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

// Savatni ko'rish uchun handler
orderScene.action(match("order.show_cart"), async (ctx) => {
    try {
        if (!ctx.session.cart || ctx.session.cart.length === 0) {
            await ctx.editMessageText(ctx.i18n.t('order.cart_empty'), 
                Markup.inlineKeyboard([
                    [Markup.button.callback(ctx.i18n.t('order.continue_order'), 'back_to_menu')]
                ])
            );
            return;
        }
        
        // Savatdagi mahsulotlarni ko'rsatish
        let message = ctx.i18n.t('order.your_cart') + '\n\n';
        let total = 0;
        
        const products = {
            1: { name: '🍗 Original', price: 25000 },
            2: { name: '🔥 Hot', price: 27000 },
            3: { name: '🌶 Extra Hot', price: 27000 },
            4: { name: '🍟 Kartoshka Fri', price: 15000 },
            5: { name: '🥗 Coleslaw', price: 12000 },
            6: { name: '🥤 Coca-Cola', price: 10000 },
            7: { name: '🥤 Fanta', price: 10000 },
            8: { name: '🥤 Sprite', price: 10000 },
            9: { name: '🥫 Chesnok', price: 3000 },
            10: { name: '🥫 BBQ', price: 3000 },
            11: { name: '🥫 Cheese', price: 3000 }
        };
        
        ctx.session.cart.forEach(productId => {
            const product = products[productId];
            message += `${product.name} - ${product.price} so'm\n`;
            total += product.price;
        });
        
        message += `\n${ctx.i18n.t('order.total')} ${total} so'm`;
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback(ctx.i18n.t('order.confirm_order'), 'confirm_order')],
            [Markup.button.callback(ctx.i18n.t('order.clear_cart'), 'clear_cart')],
            [Markup.button.callback(ctx.i18n.t('order.continue_order'), 'back_to_menu')]
        ]);
        
        await ctx.editMessageText(message, keyboard);
        
        await updateSceneInfo(ctx.from.id, 'orderScene', {
            action: 'show_cart',
            cartItems: ctx.session.cart,
            total: total,
            actionTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in showing cart:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

// Savatni tozalash uchun handler
orderScene.action(match("order.clear_cart"), async (ctx) => {
    try {
        ctx.session.cart = [];
        
        await ctx.editMessageText(ctx.i18n.t('order.cart_cleared'), 
            Markup.inlineKeyboard([
                [Markup.button.callback(ctx.i18n.t('order.continue_order'), 'back_to_menu')]
            ])
        );
        
        await updateSceneInfo(ctx.from.id, 'orderScene', {
            action: 'clear_cart',
            actionTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in clearing cart:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

// Buyurtmani tasdiqlash uchun handler
orderScene.action(match("order.confirm_order"), async (ctx) => {
    try {
        // Buyurtmani tasdiqlash
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback(ctx.i18n.t('order.select_payment'), 'select_payment')],
            [Markup.button.callback(ctx.i18n.t('order.back'), 'show_cart')]
        ]);
        
        await ctx.editMessageText(ctx.i18n.t('order.order_confirmed'), keyboard);
        
        await updateSceneInfo(ctx.from.id, 'orderScene', {
            action: 'confirm_order',
            actionTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in confirming order:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

// To'lov usulini tanlash uchun handler
orderScene.action(match("order.select_payment"), async (ctx) => {
    try {
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback(ctx.i18n.t('order.cash'), 'payment_cash')],
            [Markup.button.callback(ctx.i18n.t('order.card'), 'payment_card')],
            [Markup.button.callback(ctx.i18n.t('order.back'), 'confirm_order')]
        ]);
        
        await ctx.editMessageText(ctx.i18n.t('order.select_payment'), keyboard);
        
        await updateSceneInfo(ctx.from.id, 'orderScene', {
            action: 'select_payment',
            actionTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in payment selection:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

btoa.


// To'lov turini tanlash uchun handler
orderScene.action(match("order.payment_type"), async (ctx) => {
    try {
        const paymentType = ctx.match[0].split('_')[1];
        ctx.session.paymentType = paymentType;
        
        // Buyurtma holatini o'chirish
        ctx.session.orderStarted = false;
        
        // Buyurtmani yakunlash
        const keyboard = Markup.keyboard([
            ['🏪 Выбрать филиал'],
            ['📊 Информация о терминалах'],
            ['🛍 Заказать', '📱 Контакты']
        ]).resize();
        
        let message = 'Buyurtmangiz qabul qilindi!\n\n';
        message += `To'lov usuli: ${paymentType === 'cash' ? 'Naqd pul' : 'Terminal'}\n`;
        message += 'Tez orada operator siz bilan bog\'lanadi.';
        
        await ctx.reply(message, keyboard);
        
        // Sahnadan chiqish
        await ctx.scene.leave();
        
        await updateSceneInfo(ctx.from.id, 'orderScene', {
            action: 'complete_order',
            paymentType: paymentType,
            actionTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in payment handling:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

// Orqaga tugmasi uchun handler (barcha tillarda)
orderScene.hears(match("order.back"), async (ctx) => {
    try {
        // Orqaga qaytishda buyurtma berish holatini o'chirish
        ctx.session.orderStarted = false;
        
        const menuButtons = [
            [ctx.i18n.t('mainMenu.branch')],
            [ctx.i18n.t('mainMenu.terminals')],
            [ctx.i18n.t('mainMenu.order'), ctx.i18n.t('mainMenu.contacts')]
        ];
        
        const keyboard = Markup.keyboard(menuButtons).resize();
        
        await ctx.reply(ctx.i18n.t('mainMenu.title'), keyboard);
        await ctx.scene.leave();
        
        await updateSceneInfo(ctx.from.id, 'orderScene', {
            action: 'back_to_main',
            actionTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in back button:', error);
        await ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
});

export default orderScene; 