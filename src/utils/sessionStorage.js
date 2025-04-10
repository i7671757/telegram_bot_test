import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_FILE = path.join(__dirname, '../../sessions.json');

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
    const currentSession = sessions[userId] || { language: 'ru', navigationHistory: [] };
    
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
    sessions[userId] = updatedSession;
    await saveSessions(sessions);
    return updatedSession;
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