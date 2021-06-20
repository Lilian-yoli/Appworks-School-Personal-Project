const router = require("express").Router();
const { wrapAsync, authentication } = require("../../util/util");
const { getChatRecord, startAChat, updateNotification } = require("../controllers/chat_controller");

router.route("/chat")
  .post(authentication(), wrapAsync(getChatRecord));

// router.route("/api/1.0/chat")
//   .post(authentication(), wrapAsync(startAChat));

router.route("/update-notification")
  .post(authentication(), wrapAsync(updateNotification));

module.exports = router;
