# Co-Car
### A Carpooling Matching Website
Based in Taiwan, Co-Car connects drivers with empty seats to co-travellers looking for a ride. It aims to make travel social, money-saving and more efficient. 

Website URL: https://www.co-car.site <br>
Test Account: 
email: test@test.com <br>
password: test

## Table of Contents
* [Features](https://github.com/Lilian-yoli/Co-Car#Features)
* [Technologies](https://github.com/Lilian-yoli/Co-Car#Technologies)
* [Architecture](https://github.com/Lilian-yoli/Co-Car#Architecture)
* [Database](https://github.com/Lilian-yoli/Co-Car#Database)
* [Contact](https://github.com/Lilian-yoli/Co-Car#Contact)

## Features
#### Type and select the origin and destination with Google Map aside for confirmation.

![image](https://github.com/Lilian-yoli/Co-Car/blob/main/others/select_location.gif)

#### Best matching drivers/passengers recommendation

![image](https://github.com/Lilian-yoli/Co-Car/blob/main/others/suggest_page.gif)
* The suggestions for driver will optimized by on the way passengers with longer distance.
* As for passenger the website will recommend a few drivers near to passengers' origin and destination.
* Warning will show up if drivers try to add passengers more than their available seats.    

#### Real-time notification-sending mechanism

![image](https://github.com/Lilian-yoli/Co-Car/blob/main/others/notification.gif)
* After sending the notification, users will receive it immediately through Socket.IO.
* Users can choose to accept and refuse the invitation, and the result will notify back to the sender.

#### Real-time chat room
![image](https://github.com/Lilian-yoli/Co-Car/blob/main/others/chatdemo.gif)
* By implementing Socket.IO, users can send and reveive message in real time.
* The chat history with last chat record will show up beside the chatbox.  

## Technologies
### Back-End
  * Node.js/ Express
  * Nginx

### Database
  * MySQL
  * Redis

### Websocket
  * Socket.IO

### Front-End
  * HTML
  * CSS
  * Javascript
  * DOM
  * Bootstrap

### Cloud Service (AWS) 
  * Elastic Compute Cloud (EC2)
  * Relational Database Service (RDS)

### Networking
  * HTTPS
  * SSL
  * Domain Name System (DNS)

### 3rd Party APIs
  * Google Map APIs

### Test
  * Mocha
  * Chai

## Architecture

![image](https://github.com/Lilian-yoli/Co-Car/blob/main/others/refine%20Architecture.png)

## Database Schema

![image](https://github.com/Lilian-yoli/Co-Car/blob/main/others/database.png)

## Contact
Lilian Yang lilian860919@gmail.com
