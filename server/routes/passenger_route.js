const router = require("express").Router();
const {
  requestSeatsInfo,
  routesBySearch,
  passengerSearchDetail,
  saveSearchPassenger,
  getPassengerItinerary,
  passengerRequestDetail,
  setPassengerTour,
  getTourInfo,
  suggestPassengerRoute,
  confirmTour,
  getPassengerHomepage,
  getPassengerItineraryDetail
} = require("../controllers/passenger_controller");
// eslint-disable-next-line no-unused-vars
const { wrapAsync, authentication, checkLogin } = require("../../util/util");

router.route("/api/1.0/request-seats-info")
  .post(authentication(), wrapAsync(requestSeatsInfo));

router.route("/api/1.0/search")
  .get(wrapAsync(routesBySearch));

router.route("/api/1.0/passenger-search-detail")
  .get(wrapAsync(passengerSearchDetail));

router.route("/api/1.0/passenger-search")
  .post(authentication(), wrapAsync(saveSearchPassenger));

router.route("/api/1.0/passenger-itinerary")
  .get(authentication(), wrapAsync(getPassengerItinerary));

router.route("/api/1.0/passenger-request-detail")
  .get(authentication(), wrapAsync(passengerRequestDetail));

router.route("/api/1.0/passenger-tour")
  .post(authentication(), wrapAsync(setPassengerTour));

router.route("/api/1.0/passenger-tour-info")
  .get(authentication(), wrapAsync(getTourInfo));

router.route("/api/1.0/passenger-route-suggestion")
  .get(authentication(), wrapAsync(suggestPassengerRoute));

router.route("/api/1.0/tour-confirm")
  .post(authentication(), wrapAsync(confirmTour));

router.route("/api/1.0/passenger-homepage")
  .get(wrapAsync(getPassengerHomepage));

router.route("/api/1.0/passenger-itinerary-detail")
  .get(checkLogin(), wrapAsync(getPassengerItineraryDetail));

module.exports = router;
