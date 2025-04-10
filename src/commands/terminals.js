import { Markup } from 'telegraf';

/**
 * Fetches all terminals from the Les Ailes API
 * @returns {Promise<Array>} Array of terminal objects
 */
export async function fetchTerminals() {
    try {
        const response = await fetch('https://api.lesailes.uz/api/terminals');
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        }
        return null;
    } catch (error) {
        console.error('Error fetching terminals:', error);
        return null;
    }
}

/**
 * Handles the command to display all terminals information
 */
export async function handleTerminalsCommand(ctx) {
    try {
        // First, show a loading message
        const loadingMsg = await ctx.reply('🔄 Загружаю информацию о терминалах...');
        
        const terminals = await fetchTerminals();
        
        if (!terminals || terminals.length === 0) {
            await ctx.telegram.editMessageText(
                ctx.chat.id, 
                loadingMsg.message_id, 
                undefined, 
                '❌ Не удалось получить информацию о терминалах.'
            );
            return;
        }
        
        // Count active and inactive terminals
        const activeTerminals = terminals.filter(t => t.active).length;
        const inactiveTerminals = terminals.filter(t => !t.active).length;
        
        const message = `📊 *Информация о терминалах Les Ailes*\n\n` +
            `Всего терминалов: ${terminals.length}\n` +
            `✅ Активных: ${activeTerminals}\n` +
            `❌ Неактивных: ${inactiveTerminals}\n\n` +
            `Выберите действие:`;
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('📋 Список активных терминалов', 'show_active_terminals')],
            [Markup.button.callback('🗺 Терминалы на карте', 'show_terminals_map')],
            [Markup.button.callback('📊 Подробная статистика', 'show_terminals_stats')],
            [Markup.button.callback('⬅️ Вернуться в меню', 'back_to_menu')]
        ]);
        
        await ctx.telegram.editMessageText(
            ctx.chat.id, 
            loadingMsg.message_id, 
            undefined, 
            message, 
            {
                parse_mode: 'Markdown',
                ...keyboard
            }
        );
    } catch (error) {
        console.error('Error in handleTerminalsCommand:', error);
        await ctx.reply('❌ Произошла ошибка при получении информации о терминалах.');
    }
}

/**
 * Handles showing the list of active terminals
 */
export async function handleShowActiveTerminals(ctx) {
    try {
        await ctx.answerCbQuery();
        
        const terminals = await fetchTerminals();
        
        if (!terminals || terminals.length === 0) {
            await ctx.editMessageText('❌ Не удалось получить информацию о терминалах.', { parse_mode: 'Markdown' });
            return;
        }
        
        const activeTerminals = terminals.filter(t => t.active);
        
        if (activeTerminals.length === 0) {
            await ctx.editMessageText('❌ Активные терминалы не найдены.', { parse_mode: 'Markdown' });
            return;
        }
        
        // Create paginated keyboard for terminals
        await showTerminalsPagination(ctx, activeTerminals, 0);
        
    } catch (error) {
        console.error('Error in handleShowActiveTerminals:', error);
        await ctx.editMessageText('❌ Произошла ошибка при получении списка активных терминалов.');
    }
}

/**
 * Shows paginated terminals
 * @param {Object} ctx - Telegram context
 * @param {Array} terminals - List of terminals to paginate
 * @param {Number} page - Current page number (0-based)
 */
async function showTerminalsPagination(ctx, terminals, page = 0) {
    const TERMINALS_PER_PAGE = 5;
    const totalPages = Math.ceil(terminals.length / TERMINALS_PER_PAGE);
    
    // Get terminals for current page
    const start = page * TERMINALS_PER_PAGE;
    const end = start + TERMINALS_PER_PAGE;
    const pageTerminals = terminals.slice(start, end);
    
    // Build message with terminals
    let message = `📋 *Активные терминалы* (${start + 1}-${Math.min(end, terminals.length)} из ${terminals.length})\n\n`;
    
    pageTerminals.forEach((terminal, idx) => {
        message += `${start + idx + 1}. *${terminal.name || 'Без названия'}*\n`;
        if (terminal.desc) message += `📍 Адрес: ${terminal.desc}\n`;
        message += `🌆 Город ID: ${terminal.city_id}\n`;
        message += `🚚 Доставка: ${terminal.delivery_type === 'all' ? 'Доступна' : terminal.delivery_type === 'pickup' ? 'Только самовывоз' : 'Нет информации'}\n\n`;
    });
    
    // Build pagination keyboard
    const keyboard = [];
    
    // Add pagination buttons
    const paginationRow = [];
    if (page > 0) {
        paginationRow.push(Markup.button.callback('◀️', `terminals_page_${page - 1}`));
    }
    
    paginationRow.push(Markup.button.callback(`${page + 1}/${totalPages}`, 'noop'));
    
    if (page < totalPages - 1) {
        paginationRow.push(Markup.button.callback('▶️', `terminals_page_${page + 1}`));
    }
    
    if (paginationRow.length > 0) {
        keyboard.push(paginationRow);
    }
    
    // Add action buttons
    keyboard.push([Markup.button.callback('🔍 Детали терминала', 'show_terminal_details')]);
    keyboard.push([Markup.button.callback('⬅️ Назад', 'show_terminals_menu')]);
    
    await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(keyboard)
    });
}

/**
 * Handles pagination for terminals
 */
export async function handleTerminalsPagination(ctx) {
    try {
        await ctx.answerCbQuery();
        
        const match = ctx.callbackQuery.data.match(/terminals_page_(\d+)/);
        if (!match) return;
        
        const page = parseInt(match[1], 10);
        const terminals = await fetchTerminals();
        
        if (!terminals) {
            await ctx.editMessageText('❌ Не удалось получить информацию о терминалах.');
            return;
        }
        
        const activeTerminals = terminals.filter(t => t.active);
        await showTerminalsPagination(ctx, activeTerminals, page);
        
    } catch (error) {
        console.error('Error in handleTerminalsPagination:', error);
        await ctx.reply('❌ Произошла ошибка при навигации по списку терминалов.');
    }
}

/**
 * Handles returning to terminals menu
 */
export async function handleShowTerminalsMenu(ctx) {
    try {
        await ctx.answerCbQuery();
        await handleTerminalsCommand(ctx);
    } catch (error) {
        console.error('Error in handleShowTerminalsMenu:', error);
        await ctx.reply('❌ Произошла ошибка при возврате в меню терминалов.');
    }
}

/**
 * Handles showing terminals map (summary)
 */
export async function handleShowTerminalsMap(ctx) {
    try {
        await ctx.answerCbQuery();
        
        const terminals = await fetchTerminals();
        
        if (!terminals || terminals.length === 0) {
            await ctx.editMessageText('❌ Не удалось получить информацию о терминалах.');
            return;
        }
        
        const activeTerminals = terminals.filter(t => t.active && t.latitude && t.longitude);
        
        if (activeTerminals.length === 0) {
            await ctx.editMessageText('❌ Терминалы с координатами не найдены.', {
                ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад', 'show_terminals_menu')]])
            });
            return;
        }
        
        const message = `🗺 *Терминалы с координатами*\n\nВсего терминалов с координатами: ${activeTerminals.length}\n\nВыберите терминал для просмотра на карте:`;
        
        // Create keyboard with terminals (paginated if needed)
        const keyboard = [];
        
        // Display first 10 terminals to avoid huge keyboards
        const terminalsToShow = activeTerminals.slice(0, 10);
        
        terminalsToShow.forEach(terminal => {
            keyboard.push([
                Markup.button.callback(
                    `📍 ${terminal.name || 'Терминал ' + terminal.id}`, 
                    `show_map_${terminal.id}`
                )
            ]);
        });
        
        if (activeTerminals.length > 10) {
            keyboard.push([Markup.button.callback('🔄 Показать больше', 'show_more_terminals')]);
        }
        
        keyboard.push([Markup.button.callback('⬅️ Назад', 'show_terminals_menu')]);
        
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(keyboard)
        });
    } catch (error) {
        console.error('Error in handleShowTerminalsMap:', error);
        await ctx.reply('❌ Произошла ошибка при отображении карты терминалов.');
    }
}

/**
 * Handles showing a specific terminal on map
 */
export async function handleShowMapTerminal(ctx) {
    try {
        await ctx.answerCbQuery();
        
        const match = ctx.callbackQuery.data.match(/show_map_(\d+)/);
        if (!match) return;
        
        const terminalId = parseInt(match[1], 10);
        const terminals = await fetchTerminals();
        
        if (!terminals) {
            await ctx.editMessageText('❌ Не удалось получить информацию о терминалах.');
            return;
        }
        
        const terminal = terminals.find(t => t.id === terminalId);
        
        if (!terminal || !terminal.latitude || !terminal.longitude) {
            await ctx.editMessageText('❌ Терминал не найден или координаты отсутствуют.');
            return;
        }
        
        // Send location directly
        await ctx.deleteMessage();
        await ctx.sendLocation(terminal.latitude, terminal.longitude);
        
        const infoMessage = `📍 *${terminal.name || 'Терминал ' + terminal.id}*\n\n` +
            (terminal.desc ? `Адрес: ${terminal.desc}\n` : '') +
            `Город ID: ${terminal.city_id}\n` +
            `Тип доставки: ${terminal.delivery_type === 'all' ? 'Доступна' : terminal.delivery_type === 'pickup' ? 'Только самовывоз' : 'Нет информации'}`;
        
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Назад к карте', 'show_terminals_map')],
            [Markup.button.callback('⬅️ В меню терминалов', 'show_terminals_menu')]
        ]);
        
        await ctx.reply(infoMessage, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    } catch (error) {
        console.error('Error in handleShowMapTerminal:', error);
        await ctx.reply('❌ Произошла ошибка при отображении терминала на карте.');
    }
}

/**
 * Handles showing terminals statistics
 */
export async function handleShowTerminalsStats(ctx) {
    try {
        await ctx.answerCbQuery();
        
        const terminals = await fetchTerminals();
        
        if (!terminals || terminals.length === 0) {
            await ctx.editMessageText('❌ Не удалось получить информацию о терминалах.');
            return;
        }
        
        // Calculate statistics
        const activeTerminals = terminals.filter(t => t.active).length;
        const inactiveTerminals = terminals.filter(t => !t.active).length;
        const withCoordinates = terminals.filter(t => t.latitude && t.longitude).length;
        const withDelivery = terminals.filter(t => t.delivery_type === 'all').length;
        const withPickupOnly = terminals.filter(t => t.delivery_type === 'pickup').length;
        
        // Count terminals by city
        const cityCounts = {};
        terminals.forEach(terminal => {
            if (terminal.city_id) {
                cityCounts[terminal.city_id] = (cityCounts[terminal.city_id] || 0) + 1;
            }
        });
        
        // Format city statistics
        let cityStats = '';
        Object.entries(cityCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by count (descending)
            .forEach(([cityId, count]) => {
                cityStats += `  Город ID ${cityId}: ${count} терминалов\n`;
            });
        
        // Build message
        const message = `📊 *Статистика терминалов Les Ailes*\n\n` +
            `Всего терминалов: ${terminals.length}\n` +
            `✅ Активных: ${activeTerminals}\n` +
            `❌ Неактивных: ${inactiveTerminals}\n` +
            `🗺 С координатами: ${withCoordinates}\n` +
            `🚚 С доставкой: ${withDelivery}\n` +
            `🏃 Только самовывоз: ${withPickupOnly}\n\n` +
            `*Распределение по городам:*\n${cityStats}`;
        
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ Назад в меню', 'show_terminals_menu')]
            ])
        });
    } catch (error) {
        console.error('Error in handleShowTerminalsStats:', error);
        await ctx.reply('❌ Произошла ошибка при отображении статистики терминалов.');
    }
} 