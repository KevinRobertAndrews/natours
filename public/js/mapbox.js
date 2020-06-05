export const displayMap = (locations) => {
  mapboxgl.accessToken =
    "pk.eyJ1Ijoia2FwcG93IiwiYSI6ImNrYWswaWM2ZDBqb2oyeHA0c2s2dnprdmYifQ.k2RjEOFwu7J9mbcdh2geQA";
  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/kappow/ckak0u1is2cew1jp6gh3c9zlf",
    //   center: [-118.0, 34.0],
    //   zoom: 8,
    //   interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create a marker
    const el = document.createElement("div");
    el.className = "marker";

    // Add the marker
    new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Extend the map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds);
};
