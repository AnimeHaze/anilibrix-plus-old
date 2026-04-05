#!/bin/bash

OPERA_PROXY_RELEASE_URL="https://github.com/Snawoot/opera-proxy/releases/download/v1.3.1"

mkdir -p ./build/mac/x64
mkdir -p ./build/mac/arm64
mkdir -p ./build/linux/ia32
mkdir -p ./build/linux/x64
mkdir -p ./build/linux/arm64
mkdir -p ./build/win/ia32
mkdir -p ./build/win/x64
mkdir -p ./build/win/arm64

wget -O ./build/mac/x64/opera-proxy "$OPERA_PROXY_RELEASE_URL/opera-proxy.darwin-amd64"
wget -O ./build/mac/arm64/opera-proxy "$OPERA_PROXY_RELEASE_URL/opera-proxy.darwin-amd64"
wget -O ./build/linux/ia32/opera-proxy "$OPERA_PROXY_RELEASE_URL/opera-proxy.linux-386"
wget -O ./build/linux/x64/opera-proxy "$OPERA_PROXY_RELEASE_URL/opera-proxy.linux-amd64"
wget -O ./build/linux/arm64/opera-proxy "$OPERA_PROXY_RELEASE_URL/opera-proxy.linux-arm64"
wget -O ./build/win/ia32/opera-proxy.exe "$OPERA_PROXY_RELEASE_URL/opera-proxy.windows-386.exe"
wget -O ./build/win/x64/opera-proxy.exe "$OPERA_PROXY_RELEASE_URL/opera-proxy.windows-amd64.exe"
wget -O ./build/win/arm64/opera-proxy.exe "$OPERA_PROXY_RELEASE_URL/opera-proxy.windows-arm.exe"
chmod +x ./build/mac/x64/opera-proxy
chmod +x ./build/mac/arm64/opera-proxy
chmod +x ./build/linux/ia32/opera-proxy
chmod +x ./build/linux/x64/opera-proxy
chmod +x ./build/linux/arm64/opera-proxy
chmod +x ./build/win/ia32/opera-proxy.exe
chmod +x ./build/win/x64/opera-proxy.exe
chmod +x ./build/win/arm64/opera-proxy.exe
