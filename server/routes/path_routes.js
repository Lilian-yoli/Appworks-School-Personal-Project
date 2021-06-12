const router = require("express").Router();
const { offerSeatsInfo, routeSuggestion, setMatchedPassengers, getDriverItineraryDetail, getDriverItinerary, driverSearch, driverSearchDetail, setDriverTour, getDriverHomepage, getTourInfo } = require("../controllers/path_controllers");
const { wrapAsync, authentication } = require("../../util/util");

router.route("/api/1.0/offer-seats-info")
  .post(authentication(), wrapAsync(offerSeatsInfo));

router.route("/api/1.0/route-suggestion")
  .get(authentication(), wrapAsync(routeSuggestion));

router.route("/api/1.0/matched-passengers")
  .post(authentication(), wrapAsync(setMatchedPassengers));

router.route("/api/1.0/driver-itinerary-detail")
  .get(authentication(), wrapAsync(getDriverItineraryDetail));

router.route("/api/1.0/driver-itinerary")
  .get(authentication(), wrapAsync(getDriverItinerary));

router.route("/api/1.0/driver-search")
  .get(authentication(), wrapAsync(driverSearch));

router.route("/api/1.0/driver-search-detail")
  .get(wrapAsync(driverSearchDetail));

// router.route("/api/1.0/matched-searched-passengers")
//   .post(wrapAsync(matchSearchedPassengers));

router.route("/api/1.0/driver-tour")
  .post(authentication(), wrapAsync(setDriverTour));

router.route("/api/1.0/driver-tour-info")
  .get(authentication(), wrapAsync(getTourInfo));

router.route("/api/1.0/driver-homepage")
  .get(wrapAsync(getDriverHomepage));

module.exports = router;
