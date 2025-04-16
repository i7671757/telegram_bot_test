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
            return {};
        }
        logger.error('Error loading sessions:', error);
        return {};
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
    const currentSession = sessions[userId] || { languageCode: 'en', navigationHistory: [] };
    
    // Если есть информация о последнем действии, добавляем его в историю навигации
    if (updateData.lastAction && !updateData.isGoingBack) {
        const navigationHistory = [...(currentSession.navigationHistory || [])];
        
        // Сохраняем текущее состояние перед переходом
        const currentState = {
            action: currentSession.lastAction,
            data: {
                languageCode: currentSession.languageCode,
                selectedCity: currentSession.selectedCity,
                selectedBranch: currentSession.selectedBranch,
                lastAction: currentSession.lastAction,
                previousAction: currentSession.previousAction
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
            ...updateData,
            previousAction: currentSession.lastAction 
        };
        sessions[userId] = updatedSession;
    } else {
        // При возврате назад обновляем только необходимые поля
        sessions[userId] = {
            ...currentSession,
            lastAction: updateData.lastAction,
            lastActionTime: updateData.lastActionTime
        };
    }
    
    await saveSessions(sessions);
    return sessions[userId];
}

// Получение предыдущего состояния
async function getPreviousState(userId) {
    try {
        const sessions = await loadSessions();
        const session = sessions[userId];
        
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
        sessions[userId] = { 
            ...session, 
            navigationHistory,
            isGoingBack: true
        };
        
        await saveSessions(sessions);
        return previousState;
    } catch (error) {
        logger.error(`Ошибка при получении предыдущего состояния для пользователя ${userId}`, error);
        return null;
    }
}

export { updateSession, getPreviousState }; 