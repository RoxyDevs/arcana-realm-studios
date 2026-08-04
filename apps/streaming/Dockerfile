# Icecast2 + Liquidsoap — the AutoDJ engine that actually broadcasts each
# room's track queue as the MP3 stream IMVU's native "Transmisión de Radio"
# field plays. Separate service from the API on purpose: this is a
# long-running audio process, not a request/response HTTP API.
#
# NOTE: built and iterated against Debian's packaged Icecast2/Liquidsoap
# versions. The Icecast/Liquidsoap/queue pipeline (including the live
# harbor input added here) has been run end-to-end against a real apps/api —
# see README.md's "Verified locally" section — but this Dockerfile image
# itself has never been built in any sandbox this was developed in (every
# one blocks Docker Hub's blob CDN). Expect to debug the container wrapper
# itself on first real deploy.
FROM debian:bookworm-slim

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
      icecast2 \
      liquidsoap \
      curl \
      jq \
      gettext-base \
      ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Debian's icecast2 package tries to start a system service on install —
# we run it ourselves from the entrypoint instead.
RUN sed -i 's/ENABLE=true/ENABLE=false/' /etc/default/icecastd || true

COPY icecast.xml.template /app/icecast.xml.template
COPY generate-liquidsoap.sh /app/generate-liquidsoap.sh
COPY next-track.sh /app/next-track.sh
COPY check-live-auth.sh /app/check-live-auth.sh
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/generate-liquidsoap.sh /app/next-track.sh /app/check-live-auth.sh /app/entrypoint.sh

ENV ICECAST_PORT=8000
ENV LIQUIDSOAP_HARBOR_PORT=8006
EXPOSE 8000
EXPOSE 8006

ENTRYPOINT ["/app/entrypoint.sh"]
