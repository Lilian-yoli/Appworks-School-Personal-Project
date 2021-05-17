const router = require("express").Router();
const { wrapAsync } = require("../../util/util");
const { signupInfo, signinInfo } = require("../controllers/user_controllers");

router.route("/api/1.0/user/signup")
  .post(wrapAsync(signupInfo));

router.route("/api/1.0/user/signin")
  .post(wrapAsync(signinInfo));

module.exports = router;
