const router = require("express").Router();
const {
  requestSeatsInfo,
  passengerSearch,
  passengerSearchDetail,
  setMatchedDriver,
  getPassengerItinerary,
  passengerRequestDetail,
  setPassengerTour,
  getTourInfo,
  suggestPassengerRoute,
  confirmTour,
  getPassengerHomepage
} = require("../controllers/passenger_controller");
// eslint-disable-next-line no-unused-vars
const { wrapAsync, authentication } = require("../../util/util");

router.route("/api/1.0/request-seats-info")
  .post(authentication(), wrapAsync(requestSeatsInfo));

router.route("/api/1.0/passenger-search")
  .get(wrapAsync(passengerSearch));

router.route("/api/1.0/passenger-search-detail")
  .get(wrapAsync(passengerSearchDetail));

router.route("/api/1.0/matched-driver")
  .post(authentication(), wrapAsync(setMatchedDriver));

router.route("/api/1.0/passenger-itinerary")
  .get(authentication(), wrapAsync(getPassengerItinerary));

router.route("/api/1.0/passenger-request-detail")
  .get(authentication(), wrapAsync(passengerRequestDetail));

router.route("/api/1.0/passenger-tour")
  .post(authentication(), wrapAsync(setPassengerTour));

router.route("/api/1.0/tour-info")
  .get(authentication(), wrapAsync(getTourInfo));

router.route("/api/1.0/passenger-route-suggestion")
  .get(authentication(), wrapAsync(suggestPassengerRoute));

router.route("/api/1.0/tour-confirm")
  .post(authentication(), wrapAsync(confirmTour));

router.route("/api/1.0/passenger-homepage")
  .get(wrapAsync(getPassengerHomepage));

module.exports = router;
