const router = require("express").Router();
const { wrapAsync, authentication } = require("../../util/util");
const { signupInfo, signinInfo, tokenVerify, getUserProfile } = require("../controllers/user_controller");

router.route("/user/signup")
  .post(wrapAsync(signupInfo));

router.route("/user/signin")
  .post(wrapAsync(signinInfo));

router.route("/verify")
  .post(authentication(), wrapAsync(tokenVerify));

router.route("/user-profile")
  .get(authentication(), wrapAsync(getUserProfile));

module.exports = router;
