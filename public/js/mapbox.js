/* eslint-disable */
import mapboxgl from "mapbox-gl";

const displayMap = (locations) => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiY3JpbXNvbjcyNSIsImEiOiJjbHJhNHY5NjYwYWx6MmxzNDFzZWx3YXZ2In0._YziQB9N2-pIPCK-SOTg_A";
  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/crimson725/clra58mvq001q01rbeqt609ev",
    scrollZoom: false,
  });
  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach((loc) => {
    const el = document.createElement("div");
    el.className = "marker";
    new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    bounds.extend(loc.coordinates);
  });
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
export default displayMap;
