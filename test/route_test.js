const { assert, requester } = require("./set_up");
const { offeredRoutes } = require("./fake_data");
const { query } = require("../server/models/mysqlcon");

describe("passenger", () => {
  it("search offered route", async () => {
    const res = await requester
      .get("/api/1.0/search?origin=台北&destination=花蓮&date=2021-06-30&persons=1");
    const { data } = res.body;
    const expect = [
      {
        date: "2021/06/30",
        destination: "974台灣花蓮縣壽豐鄉山嶺18號",
        id: data[0].id,
        origin: "10548台灣台北市松山區敦化北路340-9號",
        seats_left: 4,
        time: "09:00"
      },
      {
        date: "2021/06/30",
        destination: "970台灣花蓮縣花蓮市中央路三段707號",
        id: data[0].id,
        origin: "110台灣台北市信義區忠孝東路五段2號",
        seats_left: 4,
        time: "09:00"
      }
    ];
    assert.equal(data, expect);
  });
});
