#!/bin/sh
# Name the links like a laptop's, then give each its DNS server: the home router on wlan0, the VPN's server on wg0.
set -e
for pair in eth0:wlan0 eth1:wg0; do
  ip link set "${pair%%:*}" down && ip link set "${pair%%:*}" name "${pair##*:}" && ip link set "${pair##*:}" up
done
resolvectl dns wlan0 172.30.1.10
resolvectl dns wg0 172.30.2.30
resolvectl domain wg0 '~corp.example.com'
