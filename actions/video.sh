#!/bin/bash

# This script transforms YouTube shortened links (e.g. https://youtu.be/xxxxxxxxxxx)
# sent thanks to the mail sharing feature of YT Android native app.
# The purpose of this script is to open a dedicated Firefox window with the linked video
# opened in widescreen and paused.
# It will not work properly on videos protected against the integration "embed" option.

videoID=$(basename $1)
videoFinalURL="https://www.youtube.com/embed/$videoID?rel=0"

firefox $videoFinalURL