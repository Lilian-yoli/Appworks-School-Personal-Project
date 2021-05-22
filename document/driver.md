1. endpoint: /api/1.0/matched-passengers

request: 
{
  passengerRouteId: [ { id: 63, persons: 1 }, { id: 62, persons: 1 } ],
  passengerType: 'request',
  offeredRouteId: '68'
}

result:
[
    { passenger_routes_id: 63 },
    { passenger_routes_id: 62 }
]