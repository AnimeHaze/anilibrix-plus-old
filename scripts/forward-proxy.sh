#!/bin/bash

FORWARD_PROXY_RELEASE_URL="https://github.com/AnimeHaze/forward-proxy/releases/download/v1.0.0"

mkdir -p ./build/mac/x64
mkdir -p ./build/mac/arm64
mkdir -p ./build/linux/ia32
mkdir -p ./build/linux/x64
mkdir -p ./build/linux/arm64
mkdir -p ./build/win/ia32
mkdir -p ./build/win/x64
mkdir -p ./build/win/arm64

wget -O ./build/mac/x64/forward-proxy "$FORWARD_PROXY_RELEASE_URL/forward-proxy.darwin-amd64"
wget -O ./build/mac/arm64/forward-proxy "$FORWARD_PROXY_RELEASE_URL/forward-proxy.darwin-amd64"
wget -O ./build/linux/ia32/forward-proxy "$FORWARD_PROXY_RELEASE_URL/forward-proxy.linux-386"
wget -O ./build/linux/x64/forward-proxy "$FORWARD_PROXY_RELEASE_URL/forward-proxy.linux-amd64"
wget -O ./build/linux/arm64/forward-proxy "$FORWARD_PROXY_RELEASE_URL/forward-proxy.linux-arm64"
wget -O ./build/win/ia32/forward-proxy.exe "$FORWARD_PROXY_RELEASE_URL/forward-proxy.windows-386.exe"
wget -O ./build/win/x64/forward-proxy.exe "$FORWARD_PROXY_RELEASE_URL/forward-proxy.windows-amd64.exe"
wget -O ./build/win/arm64/forward-proxy.exe "$FORWARD_PROXY_RELEASE_URL/forward-proxy.windows-arm.exe"
chmod +x ./build/mac/x64/forward-proxy
chmod +x ./build/mac/arm64/forward-proxy
chmod +x ./build/linux/ia32/forward-proxy
chmod +x ./build/linux/x64/forward-proxy
chmod +x ./build/linux/arm64/forward-proxy
chmod +x ./build/win/ia32/forward-proxy.exe
chmod +x ./build/win/x64/forward-proxy.exe
chmod +x ./build/win/arm64/forward-proxy.exe
