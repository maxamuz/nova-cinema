const WEEK_LENGTH = 6;

function createArrow(direction, onClick) {
	const item = document.createElement('li');
	item.className = 'calendar-panel__item';
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

		const isToday = stateApi.formatDate(new Date()) === dateString;
		const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
		node.innerHTML = `<strong>${isToday ? 'Сегодня' : dayName}</strong><br>${date.getDate()}.${date.getMonth() + 1}`;

		node.addEventListener('click', () => {
			stateApi.setActiveDate(dateString);
			onSelect(dateString);
		});
		container.appendChild(node);
	}
}

function initCalendar(container, onSelect) {
	const stateApi = window.Nova?.state;
	let offset = 0;

	const render = () => {
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

		renderDays(container, currentDate, stateApi.getActiveDate(), (date) => {
			onSelect(date);
			render();
		}, stateApi);

		container.appendChild(createArrow('next', () => {
			offset += WEEK_LENGTH;
			render();
		}));
	};

	render();
}

window.Nova = window.Nova || {};
window.Nova.calendar = {
	initCalendar,
};

