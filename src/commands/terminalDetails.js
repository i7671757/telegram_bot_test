import { Markup } from 'telegraf';
import { fetchTerminals } from './terminals.js';

/**
 * Handles showing detailed information about a specific terminal
 */
export async function handleShowTerminalDetails(ctx) {
    try {
        await ctx.answerCbQuery();
        
        // First, ask for terminal ID
        const message = `🔍 *Просмотр деталей терминала*\n\n` +
            `Введите ID терминала для просмотра детальной информации о нем.`;
            
        // Create new message with a text input prompt
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ Назад', 'show_active_terminals')]
            ])
        });
        
        // Set flag in session to handle next message as terminal ID
        ctx.session = ctx.session || {};
        ctx.session.waitingForTerminalId = true;
    } catch (error) {
        console.error('Error in handleShowTerminalDetails:', error);
        await ctx.reply('❌ Произошла ошибка при запросе деталей терминала.');
    }
}

/**
 * Handles text input for terminal ID
 */
export async function handleTerminalIdInput(ctx, next) {
    // Check if we're waiting for terminal ID
    if (ctx.session?.waitingForTerminalId) {
        // Reset flag
        ctx.session.waitingForTerminalId = false;
        
        const terminalId = ctx.message.text.trim();
        
        // Check if input is a number
        if (!/^\d+$/.test(terminalId)) {
            await ctx.reply('❌ Пожалуйста, введите корректный ID терминала (только цифры).');
            return;
        }
        
        await showTerminalDetails(ctx, parseInt(terminalId, 10));
        return;
    }
    
    // Pass to next middleware if not handling terminal ID
    return next();
}

/**
 * Shows detailed information about a terminal
 */
async function showTerminalDetails(ctx, terminalId) {
    try {
        const terminals = await fetchTerminals();
        
        if (!terminals) {
            await ctx.reply('❌ Не удалось получить информацию о терминалах.');
            return;
        }
        
        const terminal = terminals.find(t => t.id === terminalId);
        
        if (!terminal) {
            await ctx.reply(`❌ Терминал с ID ${terminalId} не найден.`);
            return;
        }
        
        // Format terminal details
        let details = `🏪 *Детальная информация о терминале*\n\n`;
        details += `*ID*: ${terminal.id}\n`;
        details += `*Название*: ${terminal.name || 'Нет данных'}\n`;
        details += `*Адрес*: ${terminal.desc || 'Нет данных'}\n`;
        details += `*Город ID*: ${terminal.city_id || 'Нет данных'}\n`;
        details += `*Статус*: ${terminal.active ? '✅ Активен' : '❌ Неактивен'}\n`;
        details += `*Координаты*: ${terminal.latitude && terminal.longitude ? `${terminal.latitude}, ${terminal.longitude}` : 'Нет данных'}\n`;
        details += `*Тип доставки*: ${terminal.delivery_type === 'all' ? 'Доставка и самовывоз' : terminal.delivery_type === 'pickup' ? 'Только самовывоз' : 'Нет данных'}\n`;
        
        if (terminal.open_work && terminal.close_work) {
            details += `*Рабочие часы*: ${formatTime(terminal.open_work)} - ${formatTime(terminal.close_work)}\n`;
        }
        
        if (terminal.open_weekend && terminal.close_weekend) {
            details += `*Выходные часы*: ${formatTime(terminal.open_weekend)} - ${formatTime(terminal.close_weekend)}\n`;
        }
        
        if (terminal.delivery_distance) {
            details += `*Радиус доставки*: ${terminal.delivery_distance / 1000} км\n`;
        }
        
        details += `*Telegram группа*: ${terminal.tg_group || 'Нет данных'}\n`;
        details += `*Сервисы*: ${terminal.services || 'Нет данных'}\n\n`;
        
        // Payment methods
        details += `*Методы оплаты*:\n`;
        details += `- Payme: ${terminal.payme_active ? '✅' : '❌'}\n`;
        details += `- Click: ${terminal.click_active ? '✅' : '❌'}\n`;
        details += `- MyUzcard: ${terminal.my_uzcard_active ? '✅' : '❌'}\n`;
        
        // Add buttons
        const buttons = [];
        
        // Add location button if coordinates available
        if (terminal.latitude && terminal.longitude) {
            buttons.push([
                Markup.button.url(
                    '📍 Показать на карте',
                    `https://maps.google.com/?q=${terminal.latitude},${terminal.longitude}`
                )
            ]);
        }
        
        buttons.push([Markup.button.callback('⬅️ Назад к списку терминалов', 'show_active_terminals')]);
        
        await ctx.reply(details, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
        });
    } catch (error) {
        console.error('Error showing terminal details:', error);
        await ctx.reply('❌ Произошла ошибка при отображении информации о терминале.');
    }
}

/**
 * Format ISO time string to readable format
 */
function formatTime(isoString) {
    try {
        const date = new Date(isoString);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
        return 'Нет данных';
    }
} 