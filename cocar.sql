-- MySQL dump 10.13  Distrib 8.0.23, for macos10.15 (x86_64)
--
-- Host: localhost    Database: cocar
-- ------------------------------------------------------
-- Server version	8.0.23

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `chat_msg`
--

DROP TABLE IF EXISTS `chat_msg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_msg` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int DEFAULT NULL,
  `receiver_id` int DEFAULT NULL,
  `msg` varchar(1000) DEFAULT NULL,
  `send_at` varchar(255) DEFAULT NULL,
  `room` varchar(255) DEFAULT NULL,
  `unread` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_msg`
--

LOCK TABLES `chat_msg` WRITE;
/*!40000 ALTER TABLE `chat_msg` DISABLE KEYS */;
INSERT INTO `chat_msg` VALUES (10,25,24,'123','1622176494','24WITH25',0),(11,24,25,'456','1622176502','24WITH25',0),(12,24,25,'123','1622176601','24WITH25',1),(13,25,24,'123','1622176851','24WITH25',0),(14,25,24,'123','1622181724','24WITH25',0),(15,24,25,'456','1622181734','24WITH25',1),(16,25,24,'123','1622181804','24WITH25',0),(17,24,25,'456','1622181811','24WITH25',0),(18,24,25,'123','1622181818','24WITH25',1),(19,25,24,'123','1622182185','24WITH25',0),(20,24,25,'456','1622182197','24WITH25',1),(21,24,25,'789','1622182211','24WITH25',1),(23,24,NULL,'123','1622212309','',1),(24,25,24,'456','1622212313','24WITH25',0),(25,25,24,'657','1622212317','24WITH25',0);
/*!40000 ALTER TABLE `chat_msg` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offered_routes`
--

DROP TABLE IF EXISTS `offered_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offered_routes` (
  `route_id` int NOT NULL AUTO_INCREMENT,
  `origin` varchar(255) DEFAULT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `available_seats` int DEFAULT NULL,
  `date` int DEFAULT NULL,
  `time` varchar(45) DEFAULT NULL,
  `driver_email` varchar(255) DEFAULT NULL,
  `requested_routes_id` varchar(255) DEFAULT NULL,
  `origin_coordinate` point DEFAULT NULL,
  `destination_coordinate` point DEFAULT NULL,
  `fee` int DEFAULT NULL,
  `seats_left` int DEFAULT NULL,
  `routeTS` varchar(255) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`route_id`),
  UNIQUE KEY `offer_routes_id_UNIQUE` (`route_id`)
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offered_routes`
--

LOCK TABLES `offered_routes` WRITE;
/*!40000 ALTER TABLE `offered_routes` DISABLE KEYS */;
INSERT INTO `offered_routes` VALUES (62,'å°åŒ—','èŠ±è“®',3,1621468800,'8:00','test@test.com','0',_binary '\0\0\0\0\0\0\0\ÌÄ¾®p9@…¸\Í/d^@',_binary '\0\0\0\0\0\0\0‘tr¶ü7@_MT%€f^@',300,3,NULL,NULL),(63,'å°åŒ—','èŠ±è“®',2,1621468800,'9:00','test@test.com','0',_binary '\0\0\0\0\0\0\0\ÌÄ¾®p9@…¸\Í/d^@',_binary '\0\0\0\0\0\0\0‘tr¶ü7@_MT%€f^@',300,2,NULL,NULL),(64,'å°åŒ—','èŠ±è“®',3,1622160000,'8:00','test@test.com','0',_binary '\0\0\0\0\0\0\0\ÌÄ¾®p9@…¸\Í/d^@',_binary '\0\0\0\0\0\0\0‘tr¶ü7@_MT%€f^@',300,3,NULL,NULL),(65,'å°åŒ—','èŠ±è“®',4,1622160000,'8:00','test@test.com','0',_binary '\0\0\0\0\0\0\0\ÌÄ¾®p9@…¸\Í/d^@',_binary '\0\0\0\0\0\0\0‘tr¶ü7@_MT%€f^@',300,4,NULL,NULL),(66,'å°åŒ—','å®œè˜­è»Šç«™',3,1622160000,'8:00','test@test.com','0',_binary '\0\0\0\0\0\0\0\ÌÄ¾®p9@…¸\Í/d^@',_binary '\0\0\0\0\0\0\0‹3†9AÁ8@\Ùma\'†p^@',200,3,NULL,NULL),(67,'å°åŒ—','å®œè˜­è»Šç«™',3,1622160000,'8:00','test@test.com','0',_binary '\0\0\0\0\0\0\0\ÌÄ¾®p9@…¸\Í/d^@',_binary '\0\0\0\0\0\0\0‹3†9AÁ8@\Ùma\'†p^@',200,-2,NULL,NULL),(68,'å°åŒ—','å®œè˜­è»Šç«™',4,1622160000,'8:00','test@test.com','0',_binary '\0\0\0\0\0\0\0\ÌÄ¾®p9@…¸\Í/d^@',_binary '\0\0\0\0\0\0\0‹3†9AÁ8@\Ùma\'†p^@',200,1,NULL,NULL),(69,'å°åŒ—','è‹—æ —',3,1622160000,'08:00:00','test@test.com','0',_binary '\0\0\0\0\0\0\0\ÌÄ¾®p9@…¸\Í/d^@',_binary '\0\0\0\0\0\0\0`‰”f8@Vdt@’4^@',200,-2,'2021-05-28 08:00:00',NULL),(70,'å°åŒ—è»Šç«™','èŠ±è“®è»Šç«™',3,1622131200,'10:00','test11@test.com','0',_binary '\0\0\0\0\0\0\0\ä$\Ø9@™\õ½\áa^@',_binary '\0\0\0\0\0\0\0.\Ê\ÇIş7@€\×g\Îzf^@',300,6,'2021-05-28 10:00:00',24),(71,'å°åŒ—å—æ¸¯','èŠ±è“®å¤ªé­¯é–£',2,1622131200,'08:00:00','test11@test.com','0',_binary '\0\0\0\0\0\0\0\0Oÿş9@Ù¾6\Ñg^@',_binary '\0\0\0\0\0\0\0fÎ¡18@<™Éh_^@',350,10,'2021-05-28 08:00:00',NULL),(76,'å°åŒ—è»Šç«™','é¹¿æ¸¯è€è¡—',3,1622131200,'08:00','test13@test.com','0',_binary '\0\0\0\0\0\0\0\ä$\Ø9@™\õ½\áa^@',_binary '\0\0\0\0\0\0\0\ï#\àO8@…*´^@',250,1,'2021-05-28 00:00:03',NULL),(88,'å°åŒ—è»Šç«™','ç‰å±±å¡”å¡”åŠ ',3,1622131200,'08:00','test11@test.com','0',_binary '\0\0\0\0\0\0\0\ä$\Ø9@™\õ½\áa^@',_binary '\0\0\0\0\0\0\0I\îU\Ğy7@\Õ\'}™9^@',400,1,'2021-05-28 08:00:00',NULL),(89,'å°åŒ—è»Šç«™','ç‰å±±å¡”å¡”åŠ ',3,1622131200,'08:00','test2@test.com','0',_binary '\0\0\0\0\0\0\0\ä$\Ø9@™\õ½\áa^@',_binary '\0\0\0\0\0\0\0I\îU\Ğy7@\Õ\'}™9^@',400,3,'2021-05-28 08:00:00',NULL),(90,'å°åŒ—è»Šç«™','ç‰å±±å¡”å¡”åŠ ',3,1622131200,'08:00',NULL,NULL,_binary '\0\0\0\0\0\0\0\ä$\Ø9@™\õ½\áa^@',_binary '\0\0\0\0\0\0\0I\îU\Ğy7@\Õ\'}™9^@',400,25,'2021-05-28 08:00:00',25),(91,'å°åŒ—è»Šç«™','ç‰å±±å¡”å¡”åŠ ',4,1622131200,'08:00',NULL,NULL,_binary '\0\0\0\0\0\0\0\ä$\Ø9@™\õ½\áa^@',_binary '\0\0\0\0\0\0\0I\îU\Ğy7@\Õ\'}™9^@',400,4,'2021-05-28 08:00:00',25);
/*!40000 ALTER TABLE `offered_routes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `passenger_search_route`
--

DROP TABLE IF EXISTS `passenger_search_route`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `passenger_search_route` (
  `route_id` int NOT NULL AUTO_INCREMENT,
  `destination` varchar(255) DEFAULT NULL,
  `date` varchar(255) DEFAULT NULL,
  `passenger_email` varchar(255) DEFAULT NULL,
  `persons` int DEFAULT NULL,
  PRIMARY KEY (`route_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `passenger_search_route`
--

LOCK TABLES `passenger_search_route` WRITE;
/*!40000 ALTER TABLE `passenger_search_route` DISABLE KEYS */;
INSERT INTO `passenger_search_route` VALUES (1,NULL,NULL,'test@test.com',1),(2,NULL,NULL,'test@test.com',1),(3,NULL,NULL,'test12@gmail.com',1);
/*!40000 ALTER TABLE `passenger_search_route` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requested_routes`
--

DROP TABLE IF EXISTS `requested_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requested_routes` (
  `route_id` int NOT NULL AUTO_INCREMENT,
  `origin` varchar(255) DEFAULT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `persons` int DEFAULT NULL,
  `date` int DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `isMatched` varchar(255) DEFAULT NULL,
  `origin_coordinate` point DEFAULT NULL,
  `destination_coordinate` point DEFAULT NULL,
  `passenger_type` varchar(45) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `createdAt` varchar(255) DEFAULT NULL,
  `updatedAt` varchar(255) DEFAULT NULL,
  `distance` double DEFAULT NULL,
  PRIMARY KEY (`route_id`)
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `requested_routes`
--

LOCK TABLES `requested_routes` WRITE;
/*!40000 ALTER TABLE `requested_routes` DISABLE KEYS */;
INSERT INTO `requested_routes` VALUES (97,'appworks school','æ—¥æœˆæ½­',2,1622131200,NULL,'1',_binary '\0\0\0\0\0\0\0#Á¯\ì\İ\n9@o\õ¤\'d^@',_binary '\0\0\0\0\0\0\0	¾Az\Û7@—úQ:^@','request',25,'Tue May 25 2021 23:29:30 GMT+0800 (å°åŒ—æ¨™æº–æ™‚é–“)','Tue May 25 2021 23:29:30 GMT+0800 (å°åŒ—æ¨™æº–æ™‚é–“)',147.2452425442729),(98,'appworks school','æ—¥æœˆæ½­',3,1622131200,NULL,'1',_binary '\0\0\0\0\0\0\0#Á¯\ì\İ\n9@o\õ¤\'d^@',_binary '\0\0\0\0\0\0\0	¾Az\Û7@—úQ:^@','request',25,'Tue May 25 2021 23:35:56 GMT+0800 (å°åŒ—æ¨™æº–æ™‚é–“)','Tue May 25 2021 23:35:56 GMT+0800 (å°åŒ—æ¨™æº–æ™‚é–“)',147.2452425442729),(99,'appworks school','æ—¥æœˆæ½­',4,1622131200,NULL,'1',_binary '\0\0\0\0\0\0\0#Á¯\ì\İ\n9@o\õ¤\'d^@',_binary '\0\0\0\0\0\0\0	¾Az\Û7@—úQ:^@','request',25,'Wed May 26 2021 11:52:07 GMT+0800 (å°åŒ—æ¨™æº–æ™‚é–“)','Wed May 26 2021 11:52:07 GMT+0800 (å°åŒ—æ¨™æº–æ™‚é–“)',147.2452425442729),(100,'å°åŒ—è»Šç«™','èŠ±è“®è»Šç«™',1,1622131200,'test2@test.com',NULL,_binary '\0\0\0\0\0\0\0\ä$\Ø9@™\õ½\áa^@',_binary '\0\0\0\0\0\0\0.\Ê\ÇIş7@€\×g\Îzf^@','search',NULL,NULL,NULL,NULL),(101,'appworks school','æ—¥æœˆæ½­',5,1622131200,NULL,'1',_binary '\0\0\0\0\0\0\0#Á¯\ì\İ\n9@o\õ¤\'d^@',_binary '\0\0\0\0\0\0\0	¾Az\Û7@—úQ:^@','request',25,'Wed May 26 2021 14:29:37 GMT+0800 (å°åŒ—æ¨™æº–æ™‚é–“)','Wed May 26 2021 14:29:37 GMT+0800 (å°åŒ—æ¨™æº–æ™‚é–“)',147.2452425442729),(102,'å°åŒ—è»Šç«™','èŠ±è“®è»Šç«™',2,1622131200,NULL,'1',_binary '\0\0\0\0\0\0\0\ä$\Ø9@™\õ½\áa^@',_binary '\0\0\0\0\0\0\0.\Ê\ÇIş7@€\×g\Îzf^@','search',25,'1622013488','1622013488',117.49239672058869),(103,'å°åŒ—è»Šç«™','èŠ±è“®è»Šç«™',1,1622131200,NULL,NULL,_binary '\0\0\0\0\0\0\0\ä$\Ø9@™\õ½\áa^@',_binary '\0\0\0\0\0\0\0.\Ê\ÇIş7@€\×g\Îzf^@','search',70,'1622087034','1622087034',117.49239672058869),(104,'å°åŒ—è»Šç«™','èŠ±è“®è»Šç«™',1,1622131200,NULL,'1',_binary '\0\0\0\0\0\0\0\ä$\Ø9@™\õ½\áa^@',_binary '\0\0\0\0\0\0\0.\Ê\ÇIş7@€\×g\Îzf^@','search',25,'1622087359','1622087359',117.49239672058869),(105,'å°åŒ—è»Šç«™','èŠ±è“®è»Šç«™',1,1622131200,NULL,'1',_binary '\0\0\0\0\0\0\0\ä$\Ø9@™\õ½\áa^@',_binary '\0\0\0\0\0\0\0.\Ê\ÇIş7@€\×g\Îzf^@','search',25,'1622087396','1622087396',117.49239672058869);
/*!40000 ALTER TABLE `requested_routes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tour`
--

DROP TABLE IF EXISTS `tour`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tour` (
  `offered_routes_id` int NOT NULL,
  `passenger_routes_id` int DEFAULT NULL,
  `finished` int DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `passenger_type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tour`
--

LOCK TABLES `tour` WRITE;
/*!40000 ALTER TABLE `tour` DISABLE KEYS */;
INSERT INTO `tour` VALUES (61,58,NULL,1,'request'),(61,59,NULL,2,'request'),(61,58,0,3,'request'),(61,59,0,4,'request'),(67,62,0,10,'request'),(67,62,0,11,'request'),(67,62,0,12,'request'),(67,62,0,13,'request'),(67,62,0,15,'request'),(67,0,0,30,'search'),(69,0,0,31,'search'),(69,0,0,32,'search'),(69,2,0,33,'search'),(67,3,0,34,'search'),(69,66,0,36,'search'),(71,67,0,37,'search'),(71,68,0,38,'search'),(71,69,0,39,'search'),(71,70,0,40,'search'),(71,71,0,41,'search'),(76,73,0,43,'request'),(71,74,0,44,'search'),(70,78,0,45,'search'),(78,79,0,46,'request'),(80,82,0,47,'request'),(83,83,0,49,'request'),(70,84,0,50,'search'),(70,85,0,51,'search'),(70,89,0,56,'search'),(87,90,0,57,'request'),(71,91,0,58,'search'),(88,92,0,59,'request'),(90,98,0,60,'request'),(90,98,0,61,'request'),(90,98,0,62,'request'),(70,100,0,63,'search'),(70,102,0,64,'search'),(70,103,0,65,'search'),(70,104,0,66,'search'),(70,105,0,67,'search');
/*!40000 ALTER TABLE `tour` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `provider` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(500) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `picture` varchar(255) DEFAULT NULL,
  `login_at` varchar(255) DEFAULT NULL,
  `token_expired` varchar(255) DEFAULT NULL,
  `access_token` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (24,'native','æ—ç¾ç§€','test@test.com','$2b$10$7NfiwVhfaAVke1HBOGCVIefv3ZPYHi8iIIrMT3Q6556SZRtNR0QhO','1','../uploads/images/member.png','2021-05-28 12:22:56.851','2592000','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm92aWRlciI6Im5hdGl2ZSIsIm5hbWUiOiLmnpfnvo7np4AiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJwaG9uZSI6IjEiLCJwaWN0dXJlIjoiLi4vdXBsb2Fkcy9pbWFnZXMvbWVtYmVyLnBuZyIsImlhdCI6MTYyMjE3NTc3NiwiZXhwIjo0MjE0MTc1Nzc2fQ.XyZxkJNgjAk_3ZPycg5WEjTZwhIEyY3WfVdc15jo9LA'),(25,'native','éƒç¾éº—','test2@test.com','$2b$10$PSB39xd2KetYnXyzxsJ7zu2jnrtmbIg0aAsghSYwepNrXlHIb1C9W','2','../uploads/images/member.png','2021-05-27 12:10:02.701','2592000','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm92aWRlciI6Im5hdGl2ZSIsIm5hbWUiOiLpg53nvo7pupciLCJlbWFpbCI6InRlc3QyQHRlc3QuY29tIiwicGhvbmUiOiIyIiwicGljdHVyZSI6Ii4uL3VwbG9hZHMvaW1hZ2VzL21lbWJlci5wbmciLCJpYXQiOjE2MjIwODg2MDIsImV4cCI6NDIxNDA4ODYwMn0.qA-Nl9eKo9G-i6PREg7GDJlTky0n6dCP8vcP4CRKEqc');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-05-29  0:52:39
