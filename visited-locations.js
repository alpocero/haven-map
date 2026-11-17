(() => {
	'use strict';

	const visitedMarkerIds = new Set();
	let visitToggleBusy = false;

	function isLoggedInAdmin() {
		return typeof state !== 'undefined' && !!state.isAdmin;
	}

	async function loadVisitedLocations() {
		visitedMarkerIds.clear();
		if (!isLoggedInAdmin()) {
			syncVisitedMarkerStyles();
			syncVisitedPopupButtons();
			return;
		}

		const { data, error } = await supabaseClient
			.from('location_visits')
			.select('marker_id');

		if (error) {
			console.error('Could not load visited locations:', error);
			return;
		}

		for (const row of data || []) visitedMarkerIds.add(String(row.marker_id));
		syncVisitedMarkerStyles();
		syncVisitedPopupButtons();
	}

	function syncVisitedMarkerStyles() {
		if (typeof markerLayerById === 'undefined') return;
		for (const [markerId, marker] of markerLayerById) {
			const element = marker.getElement();
			if (element) element.classList.toggle('visited-location-icon', visitedMarkerIds.has(String(markerId)));
		}
	}

	function getLocationFromPopup(popupContent) {
		const title = popupContent.querySelector('.pop__title')?.textContent?.trim();
		if (!title || typeof markers === 'undefined') return null;
		return markers.find(marker => marker.runame === title) || null;
	}

	function syncVisitedPopupButtons() {
		if (!isLoggedInAdmin()) {
			document.querySelectorAll('.visited-location-control').forEach(el => el.remove());
			return;
		}

		document.querySelectorAll('.leaflet-popup-content').forEach(popupContent => {
			const location = getLocationFromPopup(popupContent);
			if (!location) {
				popupContent.querySelectorAll('.visited-location-control').forEach(el => el.remove());
				return;
			}

			let control = popupContent.querySelector('.visited-location-control');
			if (!control) {
				control = document.createElement('div');
				control.className = 'visited-location-control';
				const pop = popupContent.querySelector('.pop');
				if (!pop) return;
				pop.appendChild(control);
			}

			const visited = visitedMarkerIds.has(String(location.id));
			let button = control.querySelector('button');
			if (!button) {
				button = document.createElement('button');
				button.type = 'button';
				button.dataset.action = 'toggle-visited-location';
				button.className = 'btn visited-location-button';
				button.innerHTML = '<span class="btn__label"></span>';
				control.appendChild(button);
			}

			button.dataset.markerId = String(location.id);
			button.classList.toggle('selected', visited);
			const label = button.querySelector('.btn__label');
			const text = visited ? 'Посещено' : 'Отметить посещённым';
			if (label.textContent !== text) label.textContent = text;
		});
	}

	async function toggleVisitedLocation(markerId) {
		if (!isLoggedInAdmin() || visitToggleBusy) return;
		visitToggleBusy = true;

		const id = String(markerId);
		const visited = visitedMarkerIds.has(id);
		let error;

		if (visited) {
			({ error } = await supabaseClient
				.from('location_visits')
				.delete()
				.eq('marker_id', id));
			if (!error) visitedMarkerIds.delete(id);
		} else {
			const { data: userData, error: userError } = await supabaseClient.auth.getUser();
			if (userError || !userData?.user) {
				visitToggleBusy = false;
				return;
			}
			({ error } = await supabaseClient
				.from('location_visits')
				.insert({ user_id: userData.user.id, marker_id: id }));
			if (!error) visitedMarkerIds.add(id);
		}

		visitToggleBusy = false;
		if (error) {
			console.error('Could not update visited location:', error);
			return;
		}

		syncVisitedMarkerStyles();
		syncVisitedPopupButtons();
	}

	document.addEventListener('click', event => {
		const button = event.target.closest('[data-action="toggle-visited-location"]');
		if (!button) return;
		event.preventDefault();
		event.stopPropagation();
		toggleVisitedLocation(button.dataset.markerId);
	});

	const observer = new MutationObserver(() => syncVisitedPopupButtons());
	observer.observe(document.body, { childList: true, subtree: true });

	if (typeof supabaseClient !== 'undefined') {
		supabaseClient.auth.onAuthStateChange(() => {
			setTimeout(loadVisitedLocations, 0);
		});
	}

	loadVisitedLocations();
	if (typeof map !== 'undefined') map.on('zoomend', syncVisitedMarkerStyles);
	setTimeout(syncVisitedMarkerStyles, 100);
})();
