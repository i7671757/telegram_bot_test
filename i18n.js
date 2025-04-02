import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import TelegrafI18n from 'telegraf-i18n';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const i18n = new TelegrafI18n({
    directory: join(__dirname, 'locales'),
    defaultLanguage: 'en',
    sessionName: 'i18n',
    useSession: true,
    allowMissing: true,
    fallbackToDefaultLanguage: true
});

export default i18n; 