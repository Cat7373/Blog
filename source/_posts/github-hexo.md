---
title: 本博客的搭建过程
date: 2016-06-08 07:30:00
categories: Hexo
tags:
  - Hexo
  - Github
---
## 前言
> 本文章基于`Windows 10`+`Git v2.8.3`+`NodeJS v6.2.1`+`Hexo v3.2.0`，不同平台和版本的实际操作可能略有不同。

<!-- more -->
## 准备工作
### 安装 Hexo 依赖的工具
1. 下载并安装[Git][]。
2. 下载并安装[Node.js][]。

### 安装 Hexo
打开`Git Bash`，输入下面的命令安装`Hexo`：
```
npm install hexo-cli -g
npm install hexo --save
```

## 创建博客
1. 找一个你喜欢的地方创建存放博客的文件夹。
2. 打开这个文件夹，然后右键并在弹出菜单中点击`Git Bash Here`。
3. 输入下面的命令来创建你的博客：
```
hexo init
npm install
```

## 预览博客
1. 执行`hexo server`，来启动本地服务器。
2. 在浏览器中打开`localhost:4000`预览博客。
3. 使用`Ctrl + C`，也就是平时复制的快捷键来停止本地服务器。

## 安装主题
本博客使用的是`NexT`主题，更多主题可以到 [Hexo 主题库](https://hexo.io/themes/)下载。
请参考 [NexT 的文档][]完成主题的安装与配置。

## 编写文章
1. 执行`hexo new "文章名称"`可以自动创建一篇新的文章。
2. 在`source\_posts`里找到刚刚创建的文章，在里面写文章的内容。
  * 文章采用 Markdown 编写，[点击这里](http://wowubuntu.com/markdown/)打开 Markdown 的语法说明。
  * 参考 [Hexo 官方文档][] 中的基本操作部分。

## 将博客上传到 Github
### 准备工作
1. 在[Github][]注册一个账号。
2. 打开[创建新项目](https://github.com/new)页面。
3. `Repository name`为你的`Github用户名.github.io`。
   如你的`Github用户名`是`abc`，则填入`abc.github.io`。
4. 点击下面绿色的`Create repository`完成项目的创建。
5. 执行下面的指令安装`Hexo`的`Git`支持库：
```
npm install hexo-deployer-git --save
```

### Hexo 部署设置
1. 编辑`_config.yml`，在`deploy`部分将`type`设置为`git`。
2. 在`type`下面加一行，内容为`repo: 部署地址`，注意跟`type`对其空格。
   部署地址为`https://github.com/用户名/用户名.github.io.git`。
   如你的`Github用户名`是`abc`，则填入`https://github.com/abc/abc.github.io.git`。

### 将博客上传到 Github
1. 执行`hexo generate --deploy`将你的博客上传到`Github`。
   上传过程中会弹窗提示你输入账号密码，输入你注册时的账号密码即可。
2. 打开浏览器访问`Github用户名.github.io`就可以看到你的博客了。
   如你的`Github用户名`是`abc`，则地址为`abc.github.io`。

## 使用自己的域名
1. 在`source`下创建一个名为`CNAME`的文件，内容为你要使用的域名，如本博客为`blog.cat73.org`。
2. 编辑`_config.yml`，使`url`的内容为你的主页地址，如本博客为`http://blog.cat73.org`。
3. 将你的域名通过`CNAME`解析到你的`github.io`地址，如本博客为`cat7373.github.io`。

## 一些链接
### 优化
* [hexo 集成 gulp 插件压缩站点静态资源](https://zoakerc.com/archives/minify-static-resources-in-hexo-by-gulp-plugins/)

### 参考内容
* [Hexo 官方文档][]
* [使用GitHub和Hexo搭建免费静态Blog](https://wsgzao.github.io/post/hexo-guide/)
* [Github Pages301重定向简单的让我有点接受唔到咯](http://www.arao.me/2015/github-pages-araome-301-www/)

[Git]:           https://git-scm.com
[Node.js]:       https://nodejs.org
[Hexo]:          https://hexo.io
[Github]:        https://github.com
[Hexo 官方文档]: https://hexo.io/zh-cn/docs/
[NexT 的文档]:   http://theme-next.iissnan.com/getting-started.html
