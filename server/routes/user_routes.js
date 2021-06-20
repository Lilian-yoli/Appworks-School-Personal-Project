const router = require("express").Router();
const { wrapAsync, authentication } = require("../../util/util");
const { signupInfo, signinInfo, chatInfo, tokenVerify, getUserProfile, getNotification } = require("../controllers/user_controllers");

router.route("/user/signup")
  .post(wrapAsync(signupInfo));

router.route("/user/signin")
  .post(wrapAsync(signinInfo));

// router.route("/get-id")
//   .get(authentication(), wrapAsync(chatInfo));

router.route("/verify")
  .post(authentication(), wrapAsync(tokenVerify));

router.route("/user-profile")
  .get(authentication(), wrapAsync(getUserProfile));

router.route("/notification")
  .get(authentication(), wrapAsync(getNotification));

module.exports = router;
