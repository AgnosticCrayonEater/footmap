import { RANK_COLORS, DEFAULT_COLOR } from './config.js';

// --- HELPER FUNCTIONS ---

function getContrastingTextColor(hex) {
    if (!hex) return '#333';
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#333' : '#FFF';
}

// --- INITIALIZATION ---

export function initMap() {
    const map = L.map("map_danish_pyramid", { zoomControl: false, preferCanvas: false });
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    map.createPane('fanOutPane');
    map.getPane('fanOutPane').style.zIndex = 700;

    const markers = L.layerGroup().addTo(map);
    const fanOutLayer = L.layerGroup().addTo(map);

    return { map, markers, fanOutLayer };
}

export function createLeaguePanes(map, leagueRanking) {
    for (let i = 0; i < 20; i++) {
        const paneName = `tier-${i}`;
        const pane = map.getPane(paneName);
        if (pane) {
            pane.remove();
        }
    }

    leagueRanking.forEach((tier, index) => {
        const paneName = `tier-${index}`;
        map.createPane(paneName);
        map.getPane(paneName).style.zIndex = 650 - index;
    });
}

export function recreateMarkersLayer(map, oldMarkers, isClustered) {
    if (oldMarkers) {
        map.removeLayer(oldMarkers);
    }
    const newMarkers = isClustered ? L.markerClusterGroup() : L.layerGroup();
    map.addLayer(newMarkers);
    return newMarkers;
}

export function updateMapTheme(map, tileLayer, TILE_LAYERS, TILE_ATTRIBUTION) {
    if (tileLayer) { map.removeLayer(tileLayer); }
    const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTileLayer = L.tileLayer(TILE_LAYERS[theme], { attribution: TILE_ATTRIBUTION[theme], maxNativeZoom: 18, maxZoom: 18 });
    newTileLayer.addTo(map);
    return newTileLayer;
}

// --- FAN-OUT LOGIC ---
function fanOutClubs(map, fanOutLayer, groupMarker, leagueRanking, currentCountryId, updateInfoBoxCallback, useSimpleMarkers, showTooltips) {
    fanOutLayer.clearLayers();
    const clubs = groupMarker.clubs;
    const angleStep = clubs.length > 1 ? 110 / (clubs.length - 1) : 0;
    const startAngle = -125;
    const fanOutDistance = 55;

    clubs.forEach((club, index) => {
        const centerPoint = map.latLngToLayerPoint(groupMarker.getLatLng());
        const angle = startAngle + (index * angleStep);
        const radian = angle * (Math.PI / 180);
        const x = centerPoint.x + fanOutDistance * Math.cos(radian);
        const y = centerPoint.y + fanOutDistance * Math.sin(radian);
        const newLatLng = map.layerPointToLatLng([x, y]);

        const fanMarker = createClubMarker(club, leagueRanking, currentCountryId, true, newLatLng, updateInfoBoxCallback, useSimpleMarkers, showTooltips);
        if (fanMarker) {
            fanOutLayer.addLayer(fanMarker);
        }
    });
}

// --- MARKER CREATION ---
function createClubMarker(club, leagueRanking, currentCountryId, isFannedOut, positionOverride, updateInfoBoxCallback, useSimpleMarkers, showTooltips) {
    if (!club.stadium || !(positionOverride || club.stadium.position)) {
        console.warn(`Club "${club.name}" (ID: ${club.id}) is missing data. Cannot create marker.`);
        return null;
    }

    let marker;
    let isCustom = false;
    const position = positionOverride || club.stadium.position;

    let rank = leagueRanking.findIndex(tier => tier.includes(club.league));
    if (rank === -1) {
        rank = leagueRanking.length;
    }
    const paneName = isFannedOut ? 'fanOutPane' : `tier-${rank}`;

    let iconHtml, iconClassName, iconSize, iconAnchor;

    if (useSimpleMarkers) {
        const markerColor = club.primaryColor || RANK_COLORS[rank] || DEFAULT_COLOR;
        const iconColor = club.secondaryColor || getContrastingTextColor(markerColor);
        iconHtml = `<div class="simple-marker-pin" style="background-color: ${markerColor};"><i class="fa-solid fa-futbol" style="color: ${iconColor};"></i></div>`;
        iconClassName = 'simple-marker-container';
        iconSize = [32, 42];
        iconAnchor = [16, 42];
    } else {
        isCustom = true;
        const logoPath = `graphics/logos/clubs/${currentCountryId}/icons/${club.id}.png`;
        const iconColor = getContrastingTextColor(club.primaryColor);
        iconHtml = `<div class="custom-marker-pin" style="background-color: ${club.primaryColor || '#CCC'}; border-color: ${club.secondaryColor || '#333'};">
                       <img class="logo-image" src="${logoPath}" alt="${club.name}" onerror="this.parentElement.classList.add('no-logo')">
                       <i class="fa-solid fa-futbol fallback-icon" style="color: ${iconColor};"></i>
                   </div>`;
        iconClassName = 'custom-marker-container';
        iconSize = [36, 48];
        iconAnchor = [18, 48];
    }

    const icon = L.divIcon({ html: iconHtml, className: iconClassName, iconSize: iconSize, iconAnchor: iconAnchor });
    marker = L.marker(position, { icon: icon, pane: paneName });

    marker.clubId = club.id;
    marker.isCustom = isCustom;
    marker.isSimple = useSimpleMarkers;

    marker.on('click', (e) => {
        updateInfoBoxCallback(club, marker);
        L.DomEvent.stopPropagation(e);
    });

    // This condition is now corrected
    if (showTooltips) {
        marker.bindTooltip(club.name, {
            direction: 'top',
            offset: L.point(0, -iconAnchor[1])
        });
    }

    return marker;
}

function createGroupMarker(clubs, leagueRanking, currentCountryId, useSimpleMarkers, fanOutCallback, showTooltips) {
    clubs.sort((a, b) => {
        const rankA = leagueRanking.findIndex(tier => tier.includes(a.league));
        const rankB = leagueRanking.findIndex(tier => tier.includes(b.league));
        return (rankA === -1 ? 99 : rankA) - (rankB === -1 ? 99 : rankB);
    });
    const primaryClub = clubs[0];
    if (!primaryClub.stadium || !primaryClub.stadium.position) return null;

    const position = primaryClub.stadium.position;
    let rank = leagueRanking.findIndex(tier => tier.includes(primaryClub.league));
    if (rank === -1) {
        rank = leagueRanking.length;
    }
    const paneName = `tier-${rank}`;

    let icon;
    let iconAnchor = [20, 52]; // Default anchor

    if (clubs.length === 2 && !useSimpleMarkers) {
        const club1 = clubs[0];
        const club2 = clubs[1];
        const logoPath1 = `graphics/logos/clubs/${currentCountryId}/icons/${club1.id}.png`;
        const logoPath2 = `graphics/logos/clubs/${currentCountryId}/icons/${club2.id}.png`;

        const markerHtml = `
            <div class="split-marker-pin">
                <div class="split-marker-half" style="background-color: ${club1.primaryColor || '#CCC'}; border-color: ${club1.secondaryColor || '#333'}; clip-path: polygon(0 0, 100% 0, 0 100%);">
                    <div class="split-marker-logo-wrapper">
                        <img src="${logoPath1}" alt="${club1.name}" class="split-marker-logo logo-image">
                    </div>
                </div>
                <div class="split-marker-half" style="background-color: ${club2.primaryColor || '#AAA'}; border-color: ${club2.secondaryColor || '#555'}; clip-path: polygon(100% 0, 100% 100%, 0 100%);">
                    <div class="split-marker-logo-wrapper">
                        <img src="${logoPath2}" alt="${club2.name}" class="split-marker-logo logo-image">
                    </div>
                </div>
            </div>
        `;
        icon = L.divIcon({
            html: markerHtml,
            className: 'split-marker-wrapper',
            iconSize: [36, 48],
            iconAnchor: [18, 48]
        });
        iconAnchor = [18, 48];

    } else if (useSimpleMarkers) {
        const markerColor = primaryClub.primaryColor || RANK_COLORS[rank] || DEFAULT_COLOR;
        const iconColor = getContrastingTextColor(markerColor);
        const markerHtml = `<div class="simple-marker-pin" style="background-color: ${markerColor}; border: 2px solid ${iconColor};">
                       <strong style="transform: rotate(45deg); color: ${iconColor};">${clubs.length}</strong>
                   </div>`;
        icon = L.divIcon({
            html: markerHtml,
            className: 'simple-marker-container',
            iconSize: [32, 42],
            iconAnchor: [16, 42]
        });
        iconAnchor = [16, 42];

    } else {
        const markerColor = primaryClub.primaryColor || '#CCC';
        const borderColor = primaryClub.secondaryColor || '#333';
        const iconColor = getContrastingTextColor(markerColor);
        const markerHtml = `<div class="custom-marker-pin" style="background-color: ${markerColor}; border-color: ${borderColor};">
                       <strong class="group-marker-text" style="color: ${iconColor};">${clubs.length}</strong>
                   </div>`;
        icon = L.divIcon({
            html: markerHtml,
            className: 'custom-marker-container',
            iconSize: [36, 48],
            iconAnchor: [18, 48]
        });
        iconAnchor = [18, 48];
    }

    const marker = L.marker(position, { icon: icon, pane: paneName });
    marker.clubs = clubs;

    marker.on('click', (e) => {
        fanOutCallback(marker);
        L.DomEvent.stopPropagation(e);
    });

    if (showTooltips) {
        const tooltipText = clubs.map(c => c.name).join('<br>');
        marker.bindTooltip(tooltipText, {
            direction: 'top',
            offset: L.point(0, -iconAnchor[1])
        });
    }

    return marker;
}


// --- MAIN RENDERING FUNCTION ---
export function renderMarkers(map, fanOutLayer, markers, allClubs, currentCountryId, leagueRanking, updateInfoBoxCallback, useSimpleMarkers, showMarkerTooltips, clubsToRender = null) {
    markers.clearLayers();
    fanOutLayer.clearLayers();

    let filteredClubs;

    if (clubsToRender) {
        filteredClubs = clubsToRender;
    } else {
        const selectedLeague = document.getElementById('leagueFilter').value;
        const accoladeCheckboxes = document.querySelectorAll('.accolade-checkbox:checked');
        const selectedAccolades = Array.from(accoladeCheckboxes).map(cb => cb.dataset.key);

        filteredClubs = allClubs.filter(club => {
            if (!club.stadium) return false;
            const leagueMatch = selectedLeague === 'all' || club.league === selectedLeague;
            let accoladeMatch = true;
            if (selectedAccolades.length > 0) {
                accoladeMatch = selectedAccolades.some(accolade => club[accolade] && club[accolade].length > 0);
            }
            return leagueMatch && accoladeMatch;
        });
    }

    const clubsByStadium = {};
    filteredClubs.forEach(club => {
        if (!club.stadiumId) return;
        if (!clubsByStadium[club.stadiumId]) {
            clubsByStadium[club.stadiumId] = [];
        }
        clubsByStadium[club.stadiumId].push(club);
    });

    const markerList = [];
    for (const stadiumId in clubsByStadium) {
        const clubs = clubsByStadium[stadiumId];
        let marker;

        if (clubs.length > 1) {
            marker = createGroupMarker(clubs, leagueRanking, currentCountryId, useSimpleMarkers, (groupMarker) => {
                // This is the updated call
                fanOutClubs(map, fanOutLayer, groupMarker, leagueRanking, currentCountryId, updateInfoBoxCallback, useSimpleMarkers, showMarkerTooltips);
            }, showMarkerTooltips);
        } else {
            marker = createClubMarker(clubs[0], leagueRanking, currentCountryId, false, null, updateInfoBoxCallback, useSimpleMarkers, showMarkerTooltips);
        }

        if (marker) {
            markerList.push(marker);
        }
    }

    if (markers.addLayers) {
        markers.addLayers(markerList);
    } else {
        markerList.forEach(marker => markers.addLayer(marker));
    }
}

// --- MARKER STATE MANAGEMENT ---
export function setActiveMarker(marker, activeMarker) {
    if (activeMarker) {
        resetActiveMarker(activeMarker);
    }

    if (marker._icon) marker._icon.classList.add('active');

    if (marker.setZIndexOffset) {
        marker.setZIndexOffset(2000);
    }
    return marker;
}

export function resetActiveMarker(activeMarker) {
    if (activeMarker) {
        if (activeMarker.setZIndexOffset) {
            activeMarker.setZIndexOffset(0);
        }
        if (activeMarker._icon) activeMarker._icon.classList.remove('active');
    }
}
