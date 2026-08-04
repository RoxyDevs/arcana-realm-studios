#!/bin/sh
# Called by Liquidsoap's input.harbor auth callback on every live-broadcast
# connection attempt (once per connect, not polled — never at the request.dynamic
# hammering rate fixed in generate-liquidsoap.sh). Prints "ok" if the room has
# an active LiveSession whose password matches; anything else means reject.
set -eu

ROOM_ID="$1"
PASSWORD="$2"

AUTHORIZED=$(curl -s --max-time 5 \
  -H "x-internal-token: ${STREAMING_INTERNAL_TOKEN}" \
  "${API_URL}/internal/streaming/rooms/${ROOM_ID}/live-auth?password=${PASSWORD}" \
  | jq -r '.authorized // false')

if [ "${AUTHORIZED}" = "true" ]; then
  echo "ok"
else
  echo "no"
fi
