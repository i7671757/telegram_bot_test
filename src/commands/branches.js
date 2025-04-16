import { Markup } from 'telegraf';
import logger from '../utils/logger.js';

/**
 * Gets the appropriate branch name based on language code
 * @param {Object} branch - Branch object
 * @param {string} languageCode - User's language preference
 * @returns {string} - Branch name in the appropriate language
 */
function getBranchName(branch, languageCode) {
    // console.log('Getting branch name for language:', languageCode);
    // console.log('Branch data:', branch);
    
    switch (languageCode) {
        case 'uz':
            return branch.name_uz || branch.name;
        case 'en':
            return branch.name_en || branch.name;
        default:
            return branch.name;
    }
}

export async function getBranchesKeyboard(ctx, cityId = null) {
    try {
        const response = await fetch('https://api.lesailes.uz/api/terminals');
        const data = await response.json();
        
        if (data.success) {
            // Фильтруем только активные филиалы
            let branches = data.data.filter(terminal => terminal.active);
            
            // Если передан cityId, фильтруем по нему
            if (cityId) {
                // Маппинг названий городов на их ID
                const cityMapping = {
                    'tashkent': 2,
                    'samarkand': 3,
                    'bukhara': 4
                };
                const numericCityId = cityMapping[cityId];
                if (numericCityId) {
                    branches = branches.filter(branch => branch.city_id === numericCityId);
                }
            }

            // Get user's language preference
            const userLanguage = ctx.session?.languageCode || 'ru';
            console.log('User language in getBranchesKeyboard:', userLanguage);
            
            // Create keyboard
            const keyboard = [];
            for (let i = 0; i < branches.length; i += 2) {
                const row = [];
                const branchName1 = getBranchName(branches[i], userLanguage);
                row.push({ text: branchName1 });
                
                if (i + 1 < branches.length) {
                    const branchName2 = getBranchName(branches[i + 1], userLanguage);
                    row.push({ text: branchName2 });
                }
                
                keyboard.push(row);
            }
            
            return keyboard;
        }
        return null;
    } catch (error) {
        console.error('Error fetching branches:', error);
        return null;
    }
}

export async function handleBranchSelection(ctx) {
    try {
        // Получаем название города из сессии, если оно есть
        const cityId = ctx.session?.selectedCity || null;
        
        // Get user's language preference
        const userLanguage = ctx.session?.languageCode || 'uz';
        console.log('User language in handleBranchSelection:', userLanguage);
        
        // Получаем филиалы с фильтрацией по городу, если указан
        const keyboard = await getBranchesKeyboard(ctx, cityId);
        
        if (keyboard && keyboard.length > 0) {
            // Добавляем кнопку "Назад"
            keyboard.push([{ text: ctx.i18n.t('menu.back') }]);
            
            await ctx.reply(ctx.i18n.t('select_branch'), {
                reply_markup: {
                    keyboard: keyboard,
                    resize_keyboard: true
                }
            });
            
            // Сохраняем только предыдущее действие
            const previousAction = ctx.session?.lastAction;
            
            ctx.session = {
                ...ctx.session,
                previousAction: previousAction,
                lastAction: 'branches_list_shown',
                lastActionTime: new Date().toISOString(),
                languageCode: userLanguage // Сохраняем язык в сессии
            };
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
                // Get user's language preference
                const userLanguage = ctx.session?.languageCode || 'uz';
                console.log('User language:', userLanguage);
                console.log('Branch data:', branch);
                
                // Get localized branch name and description
                const branchName = getBranchName(branch, userLanguage);
                const branchDesc = userLanguage === 'uz' ? branch.desc_uz : 
                                 userLanguage === 'en' ? branch.desc_en : 
                                 branch.desc;
                
                console.log('Localized branch name:', branchName);
                console.log('Localized branch description:', branchDesc);
                
                // Get localized delivery type text
                const deliveryText = {
                    ru: {
                        all: '🚗 Доступна доставка',
                        pickup: '🏃 Только самовывоз'
                    },
                    uz: {
                        all: '🚗 Yetkazib berish mavjud',
                        pickup: '🏃 Faqat o\'z-o\'zidan olish'
                    },
                    en: {
                        all: '🚗 Delivery available',
                        pickup: '🏃 Pickup only'
                    }
                };
                
                let message = `${branchName}\n`;
                if (branchDesc) message += `${branchDesc}\n`;
                if (branch.delivery_type === 'all') {
                    message += `${deliveryText[userLanguage].all}\n`;
                } else if (branch.delivery_type === 'pickup') {
                    message += `${deliveryText[userLanguage].pickup}\n`;
                }
                
                console.log('Final message branches.js:', message);
                
                // Формируем объект филиала с правильным форматом location
                const branchWithLocation = {
                    ...branch,
                    location: {
                        lat: branch.latitude || "",
                        lon: branch.longitude || ""
                    }
                };
                
                // Сохраняем все данные о выбранном филиале
                ctx.session = {
                    ...ctx.session,
                    selectedBranch: branchWithLocation,
                    lastAction: 'branch_selected',
                    lastActionTime: new Date().toISOString()
                };

                // Сначала отправляем информацию о выбранном филиале
                await ctx.reply(message);
                
                // Сразу после отображения информации о филиале показываем меню категорий
                await ctx.reply(ctx.i18n.t('menu_categories.title'), {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [
                            [
                                { text: ctx.i18n.t('menu_categories.back') },
                                { text: ctx.i18n.t('menu_categories.basket') }
                            ],
                            [{ text: ctx.i18n.t('menu_categories.sets') }],
                            [{ text: ctx.i18n.t('menu_categories.snacks') }],
                            [{ text: ctx.i18n.t('menu_categories.burgers') }],
                            [{ text: ctx.i18n.t('menu_categories.chicken') }]
                            
                        ],
                        resize_keyboard: true
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error handling branch selection:', error);
        await ctx.reply('Произошла ошибка при выборе филиала. Попробуйте позже.');
    }
}

// Вспомогательная функция для получения названия категории на нужном языке
function getCategoryName(category, language) {
    if (!category.attribute_data?.name?.chopar) {
        return 'Unknown';
    }
    
    switch (language) {
        case 'uz':
            return category.attribute_data.name.chopar.uz || category.attribute_data.name.chopar.ru;
        case 'en':
            return category.attribute_data.name.chopar.en || category.attribute_data.name.chopar.ru;
        default:
            return category.attribute_data.name.chopar.ru;
    }
}

// Вспомогательная функция для получения локализованного текста
function getLocalizedText(key, language) {
    const texts = {
        back: {
            ru: 'Назад',
            uz: 'Ortga',
            en: 'Back'
        },
        cart: {
            ru: 'Корзина',
            uz: 'Savat',
            en: 'Cart'
        },
        select_category: {
            ru: 'Выберите категорию:',
            uz: 'Kategoriyani tanlang:',
            en: 'Select category:'
        },
        categories_load_error: {
            ru: 'Извините, не удалось загрузить категории. Попробуйте позже.',
            uz: 'Kechirasiz, kategoriyalarni yuklab bolmadi. Keyinroq qayta urinib koring.',
            en: 'Sorry, failed to load categories. Please try again later.'
        },
        branch_selection_error: {
            ru: 'Произошла ошибка при выборе филиала. Попробуйте позже.',
            uz: 'Filial tanlashda xatolik yuz berdi. Keyinroq qayta urinib koring.',
            en: 'An error occurred while selecting the branch. Please try again later.'
        }
    };
    
    return texts[key]?.[language] || texts[key]?.ru || texts[key]?.en || key;
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
            
            ctx.session = {
                ...ctx.session,
                availableCategories: categories,
                previousAction: previousAction,
                lastAction: 'categories_list_shown',
                lastActionTime: new Date().toISOString()
            };
        } else {
            await ctx.reply(ctx.i18n.t('error.categories_load_failed'));
        }
    } catch (error) {
        console.error('Error displaying categories:', error);
        await ctx.reply(ctx.i18n.t('error.categories_load_failed'));
    }
} 