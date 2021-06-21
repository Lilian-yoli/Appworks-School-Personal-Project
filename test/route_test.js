const { assert, requester } = require("./set_up");
const { offeredRoutes } = require("./fake_data");
const { query } = require("../server/models/mysqlcon");

describe("passenger", () => {
  it("search offered route", async () => {
    console.log(123123123);
    const res = await requester
      .get("/api/1.0/search")
      .query({
        origin: "台北",
        destination: "花蓮",
        date: "2021-06-30",
        persons: 1
      });
    console.log("OfferedRoute", res.body);
    const data = res.body;

    const expect = [
      {
        date: "2021/06/30",
        destination: "974台灣花蓮縣壽豐鄉山嶺18號",
        id: data[0].id,
        origin: "10548台灣台北市松山區敦化北路340-9號",
        seats_left: 4,
        time: "09:00:00"
      },
      {
        date: "2021/06/30",
        destination: "970台灣花蓮縣花蓮市中央路三段707號",
        id: data[1].id,
        origin: "110台灣台北市信義區忠孝東路五段2號",
        seats_left: 4,
        time: "09:00:00"
      }
    ];
    console.log("*******", data, expect);
    assert.deepEqual(data, expect);
  });

  it("search with no result", async () => {
    const res = await requester
      .get("/api/1.0/search")
      .query({
        origin: "宜蘭",
        destination: "花蓮",
        date: "2021-06-30",
        persons: 1
      });

    const data = res.body.error;
    console.log(data);
    assert.deepEqual(data, "Not Found");
  });

  it("search with punctuation marks", async () => {
    const res = await requester
      .get("/api/1.0/search")
      .query({
        origin: "宜蘭",
        destination: "' OR 1=1; --",
        date: "2021-06-30",
        persons: 1
      });

    const data = res.body.error;
    console.log(data);
    assert.deepEqual(data, "Invalid Input, punctuation marks are not allowed. ");
  });

  it("search with invalid date format", async () => {
    const res = await requester
      .get("/api/1.0/search")
      .query({
        origin: "台北",
        destination: "花蓮",
        date: "2021630",
        persons: 1
      });

    const data = res.body.error;
    console.log(data);
    assert.deepEqual(data, "Date format not correct.");
  });
});
