---
title: 用 Nginx 自动给 Cookie 增加 Secure 和 HttpOnly
date: 2017-08-02 10:04:00
categories: Nginx
tags:
  - Nginx
  - Cookie
---
## 前言
> 闲的蛋疼瞎折腾。。
> 通过`Nginx`保证全站`HTTPS`时小饼干的安全性 0.0

<!-- more -->
## 在 nginx 的 location 中配置
```
# 只支持 proxy 模式下设置，SameSite 不需要可删除
proxy_cookie_path / "/; httponly; secure; SameSite=Lax";
```

## 示例
```
server {
    listen 443 ssl http2;
    server_name www.cat73.org;

    ssl_certificate /etc/letsencrypt/live/cat73.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cat73.org/privkey.pem;

    ssl_trusted_certificate /etc/letsencrypt/live/cat73.org/chain.pem;

    add_header X-XSS-Protection "1; mode=block";
    add_header X-Frame-Options SAMEORIGIN;
    add_header Strict-Transport-Security "max-age=15768000";

    location / {
        root /var/www/html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # 在这里设置
        proxy_cookie_path / "/; httponly; secure; SameSite=Lax";
    }
}
```
