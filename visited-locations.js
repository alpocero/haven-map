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
				if (pop) pop.appendChild(control);
			}

			const visited = visitedMarkerIds.has(String(location.id));
			control.innerHTML = `<button type="button" class="btn visited-location-button${visited ? ' selected' : ''}" data-action="toggle-visited-location" data-marker-id="${String(location.id)}">
				<span class="btn__label">${visited ? 'Посещено' : 'Отметить посещённым'}</span>
			</button>`;
		});
	}

	async function toggleVisitedLocation(markerId) {
		if (!isLoggedInAdmin() || visitToggleBusy) return;
		visitToggleBusy = true;

		const id = String(markerId);
		const visited = visitedMarkerIds.has(id);

		let result;
		if (visited) {
			result = await supabaseClient
				.from('location_visits')
				.delete()
				.eq('marker_id', id);
			if (!result.error) visitedMarkerIds.delete(id);
		} else {
			const { data: userData, error: userError } = await supabaseClient.auth.getUser();
			if (userError || !userData?.user) {
				visitToggleBusy = false;
				return;
			}

			result = await supabaseClient
				.from('location_visits')
				.insert({ user_id: userData.user.id, marker_id: id });
			if (!result.error) visitedMarkerIds.add(id);
		}

		visitToggleBusy = false;
		if (result.error) {
			console.error('Could not update visited location:', result.error);
			return;
		}

		syncVisitedMarkerStyles();
		syncVisitedPopupButtons();
	}

	document.addEventListener('click', event => {
		const button = event.target.closest('[data-action="toggle-visited-location"]');
		if (!button) return;
		event.preventPropagation();
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
	map.on('zoomend', syncVisitedMarkerStyles);
	setTimeout(syncVisitedMarkerStyles, 100);
})();
