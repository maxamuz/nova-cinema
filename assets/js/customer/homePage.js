(function initHomePage(global) {
	const stateApi = global.Nova.state;
	const calendarApi = global.Nova.calendar;
	const ApiClient = global.Nova.ApiClient;

	const screeningsNode = document.getElementById('screeningBoard');
	const calendarNode = document.getElementById('dateCarousel');
	const loginButton = document.getElementById('authEntry');

	const api = new ApiClient();
	let cachedData = null;

	function buildSessionPill(session, hallName, film) {
		const pill = document.createElement('button');
		pill.className = 'session-slot';
		pill.type = 'button';
		pill.textContent = session.seance_time;
		pill.dataset.time = session.seance_time.replace(':', '');

		const selectedDate = stateApi.getActiveDate();
		const now = new Date();
		const nowString = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
		const todayString = stateApi.formatDate(now);
		if (selectedDate === todayString && pill.dataset.time <= nowString) {
			pill.classList.add('session-slot--disabled');
			pill.disabled = true;
		}

		if (!pill.disabled) {
			pill.addEventListener('click', () => {
				stateApi.persistSelection({
					seanceId: session.id,
					hallId: session.seance_hallid,
					seanceTime: session.seance_time,
					filmTitle: film.film_name,
					hallName,
					chosenDate: selectedDate,
				});
				window.location.href = 'auditorium.html';
			});
		}

		return pill;
	}

	function renderMovieCard(film, halls, seances) {
		const card = document.createElement('article');
		card.className = 'movie-card';

		const poster = document.createElement('img');
		poster.className = 'movie-card__poster';
		poster.src = film.film_poster;
		poster.alt = `Постер ${film.film_name}`;

		const content = document.createElement('div');

		const title = document.createElement('h2');
		title.className = 'movie-card__title';
		title.textContent = film.film_name;

		const synopsis = document.createElement('p');
		synopsis.textContent = film.film_description;

		const meta = document.createElement('p');
		meta.className = 'movie-card__meta';
		meta.textContent = `${film.film_duration} мин • ${film.film_origin}`;

		const sessionsWrapper = document.createElement('div');
		sessionsWrapper.className = 'movie-card__sessions';

		halls.forEach((hall) => {
			const hallSeances = seances.filter((s) => s.seance_hallid === hall.id);
			if (!hallSeances.length) {
				return;
			}

			const row = document.createElement('div');
			row.className = 'session-row';

			const hallLabel = document.createElement('span');
			hallLabel.className = 'session-row__title';
			hallLabel.textContent = hall.hall_name;
			row.appendChild(hallLabel);

			hallSeances
				.sort((a, b) => a.seance_time.localeCompare(b.seance_time))
				.forEach((session) => {
					const pill = buildSessionPill(session, hall.hall_name, film);
					row.appendChild(pill);
				});
			sessionsWrapper.appendChild(row);
		});

		content.append(title, synopsis, meta, sessionsWrapper);
		card.append(poster, content);
		return card;
	}

	function renderBoard() {
		if (!cachedData) {
			return;
		}
		const activeDate = stateApi.getActiveDate();
		screeningsNode.innerHTML = '';

		const openHalls = cachedData.halls.filter((hall) => hall.hall_open === 1);
		cachedData.films.forEach((film) => {
			const seances = cachedData.seances.filter((s) => s.seance_filmid === film.id);
			if (!seances.length) {
				return;
			}
			const card = renderMovieCard(film, openHalls, seances);
			screeningsNode.appendChild(card);
		});

		if (!screeningsNode.children.length) {
			const empty = document.createElement('p');
			empty.textContent = `На ${activeDate} не найдено сеансов.`;
			empty.style.color = '#fff';
			screeningsNode.appendChild(empty);
		}
	}

	async function loadData() {
		try {
			cachedData = await api.getAllData();
			renderBoard();
		} catch (error) {
			screeningsNode.innerHTML = `<p style="color:#fff;">${error.message}</p>`;
		}
	}

	calendarApi.initCalendar(calendarNode, (date) => {
		stateApi.setActiveDate(date);
		renderBoard();
	});

	loginButton?.addEventListener('click', () => {
		window.location.href = 'auth.html';
	});

	stateApi.setActiveDate(stateApi.getActiveDate());
	loadData();
})(window);

