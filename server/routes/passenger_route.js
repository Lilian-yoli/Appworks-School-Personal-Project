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

router.route("/request-seats-info")
  .post(authentication(), wrapAsync(requestSeatsInfo));

router.route("/search")
  .get(wrapAsync(routesBySearch));

router.route("/passenger-search-detail")
  .get(wrapAsync(passengerSearchDetail));

router.route("/passenger-search")
  .post(authentication(), wrapAsync(saveSearchPassenger));

router.route("/passenger-itinerary")
  .get(authentication(), wrapAsync(getPassengerItinerary));

router.route("/passenger-request-detail")
  .get(authentication(), wrapAsync(passengerRequestDetail));

router.route("/passenger-tour")
  .post(authentication(), wrapAsync(setPassengerTour));

router.route("/passenger-tour-info")
  .get(authentication(), wrapAsync(getTourInfo));

router.route("/passenger-route-suggestion")
  .get(authentication(), wrapAsync(suggestPassengerRoute));

router.route("/tour-confirm")
  .post(authentication(), wrapAsync(confirmTour));

router.route("/passenger-homepage")
  .get(wrapAsync(getPassengerHomepage));

router.route("/passenger-itinerary-detail")
  .get(checkLogin(), wrapAsync(getPassengerItineraryDetail));

module.exports = router;
