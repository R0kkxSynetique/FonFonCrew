#!/bin/bash

cd /home/container

if [ -z "${STARTUP}" ]; then
    echo "🚀 Starting Nginx..."
    exec nginx -g 'daemon off;'
else
    MODIFIED_STARTUP=$(echo -e ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g')
    echo "🚀 Starting with: ${MODIFIED_STARTUP}"
    eval ${MODIFIED_STARTUP}
fi
