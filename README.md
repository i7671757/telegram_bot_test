# Telegram Bot для Les Ailes

Telegram бот для сервиса доставки Les Ailes с функциями выбора языка, города и филиала.

## Структура проекта

```
telegram-bot/
├── src/
│   ├── config/         # Конфигурационные файлы
│   ├── handlers/       # Обработчики сообщений и команд
│   ├── middleware/     # Middleware функции
│   ├── utils/          # Утилиты
│   ├── locales/        # Файлы локализации
│   └── index.js        # Точка входа
├── .env                # Переменные окружения
├── package.json
└── README.md
```

## Функциональность

- Мультиязычный интерфейс (русский, узбекский, английский)
- Выбор города
- Выбор филиала в выбранном городе
- Сохранение состояния пользователя
- Подробное логирование действий и ошибок

## Установка и запуск

1. Установите зависимости:
```
npm install
```

2. Создайте файл `.env` и добавьте необходимые переменные:
```
TELEGRAM_TOKEN=your_telegram_token_here
DEBUG=true  # Включение режима отладки
```

3. Запустите бота:
```
npm start
```

Для разработки используйте:
```
npm run dev
```

## Логирование и отладка

Бот имеет встроенную систему логирования с разными уровнями:

- `logger.info()` - Информационные сообщения
- `logger.success()` - Успешные операции
- `logger.warn()` - Предупреждения
- `logger.error()` - Ошибки
- `logger.debug()` - Отладочные сообщения (выводятся только при DEBUG=true)

Для включения отладочных сообщений установите в файле `.env`:
```
DEBUG=true
```

## Команды бота

- `/start` - Начать работу с ботом
- `/language` - Изменить язык
- `/session` - Посмотреть данные сессии
- `/reset` - Сбросить настройки 