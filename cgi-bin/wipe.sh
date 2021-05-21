#!/bin/bash
echo "Zeroing to reduce SD image size"
echo "------- Start zeroing at $(date)-------"
dd if=/dev/zero of=/home/sdr/delete_me
echo "------- Done  zeroing at $(date)-------"
sync
sync
echo "------- Delete dummy file -------"
rm -f /home/sdr/delete_me
sync
sync
echo "-------Finish zeroing at $(date)-------"
