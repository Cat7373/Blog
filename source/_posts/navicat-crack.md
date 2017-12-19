---
title: Navicat12 无限试用
date: 2017-12-19 16:12:00
categories: Navicat
tags:
  - Navicat
---
## 前言
> 以前自己玩的时候一直用`Navicat`操作数据库，感觉手感不错
> `Windows`上直接百度破解版用的也挺爽的
> 然而好景不长，今年5月份我换了`Ubuntu`做开发机
> 虽然说`Linux`版就是`wine`运行的`Windows`版，然而因为上班了，因此开始不太信任来源不明的破解版
> 然后就开始折腾着破解，后来发现还是重置试用期简单点，然后就一直这么无限试用下去了
> 直到最近又换了`Mac`。。。

<!-- more -->
## Linux
`Linux`下`Navicat`是通过脚本启动的，因此很容易在运行之前插一个脚本，由这个脚本来重置试用期
注意脚本是`Python3`的，每次运行均会重置试用期到`14`天，要求`64`位版`Navicat`

```python
#!/usr/bin/env python3
# -*- coding:utf-8 -*-

import os
import re

# 试用时间重置的正则
ps = (
        re.compile(r'\[Software\\\\PremiumSoft\\\\Data\\\\\{[^\}]*\}\\\\Info\].*?\n[^\[]*'),
        re.compile(r'\[Software\\\\Classes\\\\CLSID\\\\\{[^\}]*\}\\\\Info\].*?\n[^\[]*')
    )

# user.reg 的路径
regfile = os.path.join(os.environ['HOME'], '.navicat64', 'user.reg')

# 正则替换
with open(regfile, 'r+') as f:
    regstr = f.read()
    for p in ps:
        regstr = p.sub(lambda m: '', regstr)

    f.seek(0, 0)
    f.truncate()
    f.write(regstr)

```

## Mac
`Mac`下破解很简单，只要删除一个文件即可(不会丢失任何配置)，因此我给丢了个`cron`定时任务
运行`crontab -e`，然后粘贴下面的内容即可(注意要在自己的用户上运行，不要到跳到`root`)
如果哪天发现破解没生效提示已过期，就关掉之后手动执行一下重置命令即可

```cron
# m h dom mon dow command
0 10 * * * rm ~/Library/Application\ Support/PremiumSoft\ CyberTech/Navicat*/Navicat*/.tc*
```

## Windows
由于`Windows`用的注册表，所以感觉略麻烦，加上我自己不用`Windows`，所以就简单来了

1. `Win + R`，输入`regedit`回车
2. 删除`HKEY_CURRENT_USER\Software\PremiumSoft\Data`
3. 展开`HKEY_CURRENT_USER\Software\Classes\CLSID`
4. 展开每一个子文件夹，如果里面只包含一个名为`Info`的文件夹，就删掉它
