---
title: 用 letsencrypt 免费证书开启 HTTPS 并获得 ssllabs 满分的过程
date: 2017-07-16 15:43:00
categories: Https, letsencrypt
tags:
  - Https
  - letsencrypt
---
## 前言
> 之前博客用的是`Github Pages`，不支持`HTTPS`，也就没怎么折腾，最近买了个小`VPS`，于是开始瞎折腾。
> 最近被运营商劫持弄的烦的要死，偏偏我还不知道宽带帐号不好投诉，开自己的博客居然被嵌入广告。。。
> 于是把博客搬到了服务器上，并通过`letsencrypt`的免费证书开启了`HTTPS`。
> 然后又看到了`ssllabs`这个大坑，于是开始了我的折腾之旅，折腾数日终于满分了。。。
> 在这写篇文章把折腾的过程记下来。。。顺便把以前写的凑数的文章都删掉了。。。

<!-- more -->
## 通过`letsencrypt`开启`HTTPS`
> 开始因为英语不好，明明官网都写得很明白了，然而还是折腾了好久。。。
> 我是使用的`Ubuntu 17.04`+`Nginx 13`，不同环境操作过程可能不一样，不要直接照着做。。。
> 先上一个自己域名的满分链接：https://www.ssllabs.com/ssltest/analyze.html?d=blog.cat73.org

### 准备工作
1. 确保你要申请证书的域名都解析到了这台服务器上，且能直接通过域名访问。
2. 使用[官网](https://letsencrypt.org/getting-started/)推荐的[CertBot](https://certbot.eff.org/)获取证书。
   在`CertBot`官网选择一下环境(比如我选`Nginx` on `Ubuntu 17.04`)就可以看到入门教程了。
3. 安装`CertBot`
   ```shell
   apt-get update
   apt-get install software-properties-common
   add-apt-repository ppa:certbot/certbot
   apt-get update
   apt-get install python-certbot-nginx
   ```

### 获取证书
> 我是把几个域名都放到一张证书里的，这样可以支持一些比较旧的，不支持`SNI`的浏览器(虽然我这博客不支持。。)

1. 执行`certbot certonly --must-staple --rsa-key-size 4096 -d 域名1 -d 域名2...`
   这步的`-rsa-key-size 4096`是为了`ssllabs`满分，如果你不想弄这个可以不加，能略微提升网站访问速度。
   每个`-d`后面跟一个域名，有多少个域名跟多少个
2. 运行后它会让你选验证模式，我这里已经开启了`nginx`，因此选`2`，自己设置`webroot`
3. 选`1`然后输入你的网站静态文件所在的目录，如我的`Nginx`默认是`/var/www/html`
4. 之后每一个域名都需要设置，如果你所有域名都在一个目录，直接选`2`使用第一次输入的路径即可
5. 输入完最后一个域名后，它会提示你申请结果，如果失败请检查失败原因后重试，如果成功继续下一步
   我一开始因为用了国内的`NS`服务商，然后`letsencrypt`访问不到就失败了，这货不会信任任何`DNS`服务器给出的服务器地址，必须要直接访问权威`NS`服务器查询的结果才可以，因此如果你因为这个失败了，建议更换一些国外的免费`NS`服务商。
6. 如果成功会告诉你申请成功，并给出你的证书路径，比如我的：`/etc/letsencrypt/live/cat73.org/fullchain.pem`
   记下这个路径(不包括`fullchain.pem`的部分，稍后用得着)

## 配置 DNS CAA
> DNS CAA 可限制你的域名只有特定的证书签发机构可以签发证书，且无权签发的签发机构收到签发证书申请时会给你发邮件提醒
> 这步不影响`ssllabs`评分，可不做

1. 你需要找一家支持`CAA`记录的`NS`服务商，国内似乎没有。。。
   我找了半天找到一家国外的：https://www.1984hosting.com/
2. 通过修改域名的`NS`记录接入到你选择的`NS`服务商
3. 添加`CAA`记录，比如我的：
   ```
   1 issue "letsencrypt.org"
   1 iodef "root@cat73.org"
   ```
   `issue`是允许哪家证书签发机构签发证书，`iodef`是你的邮箱地址
4. 完成后可以通过`dig caa 你的域名`来验证是否添加成功

## 配置 nginx
1. 编辑你每一个申请证书的域名的`server`配置，设置`http`直接跳到`https`
   ```
   server {
     listen 80;
     server_name 域名;

     return 301 https://$host$request_uri;
   }
   ```
2. 配置每一个域名的 https
   ```
   server {
     # 如果 http2 报错说明你的 nginx 版本比较低不支持，删掉即可
     listen 443 ssl http2;
     server_name 域名;

     ssl_certificate 证书路径/fullchain.pem;
     ssl_certificate_key 证书路径/privkey.pem;

     ssl_trusted_certificate 证书路径/chain.pem;


     # 强制域名使用 HTTPS 打开，且在证书不被信任时不允许用户跳过，这里设置的时间是 182.5 天
     # includeSubDomains 表示包含子域名
     # preload 表示允许被加入浏览器内置的强制 HTTPS 列表中
     add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload";
     # 在检测到 XSS 时阻止网页加载
     add_header X-XSS-Protection "1; mode=block";
     # 禁止网页被嵌入 frame(算是避免运营商劫持的办法之一)
     add_header X-Frame-Options DENY;

     # 后面可以写你的网站之前的代码，如 root /var/www/html;
   }
   ```
3. 配置 nginx.conf，删掉自带的 SSL 配置，用下面的覆盖
   ```
   # 只支持 TLS1.2，如果`openssl`在`1.1.1`以上，且`nginx`在`1.13`以上，可再加入`TLSv1.3`
   ssl_protocols TLSv1.2;
   ssl_prefer_server_ciphers on;
   ssl_session_timeout 1d;
   ssl_session_cache shared:SSL:10m;

   ssl_buffer_size 4k;

   ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA';

   ssl_ecdh_curve sect571r1:secp521r1:brainpoolP512r1:secp384r1:brainpoolP384r1:sect571k1;

   ssl_stapling on;
   ssl_stapling_verify on;
   ```
4. 开启`session_ticket`
   1. 在 nginx 配置目录下执行
   ```shell
   mkdir ssl
   openssl rand 80 > ssl/ticket.key
   ```
   2. 编辑`nginx.conf`，在`SSL`配置后面加入下面两行
   ```
   ssl_session_ticket_key ssl/ticket.key;
   ssl_session_tickets on;
   ```
5. 使用`4096`位加密
   1. 在 nginx 配置目录下执行
   ```shell
   openssl dhparam -out ssl/dhparam.pem 4096
   ```
   2. 编辑`nginx.conf`，在`SSL`配置后面加入下面两行
   ```
   ssl_dhparam ssl/dhparam.pem;
   ```

## 一些额外的配置
> 完成上面的配置你在`ssllabs`的评分应该就已经是满分了，但你还可以继续改下面这些，毕竟不折腾能死嘛～
> 什么？还没满分，不要忘了执行`nginx -s reload`哟。。。
> 如果还没满分，那大概是我这篇文章过时了吧。。。

1. 开启 HPKP
   > `HPKP`可以检查你的证书是不是指定的证书签发机构签的，如果不是会阻止访问，也可配置出现问题时向指定地址报告等
   1. 在你的浏览器访问`https://www.ssllabs.com/ssltest/analyze.html?d=你的域名`
   2. 等测试结束后，在页面搜索`Certification Paths`
   3. 点击下面的展开
   4. 把第一行不是你的域名的`Pin SHA256`的值记录下来
   5. 换一个免费证书，再来一次，比如腾讯云可以申请赛门特克的免费证书
   6. 把你刚刚记下来的几个值(至少4个，无顺序要求)，按下面的格式写入你每一个域名的`server`配置中
   ```
   # 如果有更多按照格式加就行
   add_header Public-Key-Pins 'pin-sha256="第一个值"; pin-sha256="第二个值"; pin-sha256="第三个值"; pin-sha256="第四个值"; max-age=15768000; includeSubDomains';
   ```
2. 申请浏览器内置`HSTS`
   > `HSTS`可以要求用户访问你的网站必须用`HTTPS`协议，然而需要至少访问一次才会生效，这一次仍然有可能被劫持，而且有可能被一些更无良的运营商给`HTTPS`强转`HTTP`，用户永远不会把你加进`HSTS`名单
   > 为了解决这个尴尬的问题，浏览器商们推出了一个申请地址，符合要求的域名可以申请把自己加入浏览器的源代码中，这样用户首次访问的时候也会强制用`HTTPS`访问
   > 请一定注意，一旦申请成功，就没有回头路了，如果哪天你不想用`HTTPS`了，那就只能换个域名了。
   1. 确保你申请证书的时候包含你的主域名，如我的是`cat73.org`，不能带任何子域名，如`www.cat73.org`无效
   2. 确保你照做了上面的`4.2`
   3. 访问[申请页面](https://hstspreload.org/)，输入你的主域名，提交即可，稍后的提示确认，打勾后再提交即可
   4. 耐心等待审核，一般一个月内可审核完成，审核完成之前请不要修改网站配置。

## 自动重新签发证书
> `letsencrypt`申请的证书只有`3`个月有效期，每隔`3`个月都手动来重新签发一次得累死。。。

1. 通过`crontab`在每月`1`号自动重新签发证书
2. 执行`crontab -e`,添加下面一行保存即可
   ```
   0 0 1 * * certbot renew --force-renew && /etc/init.d/nginx reload
   ```

## 参考内容
[ssllabs评分规则](https://github.com/ssllabs/research/wiki/SSL-Server-Rating-Guide)
