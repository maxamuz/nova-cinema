(function initAdminAuth(global) {
	const ApiClient = global.Nova.ApiClient;
	const stateApi = global.Nova.state;
	const form = document.getElementById('adminLoginForm');
	const api = new ApiClient();

	form?.addEventListener('submit', async (event) => {
		event.preventDefault();
		const formData = new FormData(form);
		try {
			await api.login(formData);
			stateApi.setAdminAuth(true);
			window.location.href = 'admin.html';
		} catch (error) {
			stateApi.setAdminAuth(false);
			alert(error.message);
		}
	});
})(window);

