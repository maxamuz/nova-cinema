(function initAuditoriumPage(global) {
	const stateApi = global.Nova.state;
	const ApiClient = global.Nova.ApiClient;
	const api = new ApiClient();

	const summaryNode = document.getElementById('auditoriumSummary');
	const gridNode = document.getElementById('seatGrid');
	const reserveButton = document.getElementById('reserveSeats');

	const selection = stateApi.readSelection();
	if (!selection) {
		window.location.href = 'home.html';
		return;
	}

	let hallData = null;
	const chosenSeats = [];

	function updateSummary() {
		summaryNode.innerHTML = `
        <h1>${selection.filmTitle}</h1>
        <p>Зал: ${selection.hallName}</p>
        <p>Дата: ${selection.chosenDate}</p>
        <p>Время: ${selection.seanceTime}</p>
    `;
	}

	function buildSeatNode(type, rowIndex, seatIndex, hall) {
		const node = document.createElement('button');
		node.type = 'button';
		node.className = 'seat-node';

		switch (type) {
		case 'standart':
			node.classList.add('seat-node--free');
			break;
		case 'vip':
			node.classList.add('seat-node--vip');
			break;
		case 'taken':
			node.classList.add('seat-node--taken');
			node.disabled = true;
			break;
		default:
			node.classList.add('seat-node--missing');
			node.disabled = true;
			break;
		}

		node.addEventListener('click', () => {
			if (node.disabled || node.classList.contains('seat-node--missing')) {
				return;
			}
			const seatRef = {
				row: rowIndex + 1,
				place: seatIndex + 1,
				coast: type === 'vip' ? hall.hall_price_vip : hall.hall_price_standart,
			};

			const existingIndex = chosenSeats.findIndex(
				(seat) => seat.row === seatRef.row && seat.place === seatRef.place,
			);
			if (existingIndex >= 0) {
				chosenSeats.splice(existingIndex, 1);
				node.classList.remove('seat-node--selected');
			} else {
				chosenSeats.push(seatRef);
				node.classList.add('seat-node--selected');
			}
		});

		return node;
	}

	async function renderSeats() {
		const data = await api.getAllData();
		const hall = data.halls.find((h) => h.id === selection.hallId);
		if (!hall) {
			throw new Error('Зал не найден');
		}
		hallData = hall;

		const layout = await api.getHallConfig(selection.seanceId, selection.chosenDate ?? stateApi.getActiveDate());
		gridNode.innerHTML = '';
		gridNode.style.gridTemplateColumns = `repeat(${layout[0].length}, 26px)`;

		layout.forEach((row, rowIndex) => {
			row.forEach((seat, seatIndex) => {
				const node = buildSeatNode(seat, rowIndex, seatIndex, hall);
				gridNode.appendChild(node);
			});
		});
	}

	reserveButton.addEventListener('click', () => {
		if (!chosenSeats.length) {
			alert('Выберите хотя бы одно место');
			return;
		}
		const extendedSelection = {
			...selection,
			hallTitle: hallData?.hall_name ?? selection.hallName,
			chosenSeats,
		};
		stateApi.persistSelection(extendedSelection);
		window.location.href = 'checkout.html';
	});

	updateSummary();
	renderSeats().catch((error) => {
		gridNode.innerHTML = `<p style="color:#fff;">${error.message}</p>`;
		reserveButton.disabled = true;
	});
})(window);

