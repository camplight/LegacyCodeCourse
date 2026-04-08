#!/bin/bash

# Flights - GET all flights
curl -s http://localhost:3000/flights

# Bookings - CREATE a booking
curl -s -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "flightId": "FL001",
    "passengerName": "Test Testov",
    "passengerEmail": "test@test.com",
    "seatClass": "premium"
}'

# Bookings - GET a booking by ID
curl -s http://localhost:3000/bookings/BK-1773732306909-1

# Bookings - UPDATE a booking
curl -s -X PUT http://localhost:3000/bookings/BK-1773732306909-1 \
  -H "Content-Type: application/json" \
  -d '{
    "seatClass": "economy"
}'

# Bookings - DELETE a booking
curl -s -X DELETE http://localhost:3000/bookings/BK-1773732306909-1

# Health check
curl -s http://localhost:3000/health

# Reset
curl -s -X POST http://localhost:3000/reset
