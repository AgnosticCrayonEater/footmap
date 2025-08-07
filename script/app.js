import { TILE_LAYERS, TILE_ATTRIBUTION } from './config.js';
import * as ui from './ui.js';
import * as mapManager from './map.js';

// --- STATE MANAGEMENT ---
const state = {
    map: null,
    markers: null,
    fanOutLayer: null,
    tileLayer: null,
    allClubs: [],
    allStadiums: [],
    translations: {},
    attributions: {},
    selectedClubId: null,
    activeMarker: null,
    countries: [],
    currentCountryId: localStorage.getItem('country') || 'da',
    currentLanguage: localStorage.getItem('language') || 'en',
    currentFont: localStorage.getItem('font') || 'Inter',
    leagueRanking: [],
    isClustered: false,
    useSimpleMarkers: false,
    showMarkerTooltips: false,
    isSearchActive: false,
    searchQuery: '',
};

// --- INITIALIZATION ---
async function init() {
    const { map, markers, fanOutLayer } = mapManager.initMap();
    state.map = map;
    state.markers = markers;
    state.fanOutLayer = fanOutLayer;

    setupEventListeners();

    ui.applySavedTheme();
    ui.applySavedFontSetting();
    ui.applySavedClusterSetting();
    ui.applySavedSimpleMarkersSetting();
    ui.applySavedMarkerTooltipsSetting();
    ui.updateLanguageButtons(state.currentLanguage);

    setTheme(ui.dom.themeSwitch.checked);
    setFont(state.currentFont);
    state.isClustered = ui.dom.clusterSwitch.checked;
    state.useSimpleMarkers = ui.dom.simpleMarkersSwitch.checked;
    state.showMarkerTooltips = ui.dom.markerTooltipsSwitch.checked;
    state.markers = mapManager.recreateMarkersLayer(state.map, state.markers, state.isClustered);

    try {
        const [countriesRes, availableDataRes] = await Promise.all([
            fetch('data/countries.json'),
            fetch('data/available_data.json')
        ]);

        if (!countriesRes.ok) throw new Error('Could not fetch countries.json');
        if (!availableDataRes.ok) throw new Error('Could not fetch available_data.json');

        const countries = await countriesRes.json();
        const availableData = await availableDataRes.json();

        state.countries = countries.map(country => {
            country.hasData = availableData.includes(country.id);
            return country;
        });

        ui.populateCountryDock(state.countries, switchCountry, resetCountryView);

        const initialCountry = state.countries.find(c => c.id === state.currentCountryId && c.hasData)
            || state.countries.find(c => c.hasData);

        if (initialCountry) {
            await switchCountry(initialCountry.id);
        } else {
            console.warn("No data is available for any country.");
            if (state.countries.length > 0) {
                state.map.setView(state.countries[0].mapCenter, state.countries[0].mapZoom);
            }
        }

    } catch (error) {
        console.error("FATAL: Could not initialize map.", error);
        ui.dom.infoBox.innerHTML = `<p>Error: Could not load map data. Please refresh the page.</p>`;
        ui.dom.infoBox.classList.add('visible');
    }
}

function setupEventListeners() {
    document.addEventListener('click', (e) => {
        if (ui.dom.filterBox.classList.contains('visible') && !ui.dom.filterBox.contains(e.target) && !ui.dom.filterBtn.contains(e.target)) {
            ui.toggleFilterModal();
        }
        if (ui.dom.settingsModal.classList.contains('visible') && !ui.dom.settingsModal.contains(e.target) && !ui.dom.settingsBtn.contains(e.target)) {
            ui.toggleSettingsModal();
        }
        if (state.isSearchActive && !ui.dom.searchContainer.contains(e.target)) {
            deactivateSearch();
        }
    });

    ui.dom.langDaBtn.addEventListener('click', () => switchLanguage('da'));
    ui.dom.langEnBtn.addEventListener('click', () => switchLanguage('en'));

    ui.dom.filterBox.addEventListener('change', (e) => {
        if (e.target.matches('#leagueFilter, .accolade-checkbox')) {
            resetInfoBox();
            renderFilteredMarkers();
        }
    });

    state.map.on('click', () => {
        resetInfoBox();
    });

    ui.dom.infoBtn.addEventListener('click', ui.toggleInfoModal);
    ui.dom.infoModalCloseBtn.addEventListener('click', ui.toggleInfoModal);
    ui.dom.infoModalOverlay.addEventListener('click', (e) => {
        if (e.target === ui.dom.infoModalOverlay) {
            ui.toggleInfoModal();
        }
    });

    ui.dom.creditsBtn.addEventListener('click', ui.toggleCreditsModal);
    ui.dom.creditsModalCloseBtn.addEventListener('click', ui.toggleCreditsModal);
    ui.dom.creditsModalOverlay.addEventListener('click', (e) => {
        if (e.target === ui.dom.creditsModalOverlay) {
            ui.toggleCreditsModal();
        }
    });

    ui.dom.filterBtn.addEventListener('click', ui.toggleFilterModal);
    ui.dom.settingsBtn.addEventListener('click', ui.toggleSettingsModal);

    ui.dom.themeSwitch.addEventListener('change', () => {
        const isDark = ui.dom.themeSwitch.checked;
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        setTheme(isDark);
    });

    ui.dom.fontSwitch.addEventListener('change', (e) => {
        const newFont = e.target.value;
        localStorage.setItem('font', newFont);
        setFont(newFont);
    });

    ui.dom.clusterSwitch.addEventListener('change', () => {
        state.isClustered = ui.dom.clusterSwitch.checked;
        localStorage.setItem('cluster', String(state.isClustered));
        state.markers = mapManager.recreateMarkersLayer(state.map, state.markers, state.isClustered);
        renderFilteredMarkers();
    });

    ui.dom.simpleMarkersSwitch.addEventListener('change', () => {
        state.useSimpleMarkers = ui.dom.simpleMarkersSwitch.checked;
        localStorage.setItem('simpleMarkers', String(state.useSimpleMarkers));
        renderFilteredMarkers();
    });

    ui.dom.markerTooltipsSwitch.addEventListener('change', () => {
        state.showMarkerTooltips = ui.dom.markerTooltipsSwitch.checked;
        localStorage.setItem('markerTooltips', String(state.showMarkerTooltips));
        // We need to re-render the markers for the tooltips to appear/disappear
        renderFilteredMarkers();
    });

    const wrapper = ui.dom.countryFlagsWrapper;
    const scrollAmount = 200;
    ui.dom.scrollLeftBtn.addEventListener('click', () => {
        wrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    ui.dom.scrollRightBtn.addEventListener('click', () => {
        wrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    // --- Search Event Listeners ---
    ui.dom.searchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!state.isSearchActive) {
            activateSearch();
        }
    });

    ui.dom.searchInput.addEventListener('input', handleSearchInput);

    ui.dom.searchClearBtn.addEventListener('click', clearSearch);
}

function setTheme(isDark) {
    document.body.classList.toggle('dark-mode', isDark);

    const darkThemeLink = document.getElementById('dark-theme-style');
    if (isDark) {
        if (!darkThemeLink) {
            const link = document.createElement('link');
            link.id = 'dark-theme-style';
            link.rel = 'stylesheet';
            link.href = 'style/dark.css';
            document.head.appendChild(link);
        }
    } else {
        if (darkThemeLink) {
            darkThemeLink.remove();
        }
    }

    if (state.selectedClubId) {
        const selectedClub = state.allClubs.find(club => club.id === state.selectedClubId);
        if (selectedClub) {
            ui.updateInfoBox(selectedClub, state.allClubs, state.translations, state.currentCountryId);
        }
    }

    state.tileLayer = mapManager.updateMapTheme(state.map, state.tileLayer, TILE_LAYERS, TILE_ATTRIBUTION);
}

function setFont(fontName) {
    const fontFamilies = {
        'Inter': "'Inter', sans-serif",
        'Roboto': "'Roboto', sans-serif",
        'Lato': "'Lato', sans-serif",
        'Source Sans Pro': "'Source Sans Pro', sans-serif",
        'Lexend': "'Lexend', sans-serif"
    };
    document.documentElement.style.setProperty('--current-font', fontFamilies[fontName] || fontFamilies['Inter']);
    state.currentFont = fontName;
}

// --- COUNTRY & LANGUAGE DATA ---
async function switchCountry(countryId) {
    if (countryId === state.currentCountryId && state.allClubs.length > 0) return;

    ui.updateActiveCountryButton(countryId);
    state.currentCountryId = countryId;
    localStorage.setItem('country', countryId);

    ui.dom.leagueFilter.value = 'all';
    deactivateSearch();

    const countryConfig = state.countries.find(c => c.id === countryId);
    if (!countryConfig) return console.error(`Country '${countryId}' not found.`);

    resetInfoBox();
    state.markers = mapManager.recreateMarkersLayer(state.map, state.markers, state.isClustered);

    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.add('visible');

    state.map.once('moveend', async () => {
        try {
            const [clubsRes, leaguesRes, stadiumsRes] = await Promise.all([
                fetch(`data/${state.currentCountryId}/clubs.json`),
                fetch(`data/${state.currentCountryId}/leagues.json`),
                fetch(`data/${state.currentCountryId}/stadiums.json`)
            ]);
            if (!clubsRes.ok || !leaguesRes.ok || !stadiumsRes.ok) throw new Error(`Could not fetch data for ${state.currentCountryId}`);

            const clubsData = await clubsRes.json();
            state.leagueRanking = await leaguesRes.json();
            state.allStadiums = await stadiumsRes.json();

            const stadiumsMap = new Map(state.allStadiums.map(s => [s.id, s]));
            state.allClubs = clubsData.map(club => {
                const searchSlug = [club.name, club.fullname, club.nickname, club.town]
                    .filter(Boolean)
                    .join('|')
                    .toLowerCase();
                return {
                    ...club,
                    stadium: stadiumsMap.get(club.stadiumId),
                    searchSlug
                };
            });

            mapManager.createLeaguePanes(state.map, state.leagueRanking);
            await switchLanguage(state.currentLanguage);

        } catch (error) {
            console.error("Failed to load country data:", error);
            state.allClubs = [];
            state.leagueRanking = [];
            state.allStadiums = [];
            await switchLanguage(state.currentLanguage);
        } finally {
            loadingOverlay.classList.remove('visible');
        }
    });
    state.map.setView(countryConfig.mapCenter, countryConfig.mapZoom);
}

function resetCountryView(countryId) {
    if (countryId === state.currentCountryId) {
        const countryConfig = state.countries.find(c => c.id === countryId);
        if (countryConfig) {
            state.map.setView(countryConfig.mapCenter, countryConfig.mapZoom);
        }
    }
}

async function switchLanguage(lang) {
    state.currentLanguage = lang;
    localStorage.setItem('language', lang);
    ui.updateLanguageButtons(lang);
    try {
        const [uiRes, attrRes] = await Promise.all([
            fetch(`lang/${lang}/ui.${lang}.json`),
            fetch(`lang/${lang}/attributions.${lang}.json`)
        ]);
        if (!uiRes.ok) throw new Error(`HTTP error! status: ${uiRes.status}`);
        if (!attrRes.ok) console.warn(`Could not load attributions for ${lang}.`);

        state.translations = await uiRes.json();
        state.attributions = attrRes.ok ? await attrRes.json() : { sections: [] };

        updateFullUI();
    } catch (error) { console.error("Failed to load language data:", error); }
}

// --- UI & MAP UPDATES ---
function updateFullUI() {
    ui.updateStaticText(state.translations);
    ui.populateCredits(state.translations, state.attributions);
    ui.populateFilter(state.leagueRanking, state.allClubs, state.translations);
    renderFilteredMarkers();

    if (state.selectedClubId) {
        const selectedClub = state.allClubs.find(club => club.id === state.selectedClubId);
        if (selectedClub) {
            let markerToActivate;
            state.markers.eachLayer(layer => {
                if (layer.clubId === state.selectedClubId) {
                    markerToActivate = layer;
                } else if (layer.getAllChildMarkers) {
                    layer.getAllChildMarkers().forEach(marker => {
                        if (marker.clubId === state.selectedClubId) {
                            markerToActivate = marker;
                        }
                    });
                }
            });
            if (markerToActivate) {
                updateInfoBox(selectedClub, markerToActivate);
            }
        } else {
            resetInfoBox();
        }
    } else {
        resetInfoBox();
    }
}

function renderFilteredMarkers(clubsToRender = null) {
    mapManager.renderMarkers(state.map, state.fanOutLayer, state.markers, state.allClubs, state.currentCountryId, state.leagueRanking, updateInfoBox, state.useSimpleMarkers, state.showMarkerTooltips, clubsToRender);
}

function resetInfoBox() {
    mapManager.resetActiveMarker(state.activeMarker);
    state.activeMarker = null;
    state.selectedClubId = null;
    ui.resetInfoBox();
    state.fanOutLayer.clearLayers();
    if (state.isSearchActive) {
        deactivateSearch();
    }
}

function updateInfoBox(club, marker) {
    state.fanOutLayer.clearLayers();
    state.activeMarker = mapManager.setActiveMarker(marker, state.activeMarker);
    state.selectedClubId = club.id;
    ui.updateInfoBox(club, state.allClubs, state.translations, state.currentCountryId);
}

// --- SEARCH LOGIC ---
function activateSearch() {
    state.isSearchActive = true;
    ui.dom.searchContainer.classList.add('active');
    ui.dom.countryDock.classList.add('faded');
    ui.dom.searchInput.focus();
}

function deactivateSearch() {
    state.isSearchActive = false;
    state.searchQuery = '';
    ui.dom.searchInput.value = '';
    ui.dom.searchContainer.classList.remove('active');
    ui.dom.countryDock.classList.remove('faded');
    ui.dom.searchResults.classList.remove('visible');
    ui.dom.searchClearBtn.classList.add('hidden');
    renderFilteredMarkers(); // Re-render markers based on main filters
}

function handleSearchInput(e) {
    state.searchQuery = e.target.value.toLowerCase();
    ui.dom.searchClearBtn.classList.toggle('hidden', state.searchQuery.length === 0);

    if (state.searchQuery.length > 1) {
        const searchResults = state.allClubs.filter(club =>
            club.searchSlug.includes(state.searchQuery)
        );
        ui.populateSearchResults(searchResults, state.translations, state.currentCountryId, handleSearchResultClick);
        renderFilteredMarkers(searchResults);
    } else {
        ui.dom.searchResults.classList.remove('visible');
        renderFilteredMarkers();
    }
}

function clearSearch() {
    ui.dom.searchInput.value = '';
    handleSearchInput({ target: { value: '' } });
    ui.dom.searchInput.focus();
}

function handleSearchResultClick(club) {
    deactivateSearch();
    
    // Use flyTo instead of setView for a smooth animation
    state.map.flyTo(club.stadium.position, 15, {
        duration: 1.5 // Animation duration in seconds
    });

    // Find the corresponding marker to activate it
    let markerToActivate;
    state.markers.eachLayer(layer => {
        if (layer.options.icon && layer.clubId === club.id) {
            markerToActivate = layer;
        } else if (layer.getAllChildMarkers) { // Check clusters
            layer.getAllChildMarkers().forEach(child => {
                if (child.clubId === club.id) {
                    state.map.flyTo(child.getLatLng(), 18, { duration: 1.5 });
                }
            });
        }
    });

    // A short delay ensures the map has panned before opening the infobox
    setTimeout(() => {
        if (markerToActivate) {
            updateInfoBox(club, markerToActivate);
        } else {
            // If marker was in a cluster and not immediately available, we just show the info
            updateInfoBox(club, L.marker(club.stadium.position)); // Dummy marker for state
        }
    }, 1600); // Increased delay to match animation duration
}

ui.dom.markerTooltipsSwitch.addEventListener('change', () => {
    state.showMarkerTooltips = ui.dom.markerTooltipsSwitch.checked;
    localStorage.setItem('markerTooltips', String(state.showMarkerTooltips));

    // Add this log:
    console.log(`[app.js] Tooltip switch changed. New state: ${state.showMarkerTooltips}`);

    renderFilteredMarkers();
});

// --- START THE APP ---
document.addEventListener('DOMContentLoaded', init);
