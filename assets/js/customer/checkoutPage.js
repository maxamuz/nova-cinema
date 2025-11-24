(function initCheckoutPage(global) {
	const stateApi = global.Nova.state;
	const ApiClient = global.Nova.ApiClient;
	const api = new ApiClient();

	const detailsNode = document.getElementById('ticketDetails');
	const actionButton = document.getElementById('issueTicket');
	const hintNode = document.getElementById('ticketHint');
	const qrNode = document.getElementById('ticketQr');

	const selection = stateApi.readSelection();
	if (!selection || !selection.chosenSeats) {
		window.location.href = 'home.html';
		return;
	}

	function seatPrice(seat) {
		if (typeof seat.coast !== 'undefined') {
			return Number(seat.coast);
		}
		return Number(seat.price ?? 0);
	}

	function renderDetails() {
		const total = selection.chosenSeats.reduce((acc, seat) => acc + seatPrice(seat), 0);
		const seatList = selection.chosenSeats
			.map((seat) => `ряд ${seat.row}, место ${seat.place}`)
			.join('; ');

		detailsNode.innerHTML = `
        <p><strong>Фильм:</strong> ${selection.filmTitle}</p>
        <p><strong>Зал:</strong> ${selection.hallTitle ?? selection.hallName}</p>
        <p><strong>Дата:</strong> ${selection.chosenDate}</p>
        <p><strong>Время:</strong> ${selection.seanceTime}</p>
        <p><strong>Места:</strong> ${seatList}</p>
        <p><strong>Сумма:</strong> ${total} ₽</p>
    `;
	}

	async function verifySeats() {
		const layout = await api.getHallConfig(selection.seanceId, selection.chosenDate);
		return selection.chosenSeats.every((seat) => {
			const row = layout[seat.row - 1];
			if (!row) {
			 return false;
			}
			const status = row[seat.place - 1];
			return status !== 'taken' && status !== 'disabled';
		});
	}

	async function handleBooking() {
		try {
			const seatsAreFree = await verifySeats();
			if (!seatsAreFree) {
				alert('Некоторые места уже заняты. Вернитесь и выберите другие.');
				return;
			}

			const params = new FormData();
			params.set('seanceId', selection.seanceId);
			params.set('ticketDate', selection.chosenDate);
			params.set('tickets', JSON.stringify(selection.chosenSeats));

			await api.bookTickets(params);
			actionButton.disabled = true;
			hintNode.textContent = 'Покажите QR-код контролёру перед началом сеанса.';
			renderQr();
			stateApi.clearSelection();
		} catch (error) {
			alert(error.message);
		}
	}

	function renderQr() {
		const total = selection.chosenSeats.reduce((acc, seat) => acc + seatPrice(seat), 0);
		const seatList = selection.chosenSeats
			.map((seat) => `ряд ${seat.row} место ${seat.place}`)
			.join(', ');
		const payload = `Дата:${selection.chosenDate}; Время:${selection.seanceTime}; Фильм:${selection.filmTitle}; Зал:${selection.hallTitle ?? selection.hallName}; Места:${seatList}; Сумма:${total}`;

		const qr = global.QRCreator(payload, {
			mode: 4,
			eccl: 0,
			mask: -1,
			image: 'png',
			modsize: 6,
			margin: 0,
		});

		qrNode.innerHTML = '';
		qrNode.appendChild(qr.result);
	}

	actionButton.addEventListener('click', (e) => {
		e.preventDefault();
		handleBooking();
	});

	renderDetails();
})(window);

