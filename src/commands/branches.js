import { Markup } from 'telegraf';

export async function getBranchesKeyboard(cityId = null) {
    try {
        const response = await fetch('https://api.lesailes.uz/api/terminals');
        const data = await response.json();
        
        if (data.success) {
            // Фильтруем только активные филиалы
            let branches = data.data.filter(terminal => terminal.active && terminal.name);
            
            // Если передан cityId, фильтруем по нему
            if (cityId) {
                branches = branches.filter(branch => branch.city_id === cityId);
            }
            
            return branches;
        }
        return null;
    } catch (error) {
        console.error('Error fetching branches:', error);
        return null;
    }
}

export async function handleBranchSelection(ctx) {
    try {
        // Получаем ID города из сессии, если он есть
        const cityId = ctx.session?.selectedCityId ? parseInt(ctx.session.selectedCityId) : null;
        
        // Получаем филиалы с фильтрацией по городу, если указан
        const branches = await getBranchesKeyboard(cityId);
        
        if (branches && branches.length > 0) {
            // Создаем клавиатуру с кнопками филиалов (по 2 в строке)
            const keyboard = [];
            
            for (let i = 0; i < branches.length; i += 2) {
                const row = [];
                row.push({ text: `🏪 ${branches[i].name}` });
                
                if (i + 1 < branches.length) {
                    row.push({ text: `🏪 ${branches[i + 1].name}` });
                }
                
                keyboard.push(row);
            }
            
            // Добавляем кнопку "Назад"
            keyboard.push([{ text: ctx.i18n.t('menu.back') }]);
            
            await ctx.reply(ctx.i18n.t('select_branch'), {
                reply_markup: {
                    keyboard: keyboard,
                    resize_keyboard: true
                }
            });
            
            // Сохраняем данные о филиалах и предыдущее действие в сессии пользователя
            const previousAction = ctx.session?.lastAction;
            
            ctx.updateSession({
                availableBranches: branches,
                previousAction: previousAction,
                lastAction: 'branches_list_shown',
                lastActionTime: new Date().toISOString()
            });
        } else {
            await ctx.reply(ctx.i18n.t('error.branches_load_failed'));
        }
    } catch (error) {
        console.error('Error displaying branches:', error);
        await ctx.reply(ctx.i18n.t('error.branches_load_failed'));
    }
}

// Function to fetch categories from API
export async function getCategories() {
    try {
        const response = await fetch('https://api.lesailes.uz/api/categories/root');
        const data = await response.json();
        
        if (data.success) {
            // Фильтруем только активные категории
            return data.data.filter(category => category.active);
        }
        return null;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return null;
    }
}

// Function to create categories keyboard
export function createCategoriesKeyboard(categories) {
    const keyboard = [];
    
    // Group categories by 2 in a row
    for (let i = 0; i < categories.length; i += 2) {
        const row = [];
        const emoji = categories[i].icon || '🍽️';
        row.push({ text: `${emoji} ${categories[i].attribute_data.name.chopar.ru}` });
        
        if (i + 1 < categories.length) {
            const nextEmoji = categories[i + 1].icon || '🍽️';
            row.push({ text: `${nextEmoji} ${categories[i + 1].attribute_data.name.chopar.ru}` });
        }
        
        keyboard.push(row);
    }
    
    // Add back and cart buttons
    keyboard.push([
        { text: '🛒 Корзина' },
        { text: '⬅️ Назад' }
    ]);
    
    return keyboard;
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
                
                // Сохраняем выбранный филиал в сессии
                ctx.updateSession({
                    selectedBranch: branch.id,
                    selectedBranchName: branch.name,
                    branchLatitude: branch.latitude,
                    branchLongitude: branch.longitude,
                    lastAction: 'branch_selected',
                    lastActionTime: new Date().toISOString()
                });

                // Сначала отправляем информацию о выбранном филиале
                await ctx.reply(message);

                // Получаем категории
                const categories = await getCategories();
                if (categories && categories.length > 0) {
                    const keyboard = [];
                    
                    // Добавляем эмодзи к названиям категорий
                    for (let i = 0; i < categories.length; i += 2) {
                        const row = [];
                        const emoji = categories[i].icon || '🍽️'; // используем эмодзи из API или дефолтное
                        row.push({ text: `${emoji} ${categories[i].attribute_data.name.chopar.ru}` });
                        
                        if (i + 1 < categories.length) {
                            const nextEmoji = categories[i + 1].icon || '🍽️';
                            row.push({ text: `${nextEmoji} ${categories[i + 1].attribute_data.name.chopar.ru}` });
                        }
                        
                        keyboard.push(row);
                    }
                    
                    // Добавляем кнопки корзины и назад
                    keyboard.push([
                        { text: '🛒 Корзина' },
                        { text: '⬅️ Назад' }
                    ]);
                    
                    // Отправляем меню категорий
                    await ctx.reply('Выберите категорию:', {
                        reply_markup: {
                            keyboard: keyboard,
                            resize_keyboard: true
                        }
                    });

                    // Обновляем сессию с доступными категориями
                    ctx.updateSession({
                        availableCategories: categories,
                        lastAction: 'categories_shown'
                    });
                } else {
                    await ctx.reply('Извините, не удалось загрузить категории. Попробуйте позже.');
                }
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

export async function handleCategorySelection(ctx) {
    try {
        const categories = await getCategories();
        
        if (categories && categories.length > 0) {
            // Создаем клавиатуру с кнопками категорий (по 2 в строке)
            const keyboard = [];
            
            for (let i = 0; i < categories.length; i += 2) {
                const row = [];
                row.push({ text: categories[i].attribute_data.name.chopar.ru });
                
                if (i + 1 < categories.length) {
                    row.push({ text: categories[i + 1].attribute_data.name.chopar.ru });
                }
                
                keyboard.push(row);
            }
            
            // Добавляем кнопку "Назад"
            keyboard.push([{ text: ctx.i18n.t('menu.back') }]);
            
            await ctx.reply(ctx.i18n.t('select_category'), {
                reply_markup: {
                    keyboard: keyboard,
                    resize_keyboard: true
                }
            });
            
            // Сохраняем данные о категориях и предыдущее действие в сессии пользователя
            const previousAction = ctx.session?.lastAction;
            
            ctx.updateSession({
                availableCategories: categories,
                previousAction: previousAction,
                lastAction: 'categories_list_shown',
                lastActionTime: new Date().toISOString()
            });
        } else {
            await ctx.reply(ctx.i18n.t('error.categories_load_failed'));
        }
    } catch (error) {
        console.error('Error displaying categories:', error);
        await ctx.reply(ctx.i18n.t('error.categories_load_failed'));
    }
} 