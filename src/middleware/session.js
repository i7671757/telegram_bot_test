import logger from '../utils/logger.js';

// Хранилище сессий (в памяти)
const sessions = new Map();

// Функция для обновления сессии пользователя
function updateSession(userId, updateData) {
  const currentSession = sessions.get(userId) || { language: 'ru', navigationHistory: [] };
  
  // Если есть информация о последнем действии, добавляем его в историю навигации
  if (updateData.lastAction && !updateData.isGoingBack) {
    const navigationHistory = [...(currentSession.navigationHistory || [])];
    
    // Сохраняем текущее состояние перед переходом
    const currentState = {
      action: currentSession.lastAction,
      data: {
        language: currentSession.language,
        selectedCity: currentSession.selectedCity,
        selectedBranch: currentSession.selectedBranch,
        previousAction: updateData.lastAction
      }
    };
    
    // Добавляем в историю только если было какое-то действие
    if (currentState.action) {
      navigationHistory.push(currentState);
      
      // Ограничиваем историю до 10 записей
      if (navigationHistory.length > 10) {
        navigationHistory.shift();
      }
      
      updateData.navigationHistory = navigationHistory;
    }
  }
  
  const updatedSession = { ...currentSession, ...updateData };
  sessions.set(userId, updatedSession);
  return updatedSession;
}

// Функция для получения предыдущего состояния из истории навигации
function getPreviousState(userId) {
  try {
    const session = sessions.get(userId);
    if (!session) {
      logger.warn(`Сессия не найдена для пользователя ${userId}`);
      return null;
    }
    
    if (!session.navigationHistory || session.navigationHistory.length === 0) {
      logger.debug(`История навигации пуста для пользователя ${userId}`);
      return null;
    }
    
    // Берем предыдущее состояние и удаляем его из истории
    const navigationHistory = [...session.navigationHistory];
    const previousState = navigationHistory.pop();
    
    // Проверяем валидность предыдущего состояния
    if (!previousState || !previousState.action) {
      logger.warn(`Некорректное предыдущее состояние для пользователя ${userId}`);
      return null;
    }
    
    // Обновляем историю в сессии
    sessions.set(userId, { 
      ...session, 
      navigationHistory,
      isGoingBack: true
    });
    
    return previousState;
  } catch (error) {
    logger.error(`Ошибка при получении предыдущего состояния для пользователя ${userId}`, error);
    return null;
  }
}

// Middleware для управления сессиями
const sessionMiddleware = (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return next();
  
  if (!sessions.has(userId)) {
    sessions.set(userId, { language: 'ru', navigationHistory: [] });
  }
  
  ctx.session = sessions.get(userId);
  ctx.updateSession = (data) => {
    ctx.session = updateSession(userId, data);
    return ctx.session;
  };
  
  ctx.getPreviousState = () => {
    return getPreviousState(userId);
  };
  
  if (ctx.session.language) {
    ctx.i18n.locale(ctx.session.language);
  }
  
  return next();
};

export default sessionMiddleware; 