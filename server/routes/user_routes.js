const router = require("express").Router();
const { wrapAsync, authentication } = require("../../util/util");
const { signupInfo, signinInfo, chatInfo, tokenVerify } = require("../controllers/user_controllers");

router.route("/api/1.0/user/signup")
  .post(wrapAsync(signupInfo));

router.route("/api/1.0/user/signin")
  .post(wrapAsync(signinInfo));

router.route("/api/1.0/get-id")
  .get(authentication(), wrapAsync(chatInfo));

router.route("/api/1.0/verify")
  .get(authentication(), wrapAsync(tokenVerify));

module.exports = router;
