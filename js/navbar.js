document.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('navbar-container');
	if (!container) return;

	fetch('header.html')
		.then(res => res.text())
		.then(data => {
			container.innerHTML = data;

			const user         = localStorage.getItem('username');
			const email        = localStorage.getItem('userEmail');
			const role         = localStorage.getItem('role');

			const loginLink    = document.getElementById('login-link');
			const registerLink = document.getElementById('register-link');
			const adminLink    = document.getElementById('admin-link');
			const userDropdown = document.getElementById('user-dropdown');
			const navUsername  = document.getElementById('nav-username');
			const navEmail     = document.getElementById('nav-email');
			const gameLink     = document.getElementById('game-link');

			if (user && email && role) {
				if (loginLink)    loginLink.style.display = 'none';
				if (registerLink) registerLink.style.display = 'none';
				if (userDropdown) userDropdown.style.display = 'block';
				if (navUsername)  navUsername.textContent = user;
				if (navEmail)     navEmail.textContent = email;

				if (gameLink) gameLink.style.display = 'inline-block';
				if (role === "admin" && adminLink) {
					adminLink.style.display = 'inline-block';
				}
			} else {
				if (loginLink)    loginLink.style.display = 'block';
				if (registerLink) registerLink.style.display = 'block';
				if (userDropdown) userDropdown.style.display = 'none';
				if (gameLink)     gameLink.style.display = 'none';
				if (adminLink)    adminLink.style.display = 'none';
			}

			const logoutBtn = document.getElementById('logout-button');
			if (logoutBtn) {
				logoutBtn.addEventListener('click', e => {
					e.preventDefault();
					localStorage.clear();
					window.location.href = 'inicioSesion.html';
				});
			}
		});
});


// Espera a que el DOM del header cargue
setTimeout(() => {
	const avatarImg      = document.getElementById("user-avatar");
	const changeBtn      = document.getElementById("change-avatar-btn");
	const fileInput      = document.getElementById("avatar-input");

	// Cargar avatar guardado
	const savedAvatar = localStorage.getItem("user-avatar");
	if (savedAvatar && avatarImg) {
		avatarImg.src = savedAvatar;
	}

	// Al dar clic en "Cambiar imagen"
	if (changeBtn && fileInput && avatarImg) {
		changeBtn.addEventListener("click", () => {
			fileInput.click();
		});

		fileInput.addEventListener("change", () => {
			const file = fileInput.files[0];
			if (file && file.type.startsWith("image/")) {
				const reader = new FileReader();
				reader.onload = () => {
					const imageData = reader.result;
					localStorage.setItem("user-avatar", imageData);
					avatarImg.src = imageData;
				};
				reader.readAsDataURL(file);
			}
		});
	}
}, 100);
