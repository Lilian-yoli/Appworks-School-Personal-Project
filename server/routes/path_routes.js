const router = require("express").Router();
const { requestSeatsInfo } = require("../controllers/path_controllers");

const { wrapAsync, authentication } = require("../../util/util");

router.route("offer-seats/departure")
  .post(wrapAsync);

router.route("/api/1.0/request-seats-info")
  .post(authentication(), wrapAsync(requestSeatsInfo));

module.exports = router;
