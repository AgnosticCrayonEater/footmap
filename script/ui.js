// Manages all direct DOM updates for the UI panels.

export const dom = {
    infoBox: document.getElementById('info-box'),
    filterBtn: document.getElementById('filter-btn'),
    filterBox: document.getElementById('filter-box'),
    filterLabel: document.querySelector('#filter-label strong'),
    filterFeedbackContainer: document.getElementById('filter-feedback-container'),
    filterFeedbackText: document.getElementById('filter-feedback-text'),
    filterResetBtn: document.getElementById('filter-reset-btn'),
    leagueFilter: document.getElementById('leagueFilter'),
    accoladeFilterSection: document.getElementById('accolade-filter-section'),
    accoladeFilterLabel: document.getElementById('accolade-filter-label'),
    accoladeFilters: document.getElementById('accolade-filters'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    infoBtn: document.getElementById('info-btn'),
    infoModalOverlay: document.getElementById('info-modal-overlay'),
    infoModalCloseBtn: document.getElementById('info-modal-close-btn'),
    infoModalTitle: document.getElementById('info-modal-title'),
    infoModalCountries: document.getElementById('info-modal-countries'),
    infoModalMarkers: document.getElementById('info-modal-markers'),
    infoModalFilter: document.getElementById('info-modal-filter'),
    infoModalSettings: document.getElementById('info-modal-settings'),
    creditsBtn: document.getElementById('credits-btn'),
    creditsModalOverlay: document.getElementById('credits-modal-overlay'),
    creditsModalCloseBtn: document.getElementById('credits-modal-close-btn'),
    creditsModalTitle: document.getElementById('credits-modal-title'),
    creditsModalContent: document.getElementById('credits-modal-content'),
    langDaBtn: document.querySelector('#language-select #lang-da'),
    langEnBtn: document.querySelector('#language-select #lang-en'),
    themeSwitch: document.getElementById('theme-switch'),
    settingsTitle: document.querySelector('#settings-modal .panel-title'),
    countryDock: document.getElementById('country-dock'),
    countryFlagsWrapper: document.getElementById('country-flags-wrapper'),
    scrollLeftBtn: document.getElementById('scroll-left-btn'),
    scrollRightBtn: document.getElementById('scroll-right-btn'),
    languageLabel: document.querySelector('.setting-option:nth-of-type(1) > label'),
    themeLabel: document.querySelector('.setting-option:nth-of-type(2) > label'),
    fontSwitch: document.getElementById('font-switch'),
    fontLabel: document.getElementById('font-setting-label'),
    clusterSwitch: document.getElementById('cluster-switch'),
    clusterLabel: document.querySelector('.setting-option:nth-of-type(4) > label'),
    simpleMarkersSwitch: document.getElementById('simple-markers-switch'),
    simpleMarkersLabel: document.querySelector('.setting-option:nth-of-type(5) > label'),
    markerTooltipsSwitch: document.getElementById('marker-tooltips-switch'),
    markerTooltipsLabel: document.getElementById('marker-tooltips-label'),
    searchContainer: document.getElementById('search-container'),
    searchBtn: document.getElementById('search-btn'),
    searchInput: document.getElementById('search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    searchResults: document.getElementById('search-results')
};

export function initTooltips() {
    // Default settings for all tooltips
    const defaultTooltipProps = {
        animation: 'fade',
        delay: [200, 0],
        theme: 'custom',
    };

    // Initialize tooltips for the bottom-left buttons and zoom controls to appear on the right
    tippy('#settings-container button, .leaflet-control-zoom a', {
        ...defaultTooltipProps,
        placement: 'right',
    });

    // Initialize all other tooltips (search, country flags) with default (bottom) placement
    tippy('#search-btn, #country-dock button', {
        ...defaultTooltipProps,
        // No 'placement' needed, 'bottom' is the default
    });
}

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

function formatClubFullname(fullname) {
    if (!fullname) return '';
    const maxLength = 35;
    if (fullname.length <= maxLength) {
        return fullname;
    }
    let breakPoint = Math.floor(fullname.length / 2);
    while (breakPoint < fullname.length && fullname[breakPoint] !== ' ') {
        breakPoint++;
    }
    if (breakPoint === fullname.length) {
        breakPoint = Math.floor(fullname.length / 2);
        while (breakPoint > 0 && fullname[breakPoint] !== ' ') {
            breakPoint--;
        }
    }
    if (breakPoint > 0) {
        return fullname.substring(0, breakPoint) + '<br>' + fullname.substring(breakPoint + 1);
    }
    return fullname;
}


export function toggleInfoModal() {
    dom.infoModalOverlay.classList.toggle('visible');
}

export function toggleCreditsModal() {
    dom.creditsModalOverlay.classList.toggle('visible');
}

export function toggleFilterModal() {
    if (dom.settingsModal.classList.contains('visible')) {
        dom.settingsModal.classList.remove('visible');
    }
    dom.filterBox.classList.toggle('visible');
}

export function toggleSettingsModal() {
    if (dom.filterBox.classList.contains('visible')) {
        dom.filterBox.classList.remove('visible');
    }
    dom.settingsModal.classList.toggle('visible');
}

export function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    dom.themeSwitch.checked = savedTheme === 'dark';
}

export function applySavedFontSetting() {
    const savedFont = localStorage.getItem('font') || 'Inter';
    dom.fontSwitch.value = savedFont;
}

export function applySavedClusterSetting() {
    const savedCluster = localStorage.getItem('cluster') || 'false';
    dom.clusterSwitch.checked = savedCluster === 'true';
}

export function applySavedSimpleMarkersSetting() {
    const savedSimpleMarkers = localStorage.getItem('simpleMarkers') || 'false';
    dom.simpleMarkersSwitch.checked = savedSimpleMarkers === 'true';
}

export function applySavedMarkerTooltipsSetting() {
    const savedMarkerTooltips = localStorage.getItem('markerTooltips') || 'false';
    dom.markerTooltipsSwitch.checked = savedMarkerTooltips === 'true';
}

export function populateCountryDock(countries, switchCountryCallback, resetViewCallback) {
    const wrapper = dom.countryFlagsWrapper;
    wrapper.innerHTML = '';
    countries.forEach(country => {
        const button = document.createElement('button');
        button.dataset.countryId = country.id;
        button.setAttribute('data-tippy-content', country.name);
        button.innerHTML = `<img src="graphics/flags/${country.id}.png" alt="${country.name} Flag">`;

        if (country.hasData) {
            button.addEventListener('click', () => switchCountryCallback(country.id));
            button.addEventListener('dblclick', () => resetViewCallback(country.id));
        } else {
            button.classList.add('disabled');
            button.setAttribute('data-tippy-content', `${country.name} (data not available yet)`);
        }

        wrapper.appendChild(button);
    });

    initTooltips(); // This call remains to handle the country flags
}

export function updateActiveCountryButton(countryId) {
    const buttons = dom.countryFlagsWrapper.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.countryId === countryId);
    });
}


export function updateLanguageButtons(lang) {
    document.documentElement.lang = lang;
    dom.langDaBtn.classList.toggle('active', lang === 'da');
    dom.langEnBtn.classList.toggle('active', lang === 'en');
}

export function updateStaticText(translations) {
    if (translations.filter) {
        dom.filterLabel.textContent = translations.filter.label;
        dom.accoladeFilterLabel.textContent = translations.filter.accoladeLabel;
    }
    document.title = `Football Map`;
    if (translations.settings) {
        dom.settingsTitle.textContent = translations.settings.title;
        dom.languageLabel.textContent = translations.settings.languageLabel;
        dom.themeLabel.textContent = translations.settings.themeLabel;
        dom.fontLabel.textContent = translations.settings.fontLabel;
        dom.clusterLabel.textContent = translations.settings.clusterLabel;
        dom.simpleMarkersLabel.textContent = translations.settings.simpleMarkersLabel;
        dom.markerTooltipsLabel.textContent = translations.settings.markerTooltipsLabel;

        if (translations.settings.tooltips) {
            dom.infoBtn.setAttribute('data-tippy-content', translations.settings.tooltips.info);
            dom.creditsBtn.setAttribute('data-tippy-content', translations.settings.tooltips.credits);
            dom.filterBtn.setAttribute('data-tippy-content', translations.settings.tooltips.filter);
            dom.settingsBtn.setAttribute('data-tippy-content', translations.settings.tooltips.settings);
        }
    }
    if (translations.search) {
        dom.searchBtn.setAttribute('data-tippy-content', translations.search.title);
        dom.searchInput.placeholder = translations.search.placeholder;
    }
    if (translations.infoModal) {
        dom.infoModalTitle.textContent = translations.infoModal.title;
        dom.infoModalCountries.innerHTML = translations.infoModal.countries;
        dom.infoModalMarkers.innerHTML = translations.infoModal.markers;
        dom.infoModalFilter.innerHTML = translations.infoModal.filter;
        dom.infoModalSettings.innerHTML = translations.infoModal.settings;
    }
    if (translations.creditsModal) {
        dom.creditsModalTitle.textContent = translations.creditsModal.title;
    }
    if (translations.mapControls) {
        document.querySelector('.leaflet-control-zoom-in')?.setAttribute('data-tippy-content', translations.mapControls.zoomIn);
        document.querySelector('.leaflet-control-zoom-out')?.setAttribute('data-tippy-content', translations.mapControls.zoomOut);
    }

    // Re-initialize all tooltips after updating the text
    initTooltips();
}

export function populateCredits(translations, attributions) {
    let contentHtml = '';
    if (attributions.sections) {
        attributions.sections.forEach(section => {
            contentHtml += `<div class="credit-section">`;
            contentHtml += `<h4>${section.title}</h4>`;
            let text = section.text;
            if (section.link) {
                text += ` <a href="${section.link}" target="_blank" rel="noopener noreferrer">${translations.creditsModal.linkText || 'Source'}</a>`;
            }
            contentHtml += `<p>${text}</p>`;
            contentHtml += `</div>`;
        });
    }
    dom.creditsModalContent.innerHTML = contentHtml;
}

export function populateFilter(leagueRanking, allClubs, translations) {
    // 1. Preserve the current filter selections
    const selectedLeague = dom.leagueFilter.value;
    const checkedAccolades = Array.from(document.querySelectorAll('.accolade-checkbox:checked'))
        .map(cb => cb.dataset.key);

    // --- Populate Leagues (this part is mostly the same) ---
    dom.leagueFilter.innerHTML = '';
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = `${translations.filter?.allOption || 'All'} (${allClubs.length})`;
    dom.leagueFilter.appendChild(allOption);

    const allLeagues = leagueRanking.flat();

    allLeagues.forEach(league => {
        const count = allClubs.filter(club => club.league === league).length;
        if (count > 0) {
            const option = document.createElement('option');
            option.value = league;
            const displayLeague = translations.leagues?.[league] || league;
            option.textContent = `${displayLeague} (${count})`;
            dom.leagueFilter.appendChild(option);
        }
    });

    // --- Populate Accolades (this part is mostly the same) ---
    dom.accoladeFilters.innerHTML = '';
    const accoladeTypes = [
        { key: 'championships', label: translations.infoBoxKeys.championships },
        { key: 'nationalCup', label: translations.infoBoxKeys.nationalCup },
        { key: 'leagueCup', label: translations.infoBoxKeys.leagueCup }
    ];

    let hasAccolades = false;
    accoladeTypes.forEach(type => {
        const hasData = allClubs.some(club => club[type.key] && club[type.key].length > 0);
        if (hasData) {
            hasAccolades = true;
            const checkboxHtml = `
                <div class="accolade-option">
                    <input type="checkbox" id="filter-${type.key}" class="accolade-checkbox" data-key="${type.key}">
                    <label for="filter-${type.key}">${type.label}</label>
                </div>
            `;
            dom.accoladeFilters.innerHTML += checkboxHtml;
        }
    });

    dom.accoladeFilterSection.style.display = hasAccolades ? 'block' : 'none';

    // 2. Restore the previous filter selections
    dom.leagueFilter.value = selectedLeague;
    checkedAccolades.forEach(key => {
        const checkbox = document.querySelector(`.accolade-checkbox[data-key="${key}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
}

export function resetInfoBox() {
    dom.infoBox.classList.remove('visible');
    dom.countryDock.classList.remove('faded');
    dom.searchContainer.style.display = 'flex';
    dom.infoBox.innerHTML = ''; // Clear content to prevent dead zones
}

export function updateInfoBox(club, allClubs, translations, currentCountryId) {
    if (!club || !club.stadium) {
        resetInfoBox();
        return;
    }

    dom.searchContainer.style.display = 'none';

    const t = translations.infoBoxKeys;
    const clubTownName = translations.towns?.[club.town] || club.town;
    const stadium = club.stadium;

    const logoPath = `graphics/logos/clubs/${currentCountryId}/${club.id}.png`;
    const initials = club.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    const bgColor = (club.primaryColor || '#CCCCCC').replace('#', '');
    const textColor = (club.secondaryColor || '#FFFFFF').replace('#', '');
    const placeholderUrl = `https://placehold.co/100x100/${bgColor}/${textColor}?text=${initials}`;
    const clubImageHtml = `<img src="${logoPath}" alt="${club.name} Logo" onerror="this.onerror=null; this.src='${placeholderUrl}';">`;

    let websiteHtml = '';
    if (club.website && club.website !== "#") {
        websiteHtml = `<a href="${club.website}" class="website-button" target="_blank" rel="noopener noreferrer" title="${t.website}"><i class="fa-solid fa-globe"></i></a>`;
    }

    let championshipsHtml = '';
    if (club.championships && club.championships.length > 0) {
        championshipsHtml = `<strong>${t.championships}:</strong> ${club.championships.length} (${club.championships.join(', ')})<br>`;
    }

    let nationalCupHtml = '';
    if (club.nationalCup && club.nationalCup.length > 0) {
        nationalCupHtml = `<strong>${t.nationalCup}:</strong> ${club.nationalCup.length} (${club.nationalCup.join(', ')})<br>`;
    }

    let leagueCupHtml = '';
    if (club.leagueCup && club.leagueCup.length > 0) {
        leagueCupHtml = `<strong>${t.leagueCup}:</strong> ${club.leagueCup.length} (${club.leagueCup.join(', ')})<br>`;
    }

    let nicknameHtml = club.nickname ? `<p class="club-nickname">"${club.nickname}"</p>` : '';
    const formattedFullname = formatClubFullname(club.fullname);

    const clubDetailsHtml = `
        <div class="info-box-header">
            <strong class="club-name">${club.name}</strong>
        </div>
        <div class="info-box-content">
            ${websiteHtml}
            ${clubImageHtml}
            ${nicknameHtml}
            <p class="club-fullname">${formattedFullname}</p>
            <p class="club-details">
                <strong>${t.town}:</strong> ${clubTownName}<br>
                <strong>${t.league}:</strong> ${translations.leagues?.[club.league] || club.league}<br>
                <strong>${t.founded}:</strong> ${club.founded}<br>
                ${championshipsHtml}
                ${nationalCupHtml}
                ${leagueCupHtml}
            </p>
        </div>
    `;

    const stadiumTownName = translations.towns?.[stadium.town] || stadium.town;

    let stadiumImageHtml = '';
    let galleryControlsHtml = '';
    if (stadium.imageCount && stadium.imageCount > 0) {
        let images = '';
        let buttons = '';
        for (let i = 1; i <= stadium.imageCount; i++) {
            const stadiumImagePath = `graphics/stadiums/${currentCountryId}/${stadium.id}_${i}.jpg`;
            images += `<img class="stadium-image" data-index="${i - 1}" src="${stadiumImagePath}" alt="${stadium.name} view ${i}" style="opacity: ${i === 1 ? '1' : '0'}; z-index: ${i === 1 ? '1' : '0'}; pointer-events: ${i === 1 ? 'auto' : 'none'};">`;
            buttons += `<li><button class="gallery-button" data-index="${i - 1}">${i}</button></li>`;
        }
        stadiumImageHtml = `<div class="stadium-image-reel">${images}</div>`;
        galleryControlsHtml = `<ul class="gallery-controls">${buttons}</ul>`;
    }

    let stadiumDetailsList = `<p class="stadium-details-list">`;
    if (stadium.realName) {
        stadiumDetailsList += `<strong>${t.stadiumName}:</strong> ${stadium.realName}<br>`;
    }
    if (stadium.capacity) {
        stadiumDetailsList += `<strong>${t.capacity}:</strong> ${stadium.capacity.toLocaleString()}<br>`;
    }
    if (stadium.built) {
        stadiumDetailsList += `<strong>${t.built}:</strong> ${stadium.built}<br>`;
    }
    stadiumDetailsList += `<strong>${t.town}:</strong> ${stadiumTownName}<br>`;
    stadiumDetailsList += `</p>`;

    const otherClubs = allClubs.filter(c => c.stadiumId === club.stadiumId && c.id !== club.id);
    let otherClubsHtml = '';
    if (otherClubs.length > 0) {
        otherClubsHtml = `
            <div class="other-clubs-container">
                <strong>${t.otherClubs}</strong>
                <ul class="other-clubs-list">
                    ${otherClubs.map(c => {
                        const logoPath = `graphics/logos/clubs/${c.country}/icons/${c.id}.png`;
                        return `<li><img src="${logoPath}" class="other-club-icon" alt="${c.name} logo"> ${c.name}</li>`;
                    }).join('')}
                </ul>
            </div>
        `;
    }

    const stadiumDetailsHtml = `
        <div class="stadium-info-container">
            <h3 class="stadium-title">${stadium.name}</h3>
            ${stadiumImageHtml}
            ${galleryControlsHtml}
            ${stadiumDetailsList}
            ${otherClubsHtml}
        </div>
    `;

    dom.infoBox.innerHTML = clubDetailsHtml + '<hr class="info-divider">' + stadiumDetailsHtml;

    const headerDiv = dom.infoBox.querySelector('.info-box-header');
    const clubNameEl = dom.infoBox.querySelector('.club-name');
    let primaryColor = club.primaryColor;
    let secondaryColor = club.secondaryColor;
    const isLightMode = !document.body.classList.contains('dark-mode');
    const isPrimaryWhite = primaryColor && (primaryColor.toUpperCase() === '#FFF' || primaryColor.toUpperCase() === '#FFFFFF');

    if (isLightMode && isPrimaryWhite) {
        primaryColor = club.secondaryColor;
        secondaryColor = club.primaryColor;
    }

    if (primaryColor) {
        const headerTextColor = secondaryColor || getContrastingTextColor(primaryColor);
        clubNameEl.style.backgroundColor = primaryColor;
        clubNameEl.style.color = headerTextColor;
    } else {
        headerDiv.classList.add('no-theme');
    }

    const galleryButtons = dom.infoBox.querySelectorAll('.gallery-button');
    if (galleryButtons.length > 0) {
        const images = dom.infoBox.querySelectorAll('.stadium-image');

        const setActiveButton = (button) => {
            galleryButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.backgroundColor = '';
                btn.style.color = '';
                btn.style.borderColor = '';
            });
            button.classList.add('active');
            button.style.backgroundColor = primaryColor;
            button.style.color = secondaryColor;
            button.style.borderColor = primaryColor;
        };

        const firstButton = galleryButtons[0];
        setActiveButton(firstButton);

        galleryButtons.forEach(button => {
            button.addEventListener('click', () => {
                const clickedIndex = button.dataset.index;

                images.forEach(img => {
                    img.style.opacity = '0';
                    img.style.zIndex = '0';
                    img.style.pointerEvents = 'none';
                });
                const targetImage = dom.infoBox.querySelector(`.stadium-image[data-index="${clickedIndex}"]`);
                if (targetImage) {
                    targetImage.style.opacity = '1';
                    targetImage.style.zIndex = '1';
                    targetImage.style.pointerEvents = 'auto';
                }

                setActiveButton(button);
            });
        });
    }

    dom.infoBox.classList.add('visible');

    if (window.innerWidth < 768) {
        dom.countryDock.classList.add('faded');
    }
}

export function populateSearchResults(results, translations, currentCountryId, onResultClick) {
    dom.searchResults.innerHTML = '';
    if (results.length > 0) {
        results.forEach(club => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.dataset.clubId = club.id;

            const logoPath = `graphics/logos/clubs/${currentCountryId}/icons/${club.id}.png`;
            const leagueName = translations.leagues?.[club.league] || club.league;

            item.innerHTML = `
                <img src="${logoPath}" alt="${club.name}" onerror="this.style.display='none'">
                <div class="search-result-text">
                    <div class="name">${club.name}</div>
                    <div class="league">${leagueName}</div>
                </div>
            `;
            item.addEventListener('click', () => onResultClick(club));
            dom.searchResults.appendChild(item);
        });
        dom.searchResults.classList.add('visible');
    } else {
        dom.searchResults.classList.remove('visible');
    }
}

export function updateFilterFeedback(leagueFilter, accoladeCheckboxes, translations) {
    const leagueValue = leagueFilter.value;
    const selectedLeagueText = leagueFilter.options[leagueFilter.selectedIndex].text.replace(/\s*\(\d+\)$/, '');

    const activeAccoladeNames = Array.from(accoladeCheckboxes)
        .map(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`);
            return label ? label.textContent : '';
        });

    let feedbackParts = [];

    // Build the descriptive text based on what's selected
    if (leagueValue !== 'all') {
        feedbackParts.push(selectedLeagueText);
    }
    if (activeAccoladeNames.length > 0) {
        const trophyText = `${translations.filterFeedback.withTrophies} (${activeAccoladeNames.join(', ')})`;
        feedbackParts.push(trophyText);
    }

    if (feedbackParts.length > 0) {
        const feedbackText = `${translations.filterFeedback.showing}: ${feedbackParts.join(` ${translations.filterFeedback.and} `)}`;
        dom.filterFeedbackText.textContent = feedbackText;
        dom.filterFeedbackContainer.classList.add('visible');
    } else {
        dom.filterFeedbackContainer.classList.remove('visible');
    }
}