const BASE_URL = 'https://shfe-diplom.neto-server.ru';

class ApiClient {
	constructor(baseUrl = BASE_URL) {
		this.baseUrl = baseUrl;
	}

	async request(path, options = {}, errorMessage = 'Ошибка запроса') {
		const response = await fetch(`${this.baseUrl}${path}`, options);
		const data = await response.json();
		if (!response.ok || (data.success === false)) {
			const message = data.error || errorMessage;
			throw new Error(message);
		}
		return data.result ?? data;
	}

	getAllData() {
		return this.request('/alldata', {}, 'Не удалось загрузить расписание');
	}

	getHallConfig(seanceId, date) {
		return this.request(`/hallconfig?seanceId=${seanceId}&date=${date}`, {}, 'Не удалось получить схему зала');
	}

	bookTickets(formData) {
		return this.request('/ticket', {
			method: 'POST',
			body: formData,
		}, 'Не удалось оформить бронирование');
	}

	login(formData) {
		return fetch(`${this.baseUrl}/login`, {
			method: 'POST',
			body: formData,
		}).then(async (response) => {
			const data = await response.json();
			if (!response.ok || data.success === false) {
				throw new Error(data.error || 'Неверный логин или пароль');
			}
			return data;
		});
	}

	createHall(name) {
		return this.request('/hall', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ hallName: name }),
		}, 'Не удалось создать зал');
	}

	removeHall(id) {
		return this.request(`/hall/${id}`, { method: 'DELETE' }, 'Не удалось удалить зал');
	}

	saveHallLayout(hallId, layoutForm) {
		return this.request(`/hall/${hallId}`, {
			method: 'POST',
			body: layoutForm,
		}, 'Не удалось сохранить конфигурацию');
	}

	savePrices(hallId, priceForm) {
		return this.request(`/price/${hallId}`, {
			method: 'POST',
			body: priceForm,
		}, 'Не удалось сохранить цены');
	}

	createFilm(formData) {
		return this.request('/film', {
			method: 'POST',
			body: formData,
		}, 'Не удалось добавить фильм');
	}

	removeFilm(id) {
		return this.request(`/film/${id}`, {
			method: 'DELETE',
		}, 'Не удалось удалить фильм');
	}

	createSession(formData) {
		return this.request('/seance', {
			method: 'POST',
			body: formData,
		}, 'Не удалось создать сеанс');
	}

	removeSession(id) {
		return this.request(`/seance/${id}`, { method: 'DELETE' }, 'Не удалось удалить сеанс');
	}

	switchSales(hallId, isOpen) {
		const form = new FormData();
		form.set('hallOpen', isOpen ? '1' : '0');
		return this.request(`/open/${hallId}`, {
			method: 'POST',
			body: form,
		}, 'Не удалось изменить статус продаж');
	}
}

window.Nova = window.Nova || {};
window.Nova.ApiClient = ApiClient;

