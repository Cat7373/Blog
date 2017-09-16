---
title: 修改 Ubuntu 自带的 Nginx 的编译参数使用 OpenSSL 1.1
date: 2017-09-16 13:48:00
categories: Nginx
tags:
  - Ubuntu
  - Nginx
  - OpenSSL
  - apt
---
## 前言
> 很长一段时间都在用`Ubuntu`里直接用`apt-get install`安装的`Nginx`
> 因此自己很多想折腾的东西如`TLSv1.3`就因为缺依赖、依赖过旧等原因被锁了
> 然而又不想自己从头编译`Nginx`，要折腾的东西太多了。。。
> 今天终于搞明白怎么自定义`Ubuntu`里的`Nginx`的编译参数惹。。写篇文章记下来 0.0

<!-- more -->
## 准备`OpenSSL 1.1.0`
> 要换`1.1.0`当然要先有啦~

1. 下载并解压最新的`OpenSSL`源码
   ```shell
   # 个人习惯，扔别的地方也是可以的
   cd /opt
   # 到 https://www.openssl.org/source/ 可以找到最新版的下载地址
   wget https://www.openssl.org/source/openssl-1.1.0f.tar.gz
   # 解压源码
   tar -xf openssl-1.1.0f.tar.gz
   cd openssl-1.1.0f
   ```
2. 安装`OpenSSL`，<u>不要覆盖系统自带的`OpenSSL`!!!</u>(很重要！划重点！)
   ```shell
   ./config --prefix=/usr/local/openssl --openssldir=/usr/local/openssl
   make
   make install
   ```
3. 为依赖库建立连接，不然`1.1`的`OpenSSL`会因为找不到库而没法使用
   ```shell
   cd /usr/local/openssl/lib
   ln -s $(pwd)/libssl.so.1.1 /usr/lib/libssl.so.1.1
   ln -s $(pwd)/libcrypto.so.1.1 /usr/lib/libcrypto.so.1.1
   ```
4. 测试安装结果
   ```shell
   openssl version
   # OpenSSL 1.0.2g  1 Mar 2016
   /usr/local/openssl/bin/openssl version
   # OpenSSL 1.1.0f  25 May 2017
   ```

## 准备自定义`Nginx`的安装包
### 更换最新版`Nginx`的源
> 折腾这种东西嘛，当然要折腾最新的啦，在`1.13.5`都发布了的时候，`Ubuntu`里装的`Nginx`居然还是`1.10.3`
> 真是要多不爽就有多不爽，那么第一步当然是换个新的咯 0.0
> 这个源一般会紧跟官方最新的版本，可能更新也就比官方慢个四五天的样子 0.0

```shell
apt-get update
apt-get install software-properties-common
add-apt-repository ppa:chris-lea/nginx-devel
apt-get update
```

### 准备`Nginx`编译环境和源代码
1. 首先编辑`/etc/apt/source.list.d/`里包含`nginx`的那个文件，取消第二行`deb-src`的注释
2. 准备`Nginx`编译环境
   ```shell
   apt-get update
   apt-get build-dep nginx
   ```
3. 下载`Nginx`源代码
   ```shell
   cd /opt
   mkdir nginx
   cd nginx
   apt source nginx
   cd nginx-1.13.5
   ```
4. 编辑`Nginx`安装规则，使用自定义的`OpenSSL`
   ```shell
   vim debian/rules
   ```
   添加下面的规则：
   ```
   --with-openssl=/opt/openssl-1.1.0f \
   ```
   添加后就像这样：
   ```
   # configure flags
   common_configure_flags := \
                           --with-openssl=/opt/openssl-1.1.0f \
                           --with-cc-opt="$(debian_cflags)" \
                           --with-ld-opt="$(debian_ldflags)" \
   ```

## 编译并安装`Nginx`
1. 编译(打包)`Nginx`
   ```shell
   cd /opt/nginx/nginx-1.13.5
   # 可能会持续十分钟左右，甚至更长，请耐心等待
   dpkg-buildpackage -b
   ```
2. 安装`Nginx`
   ```shell
   dpkg -i nginx_1.13.5-1chl1~zesty1_all.deb
   apt-get install -f
   ```

## 最后
```shell
# 执行下 nginx -V 来看看 OpenSSL 版本对不对咯
# 如果正确就会像下面似的输出 built with OpenSSL 1.1.0f 咯~
nginx -V
# nginx version: nginx/1.13.5
# built with OpenSSL 1.1.0f  25 May 2017
# TLS SNI support enabled
# configure arguments: --with-openssl=/root/nginx/openssl-1.1.0f 后略...
```

* 啊科技树终于解锁了真爽！以后会继续在这个基础上折腾一堆新玩意的！

## 参考内容
[Build nginx (Mainline) with OpenSSL 1.1.0 on Ubuntu 16.04](https://blog.jetmirshatri.com/build-nginx-mainline-with-openssl-1-1-0-on-ubuntu-16-04/)
[How To Add ngx_pagespeed to Nginx on Ubuntu 14.04](https://www.digitalocean.com/community/tutorials/how-to-add-ngx_pagespeed-to-nginx-on-ubuntu-14-04)
