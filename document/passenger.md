- endpoint: /api/1.0/matched-driver

request:
http://localhost:3000/api/1.0/matched-driver?destination=花蓮&date=2021-05-20&persons=1&id=67

reponse:
{
    "result": 30
}


- endpoint: /api/1.0/passenger-itinerary

request:
header, token
Authorization, Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJpYXQiOjE2MjE0ODk1NTYsImV4cCI6NDIxMzQ4OTU1Nn0.ZuUw806EJjXfWPKU3VgigKBCC25nfo-aNKexJvFDEyI

response:
 [
  {
    origin: '台北',
    destination: '苗栗',
    date: 2021-05-27T16:00:00.000Z,
    time: '08:00:00',
    fee: 200,
    route_id: 69,
    persons: 1
  }
]