#!/bin/sh
set -eu

: "${ICECAST_SOURCE_PASSWORD:?ICECAST_SOURCE_PASSWORD is required}"
: "${ICECAST_ADMIN_PASSWORD:?ICECAST_ADMIN_PASSWORD is required}"
: "${API_URL:?API_URL is required (Arcana's API base URL)}"
: "${STREAMING_INTERNAL_TOKEN:?STREAMING_INTERNAL_TOKEN is required — must match the API's value}"
ICECAST_RELAY_PASSWORD="${ICECAST_RELAY_PASSWORD:-$ICECAST_SOURCE_PASSWORD}"
ICECAST_HOSTNAME="${ICECAST_HOSTNAME:-localhost}"
ICECAST_PORT="${ICECAST_PORT:-8000}"
# Shared by every room's input.harbor mountpoint — one Liquidsoap harbor
# listener dispatches by mountpoint path, same as Icecast itself.
LIQUIDSOAP_HARBOR_PORT="${LIQUIDSOAP_HARBOR_PORT:-8006}"
export ICECAST_RELAY_PASSWORD ICECAST_HOSTNAME ICECAST_PORT LIQUIDSOAP_HARBOR_PORT

envsubst < /app/icecast.xml.template > /app/icecast.xml

mkdir -p /var/log/icecast2
icecast2 -c /app/icecast.xml -b

LAST_HASH=""
LIQUIDSOAP_PID=""

while true; do
  if /app/generate-liquidsoap.sh /app/radio.liq; then
    NEW_HASH=$(md5sum /app/radio.liq | cut -d' ' -f1)
    if [ "${NEW_HASH}" != "${LAST_HASH}" ]; then
      echo "Active room list changed — (re)starting Liquidsoap"
      if [ -n "${LIQUIDSOAP_PID}" ] && kill -0 "${LIQUIDSOAP_PID}" 2>/dev/null; then
        kill "${LIQUIDSOAP_PID}" 2>/dev/null || true
        wait "${LIQUIDSOAP_PID}" 2>/dev/null || true
      fi
      liquidsoap /app/radio.liq &
      LIQUIDSOAP_PID=$!
      LAST_HASH="${NEW_HASH}"
    fi
  else
    echo "generate-liquidsoap.sh failed this round — keeping the previous script running"
  fi

  sleep 60
done
