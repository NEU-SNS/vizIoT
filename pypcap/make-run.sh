#!/bin/bash
#make-run.sh
#make sure a process is always running.

# export DISPLAY=:0 #needed if you are running a simple gui app.

process=sniff.py
makerun="sudo python3 sniff.py"
logfile=log_running.txt
while true
do
  if ps ax | grep -v grep | grep $process > /dev/null
  then
    echo "running" > $logfile
  else
    echo "restarting" > $logfile
    $makerun &
  fi
  sleep 1
done

#if ps ax | grep -v grep | grep $process > /dev/null
#then
#        echo "running" > $logfile
#        exit
#else
#        echo "restarting" > $logfile
#        # $makerun &
#	$makerun &
#fi
#exit
