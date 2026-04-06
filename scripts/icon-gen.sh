for size in 16 24 32 48 64 128 256 512; do
    rsvg-convert -w $size -h $size build/icons/app/icon.svg -o build/icons/app/${size}x${size}.png
    echo "build/icons/app/${size}x${size}.png"
done


convert build/icons/app/16x16.png \
        build/icons/app/24x24.png \
        build/icons/app/32x32.png \
        build/icons/app/48x48.png \
        build/icons/app/64x64.png \
        build/icons/app/128x128.png \
        build/icons/app/256x256.png \
        build/icons/app/icon.ico

echo "build/icons/app/icon.ico"

convert build/icons/app/16x16.png \
        build/icons/app/32x32.png \
        build/icons/app/128x128.png \
        build/icons/app/256x256.png \
        build/icons/app/512x512.png \
        build/icons/app/icon.icns

echo "build/icons/app/icon.icns"

cp build/icons/app/512x512.png build/icons/app/icon.png
echo "build/icons/app/icon.png"
