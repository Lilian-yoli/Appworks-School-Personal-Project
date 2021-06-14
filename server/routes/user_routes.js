const router = require("express").Router();
const { wrapAsync, authentication } = require("../../util/util");
const { signupInfo, signinInfo, chatInfo, tokenVerify, getUserProfile, getNotification } = require("../controllers/user_controllers");

router.route("/api/1.0/user/signup")
  .post(wrapAsync(signupInfo));

router.route("/api/1.0/user/signin")
  .post(wrapAsync(signinInfo));

router.route("/api/1.0/get-id")
  .get(authentication(), wrapAsync(chatInfo));

router.route("/api/1.0/verify")
  .post(authentication(), wrapAsync(tokenVerify));

router.route("/api/1.0/user-profile")
  .get(authentication(), wrapAsync(getUserProfile));

router.route("/api/1.0/notification")
  .get(authentication(), wrapAsync(getNotification));

module.exports = router;
