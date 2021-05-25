- endpoint: /api/1.0/user/signup

request:
{
	"signupName": "test13",
	"signupEmail": "test13@test.com",
	"signupPassword": "13",
	"signupPhone": "1"
}

response:
{
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm92aWRlciI6Im5hdGl2ZSIsIm5hbWUiOiJ0ZXN0MTMiLCJlbWFpbCI6InRlc3QxM0B0ZXN0LmNvbSIsInBob25lIjoiMSIsInBpY3R1cmUiOm51bGwsImlhdCI6MTYyMTc4MjUyNywiZXhwIjoxNjIxNzg1MTE5fQ.hOvTyRVYkUcIHM6Ua2H0J4EM2hGTwmcH5uoxNtqvMhI",
        "token_expired": "2592000",
        "login_at": "2021-05-23T15:08:46.910Z",
        "user": {
            "id": 13,
            "provider": "native",
            "name": "test13",
            "email": "test13@test.com",
            "phone": "1",
            "picture": null
        }
    }
}

- endpoint: /api/1.0/user/signin

request:
{
	"signinEmail": "test13@test.com",
	"signinPassword": "13"
}

response:
{
    "user_id": 13,
    "provider": "native",
    "name": "test13",
    "email": "test13@test.com",
    "password": "$2b$10$fHkubHIzHYPH9bHvET/ymeMLScUQw.nGKJS0PFg1/FGGQU3myZUZK",
    "phone": "1",
    "picture": null,
    "login_at": "2021-05-23T15:11:41.182Z",
    "token_expired": "2592000",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm92aWRlciI6Im5hdGl2ZSIsIm5hbWUiOiJ0ZXN0MTMiLCJlbWFpbCI6InRlc3QxM0B0ZXN0LmNvbSIsInBob25lIjoiMSIsInBpY3R1cmUiOm51bGwsImlhdCI6MTYyMTc4MjcwMSwiZXhwIjo0MjEzNzgyNzAxfQ.i1yR-FAYFEor2_Mg7FhwOkvkoOf-fBpbNf30sKRjHzs"
}