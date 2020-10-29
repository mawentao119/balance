#!/usr/bin/env bash

echo "*** Source py3env/bin/activate ... "

source py3env/bin/activate

here=`pwd`

ulimit -n 4096

cd work/workspace/Admin/balance

rm -rf auto/www/static/js/*
rm -rf keyword/*

  nohup   python balance.py runserver -h 0.0.0.0 -p 8082  &

cd ${here}

echo "*** Start finished ... "
