import { Telegraf, Markup } from 'telegraf';
import { config } from 'dotenv';
import { handleBranchSelection, handleBranchCallback } from './src/commands/branches.js';

config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Команда для показа главного меню
bot.command('start', async (ctx) => {
    const keyboard = Markup.keyboard([
        ['🏪 Выбрать филиал'],
        ['🛍 Заказать', '📱 Контакты']
    ]).resize();
    
    await ctx.reply('Добро пожаловать в Les Ailes! Выберите действие:', keyboard);
});

// Обработка нажатия на кнопку "Выбрать филиал"
bot.hears('🏪 Выбрать филиал', handleBranchSelection);

// Обработка выбора конкретного филиала
bot.action(/^select_branch_\d+$/, handleBranchCallback);

// Обработка кнопки "Назад к филиалам"
bot.action('show_branches', handleBranchSelection);

// Обработка кнопки "Назад в главное меню"
bot.action('back_to_menu', async (ctx) => {
    await ctx.deleteMessage();
    const keyboard = Markup.keyboard([
        ['🏪 Выбрать филиал'],
        ['🛍 Заказать', '📱 Контакты']
    ]).resize();
    await ctx.reply('Выберите действие:', keyboard);
});

// Запуск бота
bot.launch().then(() => {
    console.log('Bot started successfully');
}).catch((err) => {
    console.error('Error starting bot:', err);
});

// Включаем graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 