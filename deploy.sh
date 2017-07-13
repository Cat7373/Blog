#!/bin/sh

hexo clean

sleep 1

hexo generate

sleep 1

gulp

sleep 1

hexo deploy

