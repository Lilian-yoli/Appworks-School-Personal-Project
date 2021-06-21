const router = require("express").Router();
const {
  requestSeatsInfo,
  routesBySearch,
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
const { wrapAsync, authentication, checkLogin, verifyreqQuery } = require("../../util/util");

router.route("/request-seats-info")
  .post(authentication(), wrapAsync(requestSeatsInfo));

router.route("/search")
  .get(wrapAsync(routesBySearch));

router.route("/passenger-search")
  .post(authentication(), verifyreqQuery(), wrapAsync(saveSearchPassenger));

router.route("/passenger-itinerary")
  .get(authentication(), wrapAsync(getPassengerItinerary));

// router.route("/passenger-request-detail")
//   .get(authentication(), wrapAsync(passengerRequestDetail));

router.route("/passenger-tour")
  .post(authentication(), wrapAsync(setPassengerTour));

router.route("/passenger-tour-info")
  .get(authentication(), verifyreqQuery(), wrapAsync(getTourInfo));

router.route("/passenger-route-suggestion")
  .get(authentication(), verifyreqQuery(), wrapAsync(suggestPassengerRoute));

router.route("/tour-confirm")
  .post(authentication(), verifyreqQuery(), wrapAsync(confirmTour));

router.route("/passenger-homepage")
  .get(wrapAsync(getPassengerHomepage));

router.route("/passenger-itinerary-detail")
  .get(checkLogin(), verifyreqQuery(), wrapAsync(getPassengerItineraryDetail));

module.exports = router;
