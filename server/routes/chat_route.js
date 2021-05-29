const router = require("express").Router();
const { wrapAsync, authentication } = require("../../util/util");
const { getChatRecord, startAChat } = require("../controllers/chat_controller");

router.route("/api/1.0/chat")
  .post(authentication(), wrapAsync(getChatRecord));

// router.route("/api/1.0/chat")
//   .post(authentication(), wrapAsync(startAChat));

module.exports = router;
