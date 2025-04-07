import { Markup } from 'telegraf';

export async function getBranchesKeyboard() {
    try {
        const response = await fetch('https://api.lesailes.uz/api/terminals');
        const data = await response.json();
        
        if (data.success) {
            // Фильтруем только активные филиалы и создаем кнопки
            const buttons = data.data
                .filter(terminal => terminal.active && terminal.name)
                .map(terminal => [Markup.button.callback(
                    terminal.name, 
                    `select_branch_${terminal.id}`
                )]);

            // Добавляем кнопку "Назад" в конец
            buttons.push([Markup.button.callback('⬅️ Назад', 'back_to_menu')]);

            return Markup.inlineKeyboard(buttons);
        }
        return null;
    } catch (error) {
        console.error('Error fetching branches:', error);
        return null;
    }
}

export async function handleBranchSelection(ctx) {
    const keyboard = await getBranchesKeyboard();
    if (keyboard) {
        await ctx.reply('Выберите филиал Les Ailes:', keyboard);
    } else {
        await ctx.reply('Извините, не удалось загрузить список филиалов. Попробуйте позже.');
    }
}

export async function handleBranchCallback(ctx) {
    const branchId = ctx.callbackQuery.data.replace('select_branch_', '');
    try {
        const response = await fetch('https://api.lesailes.uz/api/terminals');
        const data = await response.json();
        
        if (data.success) {
            const branch = data.data.find(t => t.id.toString() === branchId);
            if (branch) {
                let message = `🏪 ${branch.name}\n`;
                if (branch.desc) message += `📍 ${branch.desc}\n`;
                if (branch.delivery_type === 'all') {
                    message += '🚗 Доступна доставка\n';
                } else if (branch.delivery_type === 'pickup') {
                    message += '🏃 Только самовывоз\n';
                }
                
                // Если есть координаты, добавляем кнопку с локацией
                const buttons = [];
                if (branch.latitude && branch.longitude) {
                    buttons.push([
                        Markup.button.url(
                            '📍 Показать на карте',
                            `https://maps.google.com/?q=${branch.latitude},${branch.longitude}`
                        )
                    ]);
                }
                
                // Сохраняем выбранный филиал в сессии
                ctx.updateSession({
                    selectedBranch: branch.id,
                    selectedBranchName: branch.name,
                    branchLatitude: branch.latitude,
                    branchLongitude: branch.longitude,
                    lastAction: 'branch_selected',
                    lastActionTime: new Date().toISOString()
                });
                
                // Проверяем, был ли выбор филиала из меню самовывоза
                if (ctx.session.lastAction === 'select_branch_pickup') {
                    buttons.push([Markup.button.callback(ctx.i18n.t('self_pickup.confirm_order'), 'proceed_to_order')]);
                }
                
                buttons.push([Markup.button.callback('⬅️ Назад к филиалам', 'show_branches')]);
                
                await ctx.editMessageText(message, Markup.inlineKeyboard(buttons));
            }
        }
    } catch (error) {
        console.error('Error handling branch selection:', error);
        await ctx.reply('Произошла ошибка при выборе филиала. Попробуйте позже.');
    }
}

// Обработчик для подтверждения заказа и перехода к меню категорий
export async function handleProceedToOrder(ctx) {
    try {
        // Удаляем сообщение с выбором филиала
        await ctx.deleteMessage();
        
        // Отображаем меню категорий
        await ctx.reply(ctx.i18n.t('menu_categories.title'), {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [
                    [{ text: ctx.i18n.t('menu_categories.sets') }],
                    [{ text: ctx.i18n.t('menu_categories.snacks') }],
                    [{ text: ctx.i18n.t('menu_categories.burgers') }],
                    [{ text: ctx.i18n.t('menu_categories.chicken') }],
                    [
                        { text: ctx.i18n.t('menu_categories.back') },
                        { text: ctx.i18n.t('menu_categories.basket') }
                    ]
                ],
                resize_keyboard: true
            }
        });
    } catch (error) {
        console.error('Error proceeding to order:', error);
        await ctx.reply('Произошла ошибка при переходе к заказу. Попробуйте позже.');
    }
} 