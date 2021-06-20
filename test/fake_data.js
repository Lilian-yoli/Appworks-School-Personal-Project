const users = [
  {
    provider: "native",
    email: "test@gmail.com",
    password: "password",
    name: "test1",
    picture: "../uploads/images/member.png",
    access_token: "test1accesstoken",
    access_expired: (60 * 60), // 1hr by second
    login_at: new Date("2021-06-01")
  }
];

const offeredRoutes = [
  {
    date: "2021-06-30",
    destination: "974台灣花蓮縣壽豐鄉山嶺18號",
    origin: "10548台灣台北市松山區敦化北路340-9號",
    avaiable_seats: 4,
    seats_left: 4,
    time: "9:00",
    user_id: 1,
    origin_coordinate: "Point(25.0410127, 121.5651638)",
    destination_coordinate: "Point(25.0410127, 121.5651638)",
    route_timestamp: "2021-06-30 9:00"
  },
  {
    date: "2021-06-30",
    destination: "970台灣花蓮縣花蓮市中央路三段707號",
    origin: "110台灣台北市信義區忠孝東路五段2號",
    avaiable_seats: 4,
    seats_left: 4,
    time: "9:00",
    user_id: 1,
    origin_coordinate: "Point('25.0410127', '121.5651638')",
    destination_coordinate: "Point('25.0410127', '121.5651638')",
    route_timestamp: "2021-06-30 9:00"
  }
];

module.exports = {
  users,
  offeredRoutes
};
