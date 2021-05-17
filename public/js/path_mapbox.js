mapboxgl.accessToken = "pk.eyJ1IjoibGlsaWFueW9saSIsImEiOiJja29sZzBndzEwMjBrMm9zMzN6OGNteXdsIn0.4Kb5rPLA6boL20_NVgmJMw";

const geojson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [121.5687657, 25.0484723]
      },
      properties: {
        title: "Mapbox",
        description: "Washington, D.C."
      }
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [121.5654442, 25.0346199]
      },
      properties: {
        title: "Mapbox",
        description: "San Francisco, California"
      }
    }
  ]
};

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: [geojson.features[0].geometry.coordinates[0] + geojson.features[1].geometry.coordinates[0] / 2, geojson.features[0].geometry.coordinates[1] + geojson.features[1].geometry.coordinates[1] / 2],
  zoom: 8
});

// add markers to map
geojson.features.forEach(function (marker) {
  // create a HTML element for each feature
  const el = document.createElement("div");
  el.className = "marker";

  // make a marker for each feature and add it to the map
  new mapboxgl.Marker(el)
    .setLngLat(marker.geometry.coordinates)
    .setPopup(
      new mapboxgl.Popup({ offset: 25 }) // add popups
        .setHTML(
          "<h3>" +
          marker.properties.title +
          "</h3><p>" +
          marker.properties.description +
          "</p>"
        )
    )
    .addTo(map);
});

map.fitBounds([
  [120.48, 23.58 - 0.001],
  [120.482, 23.60 + 0.001]
]);

map.addControl(
  new MapboxDirections({
    accessToken: mapboxgl.accessToken
  }),
  "top-left"
);
