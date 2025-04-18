import logger from '../utils/logger.js';
import { updateSession, getPreviousState, updateSceneInfo } from '../utils/sessionStorage.js';

// Middleware для управления сессиями и отслеживания сцен
const sessionMiddleware = async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return next();
  
  // Инициализируем сессию, если она не существует
  if (!ctx.session) {
    ctx.session = { 
      languageCode: 'en', 
      navigationHistory: [],
      currentScene: null
    };
  }
  
  // Добавляем методы для работы с сессией
  ctx.updateSession = async (data) => {
    ctx.session = await updateSession(userId, data);
    return ctx.session;
  };
  
  ctx.getPreviousState = async () => {
    return await getPreviousState(userId);
  };
  
  // Метод для сохранения информации о текущей сцене
  ctx.saveSceneInfo = async (sceneName, sceneData = {}) => {
    const updatedData = await updateSceneInfo(userId, sceneName, sceneData);
    if (updatedData) {
      // Синхронизируем текущую сессию с сохраненными данными
      ctx.session.currentScene = sceneName;
      ctx.session.sceneData = ctx.session.sceneData || {};
      ctx.session.sceneData[sceneName] = {
        ...(ctx.session.sceneData[sceneName] || {}),
        ...sceneData,
        lastAccessed: new Date().toISOString()
      };
    }
    return updatedData;
  };
  
  // Отслеживание изменений сцены
  const originalEnter = ctx.scene?.enter;
  if (originalEnter) {
    ctx.scene.enter = async (sceneName, ...args) => {
      try {
        // Сохраняем информацию о входе в новую сцену
        await updateSceneInfo(userId, sceneName, {
          entered: true,
          enterTime: new Date().toISOString(),
          previousScene: ctx.session.currentScene
        });
        
        // Обновляем текущую сцену в сессии
        ctx.session.currentScene = sceneName;
        ctx.session.sceneEnterTime = new Date().toISOString();
        
        logger.info(`Пользователь ${userId} вошел в сцену ${sceneName}`);
        
        // Вызываем оригинальный метод
        return await originalEnter.call(ctx.scene, sceneName, ...args);
      } catch (error) {
        logger.error(`Ошибка при входе в сцену ${sceneName} для пользователя ${userId}:`, error);
        throw error;
      }
    };
  }
  
  // Отслеживание выхода из сцены
  const originalLeave = ctx.scene?.leave;
  if (originalLeave) {
    ctx.scene.leave = async (...args) => {
      const currentScene = ctx.session.currentScene;
      try {
        if (currentScene) {
          // Сохраняем информацию о выходе из сцены
          const enterTime = ctx.session.sceneEnterTime 
            ? new Date(ctx.session.sceneEnterTime).getTime() 
            : null;
            
          const timeSpent = enterTime 
            ? Math.floor((Date.now() - enterTime) / 1000) 
            : null;
            
          await updateSceneInfo(userId, currentScene, {
            left: true,
            leaveTime: new Date().toISOString(),
            timeSpent: timeSpent
          });
          
          logger.info(`Пользователь ${userId} вышел из сцены ${currentScene}${timeSpent ? ` (время в сцене: ${timeSpent}с)` : ''}`);
        }
        
        // Вызываем оригинальный метод
        return await originalLeave.call(ctx.scene, ...args);
      } catch (error) {
        logger.error(`Ошибка при выходе из сцены ${currentScene} для пользователя ${userId}:`, error);
        throw error;
      }
    };
  }
  
  // i18n mavjudligini tekshirish
  if (ctx.session.languageCode && ctx.i18n) {
    try {
      ctx.i18n.locale(ctx.session.languageCode);
    } catch (error) {
      logger.warn(`i18n locale o'rnatishda xatolik: ${error.message}`);
    }
  }
  
  return next();
};

export default sessionMiddleware; 