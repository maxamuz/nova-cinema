(function initAdminApp(global) {
	const ApiClient = global.Nova.ApiClient;
	const stateApi = global.Nova.state;
	if (!stateApi.isAdminAuthorized()) {
		window.location.href = 'auth.html';
		return;
	}

	const api = new ApiClient();

	const hallListNode = document.getElementById('hallList');
	const hallModal = document.getElementById('hallModal');
	const hallForm = document.getElementById('hallForm');
	const addHallBtn = document.getElementById('addHallBtn');

	const layoutSelector = document.getElementById('layoutSelector');
	const rowCountInput = document.getElementById('rowCountInput');
	const seatCountInput = document.getElementById('seatCountInput');
	const gridApplyBtn = document.getElementById('gridApplyBtn');
	const designerGrid = document.getElementById('designerGrid');

	const pricingSelector = document.getElementById('pricingSelector');
	const regularPriceInput = document.getElementById('regularPriceInput');
	const vipPriceInput = document.getElementById('vipPriceInput');
	const priceSaveBtn = document.getElementById('priceSaveBtn');

	const sessionBoard = document.getElementById('sessionBoard');
	const sessionModal = document.getElementById('sessionModal');
	const sessionForm = document.getElementById('sessionForm');
	const sessionHallSelect = document.getElementById('sessionHallSelect');
	const sessionFilmSelect = document.getElementById('sessionFilmSelect');
	const newSessionBtn = document.getElementById('newSessionBtn');

	const filmGallery = document.getElementById('filmGallery');
	const filmModal = document.getElementById('filmModal');
	const filmForm = document.getElementById('filmForm');
	const newFilmBtn = document.getElementById('newFilmBtn');

	const salesSelector = document.getElementById('salesSelector');
	const salesToggleBtn = document.getElementById('salesToggleBtn');
	const salesStatusText = document.getElementById('salesStatusText');

	const logoutButton = document.getElementById('logoutAdmin');

	let halls = [];
	let films = [];
	let seances = [];

	let layoutDraft = [];
	let activeLayoutHall = null;
	let activePricingHall = null;
	let activeSalesHall = null;

	function closeDialog(dialog) {
		dialog.close();
	}

	function openDialog(dialog) {
		dialog.showModal();
	}

	function refreshSelectors() {
		const buildPills = (target, handler, activeId) => {
			target.innerHTML = '';
			halls.forEach((hall) => {
				const pill = document.createElement('button');
				pill.type = 'button';
				pill.className = 'selector__pill';
				pill.textContent = hall.hall_name;
				if (hall.id === activeId) {
					pill.classList.add('selector__pill--active');
				}
				pill.addEventListener('click', () => handler(hall.id));
				target.appendChild(pill);
			});
		};

		if (layoutSelector) {
			buildPills(layoutSelector, selectLayoutHall, activeLayoutHall ?? halls[0]?.id);
		}
		if (pricingSelector) {
			buildPills(pricingSelector, selectPricingHall, activePricingHall ?? halls[0]?.id);
		}
		if (salesSelector) {
			buildPills(salesSelector, selectSalesHall, activeSalesHall ?? halls[0]?.id);
			updateSalesInfo();
		}
	}

	function renderHalls() {
		hallListNode.innerHTML = '';

		halls.forEach((hall) => {
			const item = document.createElement('li');
			item.className = 'panel__list-item';
			item.textContent = hall.hall_name;

			const remove = document.createElement('button');
			remove.type = 'button';
			remove.className = 'action-button action-button--small';
			remove.textContent = 'Удалить';
			remove.addEventListener('click', async () => {
				if (!confirm(`Удалить ${hall.hall_name}?`)) return;
				await api.removeHall(hall.id);
				await bootstrap();
			});

			item.appendChild(remove);
			hallListNode.appendChild(item);
		});
	}

	function renderFilms() {
		if (!filmGallery) return;
		filmGallery.innerHTML = '';
		films.forEach((film) => {
			const item = document.createElement('li');
			item.className = 'panel__list-item';

			const info = document.createElement('div');
			info.innerHTML = `<strong>${film.film_name}</strong><br><small>${film.film_duration} мин</small>`;

			const remove = document.createElement('button');
			remove.className = 'action-button action-button--small';
			remove.type = 'button';
			remove.textContent = 'Удалить';
			remove.addEventListener('click', async () => {
				if (!confirm(`Удалить фильм ${film.film_name}?`)) return;
				await api.removeFilm(film.id);
				await bootstrap();
			});

			item.append(info, remove);
			filmGallery.appendChild(item);
		});
	}

	function selectLayoutHall(hallId) {
		activeLayoutHall = hallId;
		const hall = halls.find((h) => h.id === hallId);
		if (!hall) return;
		const defaultRow = Array.from({ length: 6 }, () => 'standart');
		layoutDraft = (hall.hall_config?.length
			? hall.hall_config.map((row) => [...row])
			: Array.from({ length: 6 }, () => [...defaultRow]));
		rowCountInput.value = layoutDraft.length;
		seatCountInput.value = layoutDraft[0].length;
		renderDesignerGrid();
		refreshSelectors();
	}

	function selectPricingHall(hallId) {
		activePricingHall = hallId;
		const hall = halls.find((h) => h.id === hallId);
		if (!hall) return;
		regularPriceInput.value = hall.hall_price_standart;
		vipPriceInput.value = hall.hall_price_vip;
		refreshSelectors();
	}

	function selectSalesHall(hallId) {
		activeSalesHall = hallId;
		refreshSelectors();
	}

	function renderDesignerGrid() {
		if (!layoutDraft.length) return;
		designerGrid.innerHTML = '';
		designerGrid.style.gridTemplateColumns = `repeat(${layoutDraft[0].length}, 26px)`;

		layoutDraft.forEach((row, rowIndex) => {
			row.forEach((cell, cellIndex) => {
				const button = document.createElement('button');
				button.type = 'button';
				button.className = 'seat-node';
				if (cell === 'vip') {
					button.classList.add('seat-node--vip');
				} else if (cell === 'standart') {
					button.classList.add('seat-node--free');
				} else {
					button.classList.add('seat-node--missing');
				}

				button.addEventListener('click', () => {
					const current = layoutDraft[rowIndex][cellIndex];
					if (current === 'standart') {
						layoutDraft[rowIndex][cellIndex] = 'vip';
					} else if (current === 'vip') {
						layoutDraft[rowIndex][cellIndex] = 'disabled';
					} else {
						layoutDraft[rowIndex][cellIndex] = 'standart';
					}
					renderDesignerGrid();
				});

				designerGrid.appendChild(button);
			});
		});
	}

	function renderSessions() {
		sessionBoard.innerHTML = '';
		halls.forEach((hall) => {
			const hallSessions = seances.filter((seance) => seance.seance_hallid === hall.id);
			if (!hallSessions.length) {
				return;
			}
			hallSessions.sort((a, b) => a.seance_time.localeCompare(b.seance_time));
			hallSessions.forEach((session) => {
				const film = films.find((f) => f.id === session.seance_filmid);
				const card = document.createElement('div');
				card.className = 'session-card';

				const meta = document.createElement('div');
				meta.className = 'session-card__meta';
				meta.innerHTML = `
                <strong>${film?.film_name ?? '—'}</strong>
                <span>${hall.hall_name} • ${session.seance_time}</span>
            `;

				const remove = document.createElement('button');
				remove.type = 'button';
				remove.className = 'action-button action-button--small';
				remove.textContent = 'Удалить';
				remove.addEventListener('click', async () => {
					if (!confirm('Удалить сеанс?')) return;
					await api.removeSession(session.id);
					await bootstrap();
				});

				card.append(meta, remove);
				sessionBoard.appendChild(card);
			});
		});
	}

	function populateSelects() {
		sessionHallSelect.innerHTML = halls.map((hall) => `<option value="${hall.id}">${hall.hall_name}</option>`).join('');
		sessionFilmSelect.innerHTML = films.map((film) => `<option value="${film.id}">${film.film_name}</option>`).join('');
	}

	async function bootstrap() {
		const data = await api.getAllData();
		halls = data.halls;
		films = data.films;
		seances = data.seances;
		renderHalls();
		renderFilms();
		renderSessions();
		refreshSelectors();
		populateSelects();
		selectLayoutHall(halls[0]?.id);
		selectPricingHall(halls[0]?.id);
		selectSalesHall(halls[0]?.id);
	}

	gridApplyBtn.addEventListener('click', async (event) => {
		event.preventDefault();
		if (!activeLayoutHall) return;
		const rows = Number(rowCountInput.value);
		const seats = Number(seatCountInput.value);
		if (rows && seats && (rows !== layoutDraft.length || seats !== layoutDraft[0].length)) {
			layoutDraft = Array.from({ length: rows }, () => Array.from({ length: seats }, () => 'standart'));
			renderDesignerGrid();
		}
		const form = new FormData();
		form.set('rowCount', layoutDraft.length);
		form.set('placeCount', layoutDraft[0].length);
		form.set('config', JSON.stringify(layoutDraft));
		await api.saveHallLayout(activeLayoutHall, form);
		await bootstrap();
	});

	priceSaveBtn.addEventListener('click', async (event) => {
		event.preventDefault();
		if (!activePricingHall) return;
		const form = new FormData();
		form.set('priceStandart', regularPriceInput.value || '0');
		form.set('priceVip', vipPriceInput.value || '0');
		await api.savePrices(activePricingHall, form);
		await bootstrap();
	});

	salesToggleBtn.addEventListener('click', async () => {
		if (!activeSalesHall) return;
		const hall = halls.find((h) => h.id === activeSalesHall);
		const nextState = hall.hall_open === 0;
		await api.switchSales(activeSalesHall, nextState);
		await bootstrap();
	});

	function updateSalesInfo() {
		const hall = halls.find((h) => h.id === activeSalesHall);
		if (!hall) {
			salesStatusText.textContent = 'Статус неизвестен';
			return;
		}
		salesStatusText.textContent = hall.hall_open === 1 ? 'Продажи открыты' : 'Продажи закрыты';
	}

	addHallBtn.addEventListener('click', () => openDialog(hallModal));
	newSessionBtn.addEventListener('click', () => openDialog(sessionModal));
	newFilmBtn?.addEventListener('click', () => openDialog(filmModal));

	hallForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		const data = new FormData(hallForm);
		await api.createHall(data.get('hallName'));
		hallForm.reset();
		closeDialog(hallModal);
		await bootstrap();
	});

	sessionForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		const data = new FormData(sessionForm);
		try {
			await api.createSession(data);
			sessionForm.reset();
			closeDialog(sessionModal);
			await bootstrap();
		} catch (error) {
			alert(error.message);
		}
	});

	filmForm?.addEventListener('submit', async (event) => {
		event.preventDefault();
		const data = new FormData(filmForm);
		await api.createFilm(data);
		filmForm.reset();
		closeDialog(filmModal);
		await bootstrap();
	});

	[hallModal, sessionModal, filmModal].forEach((dialog) => {
		dialog?.addEventListener('click', (event) => {
			if (event.target.dataset.close !== undefined || event.target === dialog) {
				closeDialog(dialog);
			}
		});
	});

	logoutButton?.addEventListener('click', () => {
		stateApi.setAdminAuth(false);
		window.location.href = 'auth.html';
	});

	bootstrap().catch((error) => {
		alert(error.message);
	});
})(window);

