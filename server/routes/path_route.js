const router = require("express").Router();
const { offerSeatsInfo, routeSuggestion, setMatchedPassengers, getDriverItineraryDetail, getDriverItinerary, driverSearch, driverSearchDetail, setDriverTour, getDriverHomepage, getTourInfo, selectDriverRoute } = require("../controllers/path_controller");
const { wrapAsync, authentication, checkLogin, verifyreqQuery } = require("../../util/util");

router.route("/offer-seats-info")
  .post(authentication(), wrapAsync(offerSeatsInfo));

router.route("/route-suggestion")
  .get(authentication(), verifyreqQuery(), wrapAsync(routeSuggestion));

router.route("/matched-passengers")
  .post(authentication(), wrapAsync(setMatchedPassengers));

router.route("/driver-itinerary-detail")
  .get(checkLogin(), verifyreqQuery(), wrapAsync(getDriverItineraryDetail));

router.route("/driver-itinerary")
  .get(authentication(), wrapAsync(getDriverItinerary));

// router.route("/api/1.0/matched-searched-passengers")
//   .post(wrapAsync(matchSearchedPassengers));

router.route("/driver-tour")
  .post(authentication(), wrapAsync(setDriverTour));

router.route("/driver-tour-info")
  .get(authentication(), verifyreqQuery(), wrapAsync(getTourInfo));

router.route("/driver-homepage")
  .get(wrapAsync(getDriverHomepage));

router.route("/driver-route-selection")
  .post(authentication(), wrapAsync(selectDriverRoute));

module.exports = router;
