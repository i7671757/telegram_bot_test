import TelegrafI18n from 'telegraf-i18n';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// I18n konfiguratsiyasi
const i18n = new TelegrafI18n({
  defaultLanguage: 'uz',
  directory: path.resolve(__dirname, '../locales'),
  useSession: true,
  sessionName: 'session',
  allowMissing: true,
  fallbackToDefaultLanguage: true
});

export default i18n; 