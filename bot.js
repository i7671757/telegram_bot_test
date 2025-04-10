import { Telegraf, Markup } from 'telegraf';
import { config } from 'dotenv';
import { handleBranchSelection, handleBranchCallback } from './src/commands/branches.js';
import { 
    handleTerminalsCommand,
    handleShowActiveTerminals,
    handleTerminalsPagination,
    handleShowTerminalsMenu,
    handleShowTerminalsMap,
    handleShowMapTerminal,
    handleShowTerminalsStats
} from './src/commands/terminals.js';

config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Команда для показа главного меню
bot.command('start', async (ctx) => {
    const keyboard = Markup.keyboard([
        ['🏪 Выбрать филиал'],
        ['📊 Информация о терминалах'],
        ['🛍 Заказать', '📱 Контакты']
    ]).resize();
    
    await ctx.reply('Добро пожаловать в Les Ailes! Выберите действие:', keyboard);
});

// Обработка нажатия на кнопку "Выбрать филиал"
bot.hears('🏪 Выбрать филиал', handleBranchSelection);

// Обработка нажатия на кнопку "Информация о терминалах"
bot.hears('📊 Информация о терминалах', handleTerminalsCommand);
bot.command('terminals', handleTerminalsCommand);

// Обработка выбора конкретного филиала
bot.action(/^select_branch_\d+$/, handleBranchCallback);

// Обработка кнопки "Назад к филиалам"
bot.action('show_branches', handleBranchSelection);

// Обработка кнопки "Назад в главное меню"
bot.action('back_to_menu', async (ctx) => {
    await ctx.deleteMessage();
    const keyboard = Markup.keyboard([
        ['🏪 Выбрать филиал'],
        ['📊 Информация о терминалах'],
        ['🛍 Заказать', '📱 Контакты']
    ]).resize();
    await ctx.reply('Выберите действие:', keyboard);
});

// Обработчики для работы с терминалами
bot.action('show_active_terminals', handleShowActiveTerminals);
bot.action(/^terminals_page_\d+$/, handleTerminalsPagination);
bot.action('show_terminals_menu', handleShowTerminalsMenu);
bot.action('show_terminals_map', handleShowTerminalsMap);
bot.action(/^show_map_\d+$/, handleShowMapTerminal);
bot.action('show_terminals_stats', handleShowTerminalsStats);
bot.action('noop', (ctx) => ctx.answerCbQuery());

// Запуск бота
bot.launch().then(() => {
    console.log('Bot started successfully');
}).catch((err) => {
    console.error('Error starting bot:', err);
});

// Включаем graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 