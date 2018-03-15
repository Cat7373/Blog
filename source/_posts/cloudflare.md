---
title: 本站已启用通配符证书
date: 2018-03-15 09:38:00
categories: Https
tags:
  - Https
  - Let’s Encrypt
  - acme.sh
  - Nginx
---
## 前言
从去年开始，这个小博客一直在用`Let’s Encrypt`的免费证书。
昨天`ACMEv2`节点终于正式公布了，所以借着这个时机换了一整套证书配置，具体如下：

1. 将证书签发工具从`CertBot`更换为`acme.sh`
2. `NS`服务商由`1984 Hosting`更换为`Cloudflare`
3. 将`RSA4096`的证书更换为`ECC384`
4. 换用通配符证书

从上次写`Https`配置的文档到现在，已经有很多地方做过变更了。
所以借这个时机，重新来记录一下现在签发证书的整个流程，已备以后查阅。

<!-- more -->
## acme.sh
将`CertBot`更换`acme.sh`的主要原因是它支持`ECC`证书。
我想用`ECC`证书已经很久了，正好借这个时机换掉。

`acme.sh`跟`CertBot`比还有一些其他优点，如：
1. 几乎无环境依赖，任意用户都可以安装，无需`root`，所有文件都会生成在`~`下的一个目录里，卸载只需要删掉这个目录即可
   * 好吧还得删掉`crontab`里的任务，不过不删也没啥影响
2. 带自动更新功能，不用整天手动检查了
3. 自动配置`crontab`任务来更新证书，无需自己折腾
4. 支持`DNS`模式，以及自动设置`DNS`记录来实现全自动更新通过`DNS`挑战签发的证书(通配符目前只支持`DNS`挑战)
   * 没仔细研究`certbot`是否支持`DNS`模式，至少`certbot --help`没看到相关命令，如果有请回复指正谢谢~

### 安装`acme.sh`
参照[官网][acme.sh]的文档，安装非常简单，只需要执行一条命令即可：

```sh
curl https://get.acme.sh | sh
```

虽然`acme.sh`本身无权限要求，但为了之后的证书更新后自动重启`Nginx`，这时候最好还是用`root`来安装。

## 更换 NS 服务商为`Cloudflare`
由于想签通配符证书，而`ACMEv2`要求通配符只能用`DNS`挑战，所以需要一家支持通过`API`更新`DNS`记录的`NS`。
之前用的`1984 Hosting`翻了半天没找到，大概是不支持。
然后就直接拿`acme.sh`文档里`DNS API`支持列表里的第一家`Cloudflare`来用了。

简单看了下`Cloudflare`的好处：
1. 支持`IPv6`，之前那家不支持
2. 有`API`，可以让证书签发工具自动更新
3. 知名度更高，大概会更稳定更快一些把

### 更换流程
1. 打开[Cloudflare 官网][Cloudflare]，注册(登录)账号
2. 点右上角的`+ Add Site`，然后一步步照着流程走即可
3. 去`Crypto`设置，把`SSL`改为`Off`，最下面点`Disable Universal SSL`按钮
4. 去`DNS`设置，检查之前域名的解析是否都挪过来了，如果没有则需要手动添加(我的自动添加的就少了几个)
5. 去`DNS`设置，禁用所有域名右边的小云彩图标，这个开启时别人是无法解析到你的服务器地址的，只能解析到`Cloudflare`到`CDN`服务器

### 开启 DNS CAA
DNS CAA 可限制你的域名只有特定的证书签发机构可以签发证书，且无权签发的签发机构收到签发证书申请时会给你发邮件提醒
之前那篇文章里说的开启方式其实是错误的，在这里重新写一下：

1. 添加`CAA`记录，`Name`为你的根域名，`Tag`为`Allow wildcards and specific hostnames`，`Value`为`letsencrypt.org`
2. 添加`CAA`记录，`Name`为你的根域名，`Tag`为`Send violation reports to URL`，`Value`为`mailto:你的邮箱`
3. 添加完毕后可以通过`dig caa 你的域名`来验证是否成功，记录值会像这样：
   ```
   cat73.org.              300     IN      CAA     0 iodef "mailto:root@cat73.org"
   cat73.org.              300     IN      CAA     0 issue "letsencrypt.org"
   ```

### 获取 API Key
这一步是为了让`acme.sh`能自动设置`DNS`记录来自动更新证书的。

1. 打开[Cloudflare 官网][Cloudflare]，登录账号
2. 打开[个人配置](https://www.cloudflare.com/a/profile)
3. 点击下方`API Key`中的`Global API Key`右边的`View API Key`
4. 将上一步查询到的`Key`保存备用
   * 注意：就像查看时它告诉你的，像保护你的密码似的保护这个`Key`，一定不要泄漏

## 签发证书
编写一个`shell`文件，然后执行它来签发第一次证书：

```sh
#!/bin/sh

export CF_Key="你刚刚获取到的 API Key"
export CF_Email="你在 Cloudflare 注册时使用的邮箱"

/root/.acme.sh/acme.sh \
        --issue \
        -d cat73.org \
        -d *.cat73.org \
        --dns dns_cf \
        --dnssleep 30 \
        --keylength ec-384 \
        --ocsp \
        --force

```

上面是我用的，用之前记得把`-d`后面的改成自己的域名，`--force`是为了在尚未过期的时候强制更新证书(方便改参数测试)
我的博客向来是不考虑旧浏览器兼容的，性能也排在安全之后，所以直接只用一张`ec-384`的证书，如果你要考虑兼容性，可能需要删掉`keylength`参数

## 自动复制证书
TODO(原谅我忙其实我也还没做这一步)

## 自动重启 Web 服务器
证书签发后，`Web 服务器`一般不会自动重载证书，这时可以让`acme.sh`替你自动重启。
只需要添加一个参数，如我的`Nginx`：

```sh
        --reloadcmd "/etc/init.d/nginx reload" \
```

## 自动续期
前面说了，`acme.sh`会自动配置`crontab`来自动续签证书，所以就不用为这个操心了。

## Nginx 配置
我的`nginx.conf`中`SSL`部分的配置

```
##
# SSL Settings
##

ssl_protocols TLSv1.2; # Dropping SSLv3, ref: POODLE
ssl_prefer_server_ciphers on;
# ECC 证书只能用 ECDSA 的 cipher；如果想在 SSLLabs 得满分，那就不能支持 AES128
ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA';
# Let’s Encrypt 签的证书是 secp384r1 的，因此这两个顺序可以调换，sect571r1 并不能带来更高的安全性
# 如果是 OpenSSL 1.1.x，则可额外添加 X25519，但会导致 SSLLabs 无法得到满分
ssl_ecdh_curve sect571r1:secp384r1;

# 启用 SSL Session 加快重连
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:20m;

# 启用 OCSP 服务器装订加快浏览器 SSL 握手
ssl_stapling on;
ssl_stapling_verify on;
```

针对域名的配置(以本博客为例)：

```
server {
    # 启用 HTTP2
    listen 443 ssl http2;
    server_name blog.cat73.org;

    # 配置证书路径
    ssl_certificate /etc/nginx/ssl/cat73.org_ecc/fullchain.cer;
    ssl_certificate_key /etc/nginx/ssl/cat73.org_ecc/cat73.org.key;


    # 启用 HSTS
    add_header Strict-Transport-Security "max-age=15768000";
    # 当浏览器检测到 XSS 时拒绝加载页面
    add_header X-XSS-Protection "1; mode=block";
    # 禁止被嵌套在非同域的框架中
    add_header X-Frame-Options SAMEORIGIN;
    # 禁止内容类型猜解
    add_header X-Content-Type-Options nosniff;
    # CSP 内容控制策略
    add_header Content-Security-Policy "default-src 'none'; child-src *.disqus.com; connect-src *.disqus.com; font-src 'self'; img-src 'self' *.disqus.com *.disquscdn.com; script-src 'self' 'unsafe-inline' *.disqus.com *.disquscdn.com; style-src 'self' *.disquscdn.com; ";
    # 在使用缓存之前必须向服务器确认
    add_header Cache-Control no-cache;


    # 网站静态文件存放路径
    root /var/www/blog;
}
```

## Links
* [acme.sh][]
* [Cloudflare][]

<!-- links -->
[acme.sh]:      https://acme.sh
[Cloudflare]:   https://www.cloudflare.com
