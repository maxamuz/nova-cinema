const WEEK_LENGTH = 6;

function createArrow(direction, onClick) {
	const item = document.createElement('li');
	item.className = 'calendar-panel__item calendar-panel__arrow';
	item.textContent = direction === 'next' ? '>' : '<';
	item.addEventListener('click', onClick);
	return item;
}

function renderDays(container, startDate, selectedDate, onSelect, stateApi) {
	for (let i = 0; i < WEEK_LENGTH; i += 1) {
	const date = new Date(startDate);
		date.setDate(startDate.getDate() + i);
		const dateString = stateApi.formatDate(date);

	const node = document.createElement('li');
		node.className = 'calendar-panel__item';
		if (dateString === selectedDate) {
			node.classList.add('calendar-panel__item--active');
		}
		
		// Добавляем класс для каждого седьмого дня, который отстоит от "Сегодня"
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		// Проверяем, является ли текущая дата седьмым днем от сегодня
		const targetDate = new Date(today);
		targetDate.setDate(today.getDate() + 6); // 24.11 + 6 дней = 30.11
		if (date.toDateString() === targetDate.toDateString()) {
			node.classList.add('calendar-panel__item--active');
		}

	const isToday = stateApi.formatDate(new Date()) === dateString;
		const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
	node.innerHTML = `${isToday ? 'Сегодня' : dayName}<br>${date.getDate()}.${date.getMonth() + 1}`;

		node.addEventListener('click', () => {
			// Обновляем локальное состояние и внешнее
			const newSelectedDate = dateString;
			stateApi.setActiveDate(newSelectedDate);
			
			// Удаляем активный класс у всех элементов
			container.querySelectorAll('.calendar-panel__item--active').forEach(item => {
				item.classList.remove('calendar-panel__item--active');
			});
			
			// Добавляем активный класс к текущему элементу
			node.classList.add('calendar-panel__item--active');
			
			onSelect(newSelectedDate);
		});
		container.appendChild(node);
	}
}

function initCalendar(container, onSelect) {
	const stateApi = window.Nova?.state || {
		getActiveDate: () => null,
		formatDate: (d) => d.toISOString().split('T')[0],
		setActiveDate: () => {},
	};
	let offset = 0;
	let hasNavigatedForward = false;
	let selectedDate = stateApi.getActiveDate();

	const render = () => {
		if (offset === 0) {
			hasNavigatedForward = false;
		}

		container.innerHTML = '';

		const currentDate = new Date();
		currentDate.setDate(currentDate.getDate() + offset);

		if (offset > 0) {
			container.appendChild(createArrow('prev', () => {
				offset -= WEEK_LENGTH;
				if (offset < 0) offset = 0;
				render();
			}));
		}

		// Передаём актуальное значение selectedDate
		renderDays(container, currentDate, selectedDate, (date) => {
			onSelect(date);
		}, stateApi);

		if (!hasNavigatedForward) {
			container.appendChild(createArrow('next', () => {
				offset += WEEK_LENGTH;
				hasNavigatedForward = true;
				render();
			}));
		}
	};

	render();
}

window.Nova = window.Nova || {};
window.Nova.calendar = {
	initCalendar,
};