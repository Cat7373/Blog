---
title: YAML 格式学习笔记
date: 2016-6-16 12:23:36
updated: 2016-6-16 16:52:16
categories: YAML
tags:
  - YAML
---
## 前言
用了有几年的`YAML`了，比如`Bukkit`的配置、`Hexo`的`Front-matter`等都使用`YAML`。
然而从没看过`YAML`的文档，一直是凭着之前的经验来用的，很多细节都不是很清楚。
于是决定花点时间去学习下`YAML`，并在这里记下笔记方便日后查看。

<!-- more -->
## 简介
### YAML 基本元素
编程中有无数种数据结构，`YAML`认为数据都可以通过以下三种元素来表示它们：
1. 标量(相当于实际的数据，如`string`、`number`、`bool`)
2. 序列(`Array`、`List`)
3. 映射(`Map`)

### YAML 规范
1. `YAML`文件应该使用`Unicode`编码，如`UTF-8`。
2. 使用空格进行缩进，建议使用两个空格(但不强制，所有缩进使用的空格数应一致)，不支持`Tab`缩进。

## 基础语法
### 注释
* `#`后面的内容为注释。
* 注释会被解释器直接忽略。
* 注释与基础元素之间应该至少有一个空格作为分隔符，例：
```
# 这是一条注释
a: 123 #这是一条注释
b: 456      #这是一条注释
```

### 一个 YAML 文件中保存多个文档
一个`YAML`文件可以多个文档组成，文档间使用`---`作为文档开始标记，用`...`作为文档结束标记(可省略)，例子：
```
--- # 文档开始
# 文档1
... # 文档结束
--- # 文档开始
# 文档2
... # 文档结束
```
* 如果一个文件里只有一个文档，则可省略`---`标记。

## 元素
### 序列
序列中的每个成员使用一个减号加一个空格作为开头，例子：
```
--- # 文档开始
- Bukkit
- CraftBukkit
- Spigot
```
也可以使用紧凑模式，用`[]`包裹序列，并以`,`分隔成员：
```
--- # 文档开始
[Bukkit, CraftBukkit, Spigot]
```

### 映射
映射使用冒号加一个空格来分割键与值，例子：
```
--- # 文档开始
language: Java
version: 1.0.0
author: Cat73
```
也可以使用紧凑模式，用`{}`包裹映射，并以`,`分割键值对，例子：
```
--- # 文档开始
{language: Java, version: 1.0.0, author: Cat73}
```
使用`?`与`:`加空格来表示复杂的映射，例子：
```
--- # 文档开始
# 用序列做键，用映射做值
? - Bukkit
  - CraftBukkit
  - Spigot
: language: Java
  type: Minecraft_Server
# 紧凑模式
? [Bukkit, CraftBukkit, Spigot]
: {language: Java, type: Minecraft_Server}
```

## 高级用法
### 元素嵌套
#### List 套 List
```
--- # 文档开始
- a
- b
- - c
  - d
  - e
# 紧凑模式
[a, b, [c, d, e]]
```
#### List 套 Map
```
--- # 文档开始
- a
- b
- c: 1
  d: 2
  e: 3
# 紧凑模式
[a, b, {c: 1, d: 2, e: 3}]
```
#### Map 套 List
```
--- # 文档开始
a:
  - b
  - c
  - d
# 紧凑模式
{a: [b, c, d]}
```
#### Map 套 Map
```
--- # 文档开始
a:
  b: 1
  c: 2
  d: 3
# 紧凑模式
{a: {b: 1, c: 2, d: 3}}
```

### 多行文本
TODO

### 引用
TODO

### 类型转换
TODO

## 参考内容
* [YAML 官方文档][]
* [YAML 维基百科条目][]
* [JS-YAML](http://nodeca.github.io/js-yaml/)

[YAML 官方文档]:     http://yaml.org/spec/
[YAML 维基百科条目]: https://zh.wikipedia.org/wiki/YAML
