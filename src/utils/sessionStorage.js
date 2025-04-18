import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_FILE = path.join(__dirname, '../../session.json');

// Создаем директорию для данных, если она не существует
async function ensureDataDirectory() {
    const dataDir = path.dirname(SESSION_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Загрузка сессий из файла
async function loadSessions() {
    try {
        await ensureDataDirectory();
        const data = await fs.readFile(SESSION_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Если файл не существует, создаем пустой объект
            return { sessions: [] };
        }
        logger.error('Error loading sessions:', error);
        return { sessions: [] };
    }
}

// Сохранение сессий в файл
async function saveSessions(sessions) {
    try {
        await ensureDataDirectory();
        await fs.writeFile(SESSION_FILE, JSON.stringify(sessions, null, 2));
    } catch (error) {
        logger.error('Error saving sessions:', error);
    }
}

// Обновление сессии
async function updateSession(userId, updateData) {
    const sessions = await loadSessions();
    
    // Преобразуем userId в строку и затем в формат telegraf-session-local
    const userIdStr = String(userId);
    const sessionId = userIdStr.includes(':') ? userIdStr : `${userIdStr}:${userIdStr}`;
    
    const currentSession = sessions.sessions.find(s => s.id === sessionId) || { 
        id: sessionId, 
        data: { 
            languageCode: 'en', 
            navigationHistory: [],
            currentScene: null
        } 
    };
    
    // Если есть информация о последнем действии, добавляем его в историю навигации
    if (updateData.lastAction && !updateData.isGoingBack) {
        const navigationHistory = [...(currentSession.data.navigationHistory || [])];
        
        // Сохраняем текущее состояние перед переходом
        const currentState = {
            action: currentSession.data.lastAction,
            scene: currentSession.data.currentScene,
            data: {
                languageCode: currentSession.data.languageCode,
                selectedCity: currentSession.data.selectedCity,
                selectedBranch: currentSession.data.selectedBranch,
                lastAction: currentSession.data.lastAction,
                previousAction: currentSession.data.previousAction
            }
        };
        
        // Добавляем в историю только если было какое-то действие и оно отличается от предыдущего
        if (currentState.action && 
            (!navigationHistory.length || 
             navigationHistory[navigationHistory.length - 1].action !== currentState.action)) {
            
            navigationHistory.push(currentState);
            
            // Ограничиваем историю до 5 записей
            if (navigationHistory.length > 5) {
                navigationHistory.shift();
            }
        }
        
        updateData.navigationHistory = navigationHistory;
    }
    
    // Если это возврат назад, не обновляем историю
    if (!updateData.isGoingBack) {
        const updatedSession = { 
            ...currentSession,
            data: {
                ...currentSession.data,
                ...updateData,
                previousAction: currentSession.data.lastAction
            }
        };
        
        // Обновляем или добавляем сессию
        const sessionIndex = sessions.sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex === -1) {
            sessions.sessions.push(updatedSession);
        } else {
            sessions.sessions[sessionIndex] = updatedSession;
        }
    } else {
        // При возврате назад обновляем только необходимые поля
        const sessionIndex = sessions.sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            sessions.sessions[sessionIndex] = {
                ...currentSession,
                data: {
                    ...currentSession.data,
                    lastAction: updateData.lastAction,
                    lastActionTime: updateData.lastActionTime
                }
            };
        }
    }
    
    await saveSessions(sessions);
    return sessions.sessions.find(s => s.id === sessionId)?.data;
}

// Получение предыдущего состояния
async function getPreviousState(userId) {
    try {
        const sessions = await loadSessions();
        
        // Преобразуем userId в строку и затем в формат telegraf-session-local
        const userIdStr = String(userId);
        const sessionId = userIdStr.includes(':') ? userIdStr : `${userIdStr}:${userIdStr}`;
        
        const session = sessions.sessions.find(s => s.id === sessionId);
        
        if (!session) {
            logger.warn(`Сессия не найдена для пользователя ${userId}`);
            return null;
        }
        
        if (!session.data.navigationHistory || session.data.navigationHistory.length === 0) {
            logger.debug(`История навигации пуста для пользователя ${userId}`);
            return null;
        }
        
        // Берем предыдущее состояние и удаляем его из истории
        const navigationHistory = [...session.data.navigationHistory];
        const previousState = navigationHistory.pop();
        
        // Проверяем валидность предыдущего состояния
        if (!previousState || !previousState.action) {
            logger.warn(`Некорректное предыдущее состояние для пользователя ${userId}`);
            return null;
        }
        
        // Обновляем историю в сессии
        const sessionIndex = sessions.sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            sessions.sessions[sessionIndex] = { 
                ...session,
                data: {
                    ...session.data,
                    navigationHistory,
                    isGoingBack: true
                }
            };
        }
        
        await saveSessions(sessions);
        return previousState;
    } catch (error) {
        logger.error(`Ошибка при получении предыдущего состояния для пользователя ${userId}`, error);
        return null;
    }
}

// Обновление информации о текущей сцене (работает с telegraf-session-local)
async function updateSceneInfo(userId, sceneName, sceneData = {}) {
    try {
        // Загружаем текущие данные сессии
        const sessions = await loadSessions();
        
        // Преобразуем userId в строку и затем в формат telegraf-session-local (userId:userId)
        const userIdStr = String(userId);
        const sessionId = userIdStr.includes(':') ? userIdStr : `${userIdStr}:${userIdStr}`;
        
        // Ищем сессию пользователя
        let currentSession = sessions.sessions.find(s => s.id === sessionId);
        
        // Если сессия не найдена, создаем новую
        if (!currentSession) {
            logger.info(`Sessiya topilmadi, ${userId} uchun yangi sessiya yaratilmoqda`);
            currentSession = {
                id: sessionId,
                data: {
                    languageCode: 'uz',
                    navigationHistory: [],
                    currentScene: null,
                    sceneData: {}
                }
            };
            sessions.sessions.push(currentSession);
        }
        
        // Инициализируем объект sceneData если его нет
        if (!currentSession.data.sceneData) {
            currentSession.data.sceneData = {};
        }
        
        // Обновляем информацию о текущей сцене
        const updatedSession = {
            ...currentSession,
            data: {
                ...currentSession.data,
                currentScene: sceneName,
                lastAction: sceneData.action || 'enter_scene',
                lastActionTime: new Date().toISOString(),
                sceneData: {
                    ...currentSession.data.sceneData,
                    [sceneName]: {
                        ...((currentSession.data.sceneData && currentSession.data.sceneData[sceneName]) || {}),
                        ...sceneData,
                        lastAccessed: new Date().toISOString()
                    }
                }
            }
        };
        
        // Обновляем сессию
        const sessionIndex = sessions.sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            sessions.sessions[sessionIndex] = updatedSession;
        } else {
            sessions.sessions.push(updatedSession);
        }
        
        await saveSessions(sessions);
        logger.info(`Обновлена информация о сцене ${sceneName} для пользователя ${userId}`);
        return updatedSession.data;
    } catch (error) {
        logger.error(`Ошибка при обновлении информации о сцене ${sceneName} для пользователя ${userId}`, error);
        return null;
    }
}

export { updateSession, getPreviousState, updateSceneInfo }; 