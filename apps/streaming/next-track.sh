#!/bin/sh
# Called by Liquidsoap (via process.read) each time a room's source needs its
# next track. Prints a fetchable audio URL, or nothing if the room has
# nothing playable right now (Liquidsoap's fallback then plays silence
# instead of the mount dying).
set -eu

ROOM_ID="$1"

curl -s --max-time 5 \
  -H "x-internal-token: ${STREAMING_INTERNAL_TOKEN}" \
  "${API_URL}/internal/streaming/rooms/${ROOM_ID}/next-track" \
  | jq -r '.fileUrl // empty'
