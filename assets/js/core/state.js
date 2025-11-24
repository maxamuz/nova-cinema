const selectionKey = 'nova-seat-selection';
const adminKey = 'nova-admin-session';

const today = new Date();

const toDateString = (date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

const runtimeState = {
	activeDate: toDateString(today),
};

function formatDate(date) {
	return toDateString(date);
}

function setActiveDate(dateString) {
	runtimeState.activeDate = dateString;
}

function getActiveDate() {
	return runtimeState.activeDate;
}

function persistSelection(payload) {
	window.localStorage.setItem(selectionKey, JSON.stringify(payload));
}

function readSelection() {
	const raw = window.localStorage.getItem(selectionKey);
	if (!raw) {
		return null;
	}
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function clearSelection() {
	window.localStorage.removeItem(selectionKey);
}

function setAdminAuth(isAuthorized) {
	if (isAuthorized) {
		window.sessionStorage.setItem(adminKey, 'true');
	} else {
		window.sessionStorage.removeItem(adminKey);
	}
}

function isAdminAuthorized() {
	return window.sessionStorage.getItem(adminKey) === 'true';
}

window.Nova = window.Nova || {};
window.Nova.state = {
	formatDate,
	setActiveDate,
	getActiveDate,
	persistSelection,
	readSelection,
	clearSelection,
	setAdminAuth,
	isAdminAuthorized,
};
window.Nova.runtimeState = runtimeState;

