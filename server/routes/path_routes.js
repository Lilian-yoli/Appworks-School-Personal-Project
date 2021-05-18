const router = require("express").Router();
const { requestSeatsInfo, offerSeatsInfo, routeSuggestion } = require("../controllers/path_controllers");

const { wrapAsync, authentication } = require("../../util/util");

router.route("offer-seats/departure")
  .post(wrapAsync);

router.route("/api/1.0/request-seats-info")
  .post(authentication(), wrapAsync(requestSeatsInfo));

router.route("/api/1.0/offer-seats-info")
  .post(authentication(), wrapAsync(offerSeatsInfo));

router.route("/api/1.0/path-suggestion")
  .get(authentication(), wrapAsync(routeSuggestion));

module.exports = router;
