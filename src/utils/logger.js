/**
 * Простой логгер для вывода информации в консоль
 */
const logger = {
  // Цвета для консоли
  colors: {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
  },

  // Логирование информации
  info: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`${logger.colors.blue}[INFO]${logger.colors.reset} ${timestamp} - ${message}`);
  },

  // Логирование успешных операций
  success: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`${logger.colors.green}[SUCCESS]${logger.colors.reset} ${timestamp} - ${message}`);
  },

  // Логирование предупреждений
  warn: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`${logger.colors.yellow}[WARN]${logger.colors.reset} ${timestamp} - ${message}`);
  },

  // Логирование ошибок
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    console.error(`${logger.colors.red}[ERROR]${logger.colors.reset} ${timestamp} - ${message}`);
    if (error) {
      console.error(`${logger.colors.red}Stack:${logger.colors.reset} ${error.stack || error}`);
    }
  },

  // Логирование отладочной информации
  debug: (message, data) => {
    if (process.env.DEBUG === 'true') {
      const timestamp = new Date().toISOString();
      console.log(`${logger.colors.cyan}[DEBUG]${logger.colors.reset} ${timestamp} - ${message}`);
      if (data) {
        console.log(data);
      }
    }
  }
};

export default logger;
