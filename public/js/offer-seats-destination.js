let map;
let marker = "";
function initMap () {
  const location = {
    lat: 23.69781,
    lng: 120.960515
  };

  map = new google.maps.Map(document.getElementById("map"), {
    center: location,
    zoom: 7
  });
}

function siteAuto () {
  const options = {
    componentRestrictions: { country: "tw" } // 限制在台灣範圍
  };
  const acInput = document.getElementById("autocomplete");

  const autocomplete = new google.maps.places.Autocomplete(acInput, options);
  const destination = placeMarker(autocomplete);
  console.log(origin, destination);
}

window.addEventListener("load", () => {
  initMap();
  siteAuto();
  const button = document.getElementById("btn");
  const destination = document.getElementById("autocomplete");
  button.addEventListener("click", (e) => {
    e.preventDefault();
    document.location.href = "./offer-seats.html";
  });
});

function toggleBounce () {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
  }
}

function placeMarker (autocomplete) {
  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace(); // 地點資料存進place
    console.log(place);
    // 確認回來的資料有經緯度
    if (place.geometry) {
      // 改變map的中心點
      const searchCenter = place.geometry.location;

      // panTo是平滑移動、setCenter是直接改變地圖中心
      map.panTo(searchCenter);

      // 在搜尋結果的地點上放置標記
      if (marker != "") {
        marker.setMap(null);
      }
      marker = new google.maps.Marker({
        position: searchCenter,
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP
      });

      const bounds = new google.maps.LatLngBounds();
      console.log(searchCenter);
      bounds.extend(searchCenter);
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
        const extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.01, bounds.getNorthEast().lng() + 0.01);
        const extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.01, bounds.getNorthEast().lng() - 0.01);
        bounds.extend(extendPoint1);
        bounds.extend(extendPoint2);
      }
      map.fitBounds(bounds);

      // info window
      const infowindow = new google.maps.InfoWindow({
        content: place.formatted_address
      });
      infowindow.open(map, marker);
      localStorage.setItem("driverDestination", place.formatted_address);
    }
  });
}
