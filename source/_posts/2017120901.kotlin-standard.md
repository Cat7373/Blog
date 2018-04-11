---
title: Kotlin 的 with、apply、let 等函数的用处
date: 2017-12-09 23:41:00
categories: Kotlin
tags:
  - Kotlin
  - Java
---
## 前言
> 最近在玩`Kotlin`，然后就一脸懵逼的看到了所有对象都可以点出来的几个方法：  
> `with`、`apply`、`let` 等这几个  
> 一开始感觉一脸懵逼，于是百度了下，然后看一些博客的文章也没怎么看明白  
> 折腾了一会终于自己搞明白了，于是决定写篇文章记一下

<!-- more -->
## 非扩展函数的 run
这个函数的定义是这样的：
```kotlin
fun <R> run(block: () -> R): R
```
一个无参数的`lambda`表达式，允许自定义返回值  
这不是个扩展函数，因此不能用对象点出来  
但因为是顶级函数，所以可以在任何地方直接调用，其一般用途应该主要是这种代码：
```kotlin
run {
    // do something
}
val result = run {
    // do something
}
```

## run、apply
首先是这两个函数的签名：
```kotlin
fun <T, R> T.run(block: T.() -> R): R
fun <T> T.apply(block: T.() -> Unit): T
```
这两个函数的共同点在于，参数都是`T.()`  
因此在`lambda`中要以`this`来表示当前对象  
不同点在于：`run`可以自定义返回值，`apply`只能返回当前对象
使用示例：
```kotlin
"Hello"
    .run { this + " World" } // 在自身后面拼接字符串，并将结果返回
    .apply { println(this) } // 打印刚才拼接好的字符串
```

## also、let
还是先上签名：
```kotlin
fun <T, R> T.let(block: (T) -> R): R
fun <T> T.also(block: (T) -> Unit): T
```
这两个函数跟上面的两个功能几乎相同，可以看出`let`对`run`，`also`对`apply`  
区别在于参数的`lambda`的参数部分变成了`(T)`，因此要以`it`来表示当前对象
使用示例：
```kotlin
"Hello"
    .let { it + " World" } // 在自身后面拼接字符串，并将结果返回
    .also { println(it) } // 打印刚才拼接好的字符串
```

## with
先上签名：
```kotlin
fun <T, R> with(receiver: T, block: T.() -> R): R
```
这个函数的作用是以一个指定对象的身份去调用特定的代码，并允许自定义返回值  
感觉主要是为了新写法设计的，一般用途应该是这样的：
```kotlin
with ("Hello") {
    val str = this + " World"
    println(str)
}
```

## takeIf、takeUnless
先上签名：
```kotlin
fun <T> T.takeIf(predicate: (T) -> Boolean): T?
fun <T> T.takeUnless(predicate: (T) -> Boolean): T?
```
这两个方法可以执行一段代码，这段代码可以返回一个布尔值来控制之后的流程  
对于`takeIf`：如果返回`true`，则这个函数会返回`this`，否则会返回`null`
而对于`takeUnless`则刚好与`takeIf`的行为相反
使用示例：
```kotlin
"Hello"
    .takeIf { it.length == 5 } // 判断字符串的长度等于 5，返回 true，因此 takeIf 函数会返回 this
    ?.run { this + " World!" } // 拼接字符串，因为上一句没返回 null，所以可以正常执行
    ?.apply(::println) // 打印刚刚拼好的字符串
    ?.takeUnless { it.length == 5 } // 判断字符串的长度等于 5，返回 false，因此 takeUnless 函数会返回 this
    ?.apply(::println) // 打印刚刚拼好的字符串
    ?.takeIf { it.length == 5 } // 判断字符串的长度等于 5，返回 false，因此 takeIf 函数会返回 null
    ?.apply(::println) // 这句不会执行！因为上一句返回了 null
```
