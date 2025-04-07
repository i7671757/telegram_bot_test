import 'dotenv/config';

async function getTerminals() {
    try {
        const response = await fetch('https://api.lesailes.uz/api/terminals');
        const data = await response.json();
        
        if (data.success) {
            console.log('Всего терминалов:', data.data.length);
            console.log('\nСписок активных терминалов:');
            data.data.forEach(terminal => {
                if (terminal.active) {
                    console.log(`
Название: ${terminal.name || 'Нет названия'}
Адрес: ${terminal.desc || 'Нет адреса'}
Город ID: ${terminal.city_id}
Тип доставки: ${terminal.delivery_type}
Активен: ${terminal.active ? 'Да' : 'Нет'}
Координаты: ${terminal.latitude}, ${terminal.longitude}
-------------------`);
                }
            });
        } else {
            console.log('Ошибка получения данных');
        }
    } catch (error) {
        console.error('Error fetching terminals:', error.message);
    }
}

getTerminals(); 