# FotMap: The Interactive Football Map

**FotMap** is a web-based, interactive map designed to display the locations of football clubs across various countries. It's built with vanilla JavaScript, HTML5, and CSS3, offering a polished and user-friendly experience for football fans and groundhoppers.

The core mapping functionality is powered by the [Leaflet.js](https://leafletjs.com/) library and enhanced with plugins for marker clustering, ensuring smooth performance even with a large number of clubs.

---

## Key Features

- **Interactive Map**  
  A fully pannable and zoomable map interface.

- **Country Selector**  
  Easily switch between available countries using a floating flag panel. The map view automatically centers and zooms to the selected country.

- **Advanced Club Markers**
  - Custom theming: Markers are styled with the club's logo and brand colors.
  - Shared stadiums: Unique "split" markers for two clubs, group markers for more than two.
  - Fan-out animation: Clicking a shared-stadium marker animates and separates individual club markers for easy selection.

- **Multi-Layered Filtering**
  - Filter clubs by league.
  - Dynamically filter by major trophy wins (Championship, National Cup, League Cup).

- **Detailed Information Box**  
  A mobile-responsive panel that displays rich data for the selected club and its stadium, including an image gallery.

- **Persistent User Settings**  
  Theme (light/dark), language, and marker preferences are saved between visits using `localStorage`.

---

## Core Technologies & Libraries

- **Mapping**: [Leaflet.js](https://leafletjs.com/) & [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)
- **Front-End Logic**: JavaScript (ES6 Modules)
- **Styling & Icons**: CSS3, Font Awesome, Google Fonts (Inter)

---

## Project Structure

```
/
├── index.html              # Main application entry point
├── data/                   # All JSON data
│   ├── countries.json
│   ├── available_data.json
│   └── [country_id]/
│       ├── clubs.json
│       ├── stadiums.json
│       └── leagues.json
├── graphics/               # All static image assets (logos, flags, stadiums)
├── lang/                   # UI translation files
├── script/                 # JavaScript modules (app.js, map.js, ui.js, config.js)
└── style/                  # CSS stylesheets (default.css, dark.css)
```

---

## Credits & Attributions

- **Club Logos & Stadium Images**  
  From the *FMG Standard Logos Megapack* and *Sortitoutsi Background/Stadium Packs*. Used under fair use for informational purposes.

- **Flag Icons**  
  Created by [Freepik - Flaticon](https://www.flaticon.com/authors/freepik).

- **Map Data**  
  Map tiles by [Carto](https://carto.com/), data by [OpenStreetMap](https://www.openstreetmap.org/).

- **Application**  
  Developed by [UnaX.dk](https://unax.dk)

---

## License

This project is licensed under the **MIT License**.
