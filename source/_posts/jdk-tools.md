---
title: JDK 自带的命令行工具
date: 2016-7-31 11:26:07
updated: 2016-8-1 12:16:33
categories: Java
tags:
  - Java
---
## 前言
Java 开发人员可能都知道`java`、`javac`这两个命令，但实际上 JDK 的 bin 目录下还有很多其他的命令行工具。
之前我也没怎么用过这些工具，所以写篇文章记录下这些工具的用途及使用方式。

<!-- more -->
## 本文介绍的工具列表
| 命令 | 全名 | 作用 |
| ---- | ---- | ---- |
| jps | JVM Process Status Tool | 显示指定系统内所有 HotSpot 虚拟机进程 |
| jstat | JVM Statistics Monitoring Tool | 显示 HotSpot 虚拟机各方面的运行数据 |
| jinfo | Configuration Info for Java | 显示虚拟机配置信息 |
| jmap | Memory Map for Java | 生成虚拟机内存转储快照 (heapdump 文件) |
| jhat | JVM Heap Dump Browser | 用于分析 heapdump 文件，会建立一个 HTTP 服务器，让用户可以在浏览器上查看分析结果 |
| jstack | Stack Trace for Java | 显示虚拟机的线程快照 |
| hsdis | TODO | TODO |
| javap | TODO | TODO |

## jps：显示虚拟机进程列表
与`Linux`的`ps`命令类似，可以列出正在运行的虚拟机进程，并显示其主类(main 函数所在的类)名称以及这些进程的本地虚拟机唯一 ID (Local Virtual Machine Identifier，LVMID)。

jps 命令格式：`jps [options] [hostid]`

`jps`可以通过`RMI`协议查询开启了`RMI`服务的远程虚拟机进程状态，`hostid`为`RMI`注册表中注册的主机名。

### jps 工具的主要选项
| 选项 | 作用 |
| ---- | ---- |
| -q | 只输出 LVMID，省略主类的名称 |
| -m | 输出虚拟机启动时传递给 main 函数的参数 |
| -l | 输出主类的全名，如果进程执行的是 jar 包，则输出 jar 路径 |
| -v | 输出虚拟机启动时的 JVM 参数 |

### jps 执行样例
```
C:\Users\cat73>jps -l
29500 sun.tools.jps.Jps

C:\Users\cat73>jps -lmv
20556 sun.tools.jps.Jps -lmv -Dapplication.home=C:\Program Files\Java\jdk1.8.0_102 -Xms8m
```

## jstat：虚拟机统计信息监视工具
jstat 用于监视各种虚拟机的运行状态信息，它可以显示本地或远程虚拟机中的类加载、内存、GC、JIT 编译等运行数据。

jstat 命令格式：`jstat [options] [-t] [-h <lines>] <vmid> [<interval> [<count>]]`

命令中的`VMID`代表的是虚拟机进程 ID，如果是本地虚拟机进程，`VMID`与`LVMID`是一致的，如果是远程虚拟机，那`VMID`的格式应当为：
`[protocol:][//]lvmid[@hostname[:port]/servername]`

参数`interval`和`count`代表查询间隔和次数，如果省略这两个参数则只查询一次。
假设要每隔 500 毫秒查询一次进程 7373 的垃圾收集情况，一共查询 20 次，则命令应为：
`jstat -gc 7373 500 20`

`-h <lines>`表示每隔几行重新输出一次标题，如`-h 5`为每隔 5 行重新输出一次标题。
`-t`会在输出中增加一列来表示当前虚拟机已经运行了多久。

### jstat 工具的主要选项
| 选项 | 作用 |
| ---- | ---- |
| -class | 监视类装载、卸载数量、总空间及装载所耗费的时间 |
| -gc | 监视 Java 堆情况，包括各个区域的容量、GC 时间等信息 |
| -gccapacity | 与 -gc 基本相同，但主要关注 Java 堆各个区域使用的最大、最小空间 |
| -gcutil | 与 -gc 基本相同，但主要关注已使用空间占总空间的百分比 |
| -gccause | 与 -gcutil 功能一致，但是会额外输出上一次 GC 产生的原因 |
| -gcnew | 监视新生代 GC 的状态 |
| -gcnewcapacity |  与 -gcnew 基本相同，但主要关注使用的最大、最小空间  |
| -gcold | 监视老年代 GC 的状态 |
| -gcoldcapacity | 与 -gcold 基本相同，但主要关注使用的最大、最小空间 |
| -gcpermcapacity | 监视永久带使用的最大、最小空间(Java8 之前) |
| -gcmetacapacity | 监视元空间使用的最大、最小空间(Java8 之后) |
| -compiler | 输出 JIT 编译器编译过的方法、耗时的信息 |
| -printcompilation | 输出已被 JIT 编译的方法 |

有关`jstat`输出信息中每列的含义，请参考文章最后的链接中的`jstat`官方文档。

### jstat 执行样例
```
# 输出进程 7373 的类装载、卸载数量、总空间及装载所耗费的时间
# 每隔 5 行重新输出一次标题，同时输出虚拟机运行时间
# 每隔 2000ms 执行一次，共执行 10 次
C:\Users\cat73>jstat -class -h 5 -t 7373 2000 10
Timestamp       Loaded  Bytes  Unloaded  Bytes     Time
        48519.0  17210 35539.1        0     0.0      45.57
        48521.1  17210 35539.1        0     0.0      45.57
        48523.1  17210 35539.1        0     0.0      45.57
        48525.1  17210 35539.1        0     0.0      45.57
        48527.1  17210 35539.1        0     0.0      45.57
Timestamp       Loaded  Bytes  Unloaded  Bytes     Time
        48529.1  17210 35539.1        0     0.0      45.57
        48531.1  17210 35539.1        0     0.0      45.57
        48533.1  17211 35540.6        0     0.0      45.57
        48535.1  17211 35540.6        0     0.0      45.57
        48537.1  17211 35540.6        0     0.0      45.57
```

## jinfo：Java 配置信息工具
jinfo 的作用是实时查看及调整虚拟机的各项参数。

jinfo 命令格式：`jinfo [option] <<pid> | <executable <core>> | [server_id@]<remote server IP or hostname>>`

其中`pid`代表的是虚拟机进程 ID。

### jinfo 工具的主要选项
| 选项 | 作用 |
| ---- | ---- |
| -flag <name> | 输出 name 这个属性的值 |
| -flag [+&#124;-]<name> | 动态调整一个属性的开关 |
| -flag <name>=<value> | 动态修改一个属性的值 |
| -flags | 输出 JVM 属性中被修改过的属性的列表 |
| -sysprops | 输出虚拟机进程的 System.getProperties() 的内容 |
| 无参数 | 相当于 -flags 与 -sysprops 同时启用 |

## TODO 尚未写完

## 链接 & 参考
* [JDK 8 小工具列表](http://docs.oracle.com/javase/8/docs/technotes/tools/)
* [jps 官方文档](http://docs.oracle.com/javase/8/docs/technotes/tools/unix/jps.html)
* [jstat 官方文档](http://docs.oracle.com/javase/8/docs/technotes/tools/unix/jstat.html)
* [jinfo 官方文档](http://docs.oracle.com/javase/8/docs/technotes/tools/unix/jinfo.html)
* 深入理解 Java 虚拟机：JVM高级特性与最佳实践（第二版）
