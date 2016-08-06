---
title: FileReader 是如何读取中文的？
date: 2016-8-6 19:57:41
updated: 2016-8-6 22:21:46
categories: Java
tags:
  - Java
---
## 前言
今天看到这么一个问题：`FileReader是如何读取一个中文的,烦请大神分析一下?`，于是写篇文章来分析一下 0.0
> 本回答仅对 Oracle JDK 1.8.0 负责。

<!-- more -->
## 初步分析
首先看一下`FileReader`的源代码：

```java
// java.io.FileReader.java (已省略文档注释)
public class FileReader extends InputStreamReader {
    public FileReader(String fileName) throws FileNotFoundException {
        super(new FileInputStream(fileName));
    }

    public FileReader(File file) throws FileNotFoundException {
        super(new FileInputStream(file));
    }

    public FileReader(FileDescriptor fd) {
        super(new FileInputStream(fd));
    }
}```
实际看一下`FileReader`的源代码就会发现，它其实只是简单的包装了一下`InputStreamReader`，简单的帮你将文件转换成了`FileInputStream`传递给了`InputStreamReader`。
而中文其实就是一个`char`，那么问题实际上就是：*`InputStreamReader`是如何读取`char`的*。

让我们来看一下`InputStreamReader`的`read`是怎么做的(只有`char[]`参数的`read`方法其实是包装了这个方法)：

```java
// int java.io.InputStreamReader.read(char, int, int)
public int read(char cbuf[], int offset, int length) throws IOException {
    return sd.read(cbuf, offset, length);
}```
我们可以看到它只是对`sd.read`的包装，那么我们再来看看这个`sd`是个什么鬼：
```java
// int java.io.InputStreamReader.java (已省略文档注释)
private final StreamDecoder sd;

public InputStreamReader(InputStream in) {
    super(in);
    try {
        sd = StreamDecoder.forInputStreamReader(in, this, (String)null); // ## check lock object
    } catch (UnsupportedEncodingException e) {
        // The default encoding should always be available
        throw new Error(e);
    }
}```
可以看到`sd`是`StreamDecoder`的实例，顺便贴了被`FileReader`调用的构造函数，可以看到就是在这里实例化了`sd`。
那么我们再去瞅瞅这个`StreamDecoder.read`，这货是`sun`包的，没有直接提供源码。
但我们不怕，可以反编译，也可以看`OpenJDK`的代码，为了方便看，这里选择了看`OpenJDK`的代码。

## StreamDecoder
首先来看看它的`read`方法：
```java
public int read(char cbuf[], int offset, int length) throws IOException {
    // 创建两个临时变量，避免直接修改参数
    int off = offset;
    int len = length;
    // 加锁
    synchronized (lock) {
        // 检查自己是否已开启，如果没有则抛出异常
        ensureOpen();
        // 检查输出参数是否无效，无效则抛出异常
        if ((off < 0) || (off > cbuf.length) || (len < 0) ||
            ((off + len) > cbuf.length) || ((off + len) < 0)) {
            throw new IndexOutOfBoundsException();
        }
        // 如果读取长度为 0，则直接返回 0
        if (len == 0)
            return 0;

        // 如上次读取的 2 个 byte 不是双字节字符，则这个值会被设置为 1 来防止返回值计算错误
        int n = 0;

        // 如上次读取的 2 个 byte 不是双字节字符
        if (haveLeftoverChar) {
            // 将上次读取的两个 byte 的后面的一个保存到返回值数组的第一个位置
            // Copy the leftover char into the buffer
            cbuf[off] = leftoverChar;
            // 因为已经读取了一个字符，所以起始地址增加 1，长度减少 1
            off++; len--;
            // 因为已经用过了上次读取的两个 byte 中后面的一个，所以上次取消设置这个标志位
            haveLeftoverChar = false;
            // 已经读取了一个字符，将这个值设置为 1 来防止返回值计算错误
            n = 1;
            // 如果还需读取的长度为 0，或尚未准备好读取，则直接返回已读长度(1)
            if ((len == 0) || !implReady())
                // Return now if this is all we can produce w/o blocking
                return n;
        }

        // 如果还需读取的字符长度为 1
        if (len == 1) {
            // 调用 read0 读取一个字符
            // Treat single-character array reads just like read()
            int c = read0();
            // 如果读取失败，则根据 n 的值确定返回失败还是 n
            if (c == -1)
                return (n == 0) ? -1 : n;
            // 保存读取到的字符
            cbuf[off] = (char)c;
            // 返回读取长度
            return n + 1;
        }

        // 调用 implRead 来读取更多字符
        return n + implRead(cbuf, off, off + len);
    }
}```
可以看到前面都是针对单个字符的处理，实际读取多个字符的是后面的`implRead`，而之前也有个`read0`可以读取一个字符。
查看源代码发现，`read0`实际上还是对`read`的包装，最后还是会调用到`implRead`，所以就不浪费时间了，直接看`implRead`吧：

```java
int implRead(char[] cbuf, int off, int end) throws IOException {
    // 如果要读取的长度 <= 0，则抛出异常
    // In order to handle surrogate pairs, this method requires that
    // the invoker attempt to read at least two characters.  Saving the
    // extra character, if any, at a higher level is easier than trying
    // to deal with it here.
    assert (end - off > 1);

    // 创建保存结果的容器
    CharBuffer cb = CharBuffer.wrap(cbuf, off, end - off);
    if (cb.position() != 0)
        // Ensure that cb[0] == cbuf[off]
        cb = cb.slice();

    // 是否已经读到结尾的标志位
    boolean eof = false;
    for (;;) {
        // 对缓冲区中的字符进行解码
        CoderResult cr = decoder.decode(bb, cb, eof);
        // 如果没有更多的输入要处理
        if (cr.isUnderflow()) {
            // 如果已经读到结尾则跳出循环
            if (eof)
                break;
            // 如果输出保存结果的容器已经没有剩余空间则跳出循环
            if (!cb.hasRemaining())
                break;
            // 如果已经读了一些数据，且尚未准备好继续读取，则跳出循环
            if ((cb.position() > 0) && !inReady())
                break;          // Block at most once
            // 刷新输入缓冲区
            int n = readBytes();
            if (n < 0) {
                eof = true;
                if ((cb.position() == 0) && (!bb.hasRemaining()))
                    break;
                decoder.reset();
            }
            continue;
        }
        // 如果输出缓冲区没有更多的空间则跳出循环
        if (cr.isOverflow()) {
            assert cb.position() > 0;
            break;
        }
        cr.throwException();
    }

    // 如果已经读到结尾则重置解码器
    if (eof) {
        // ## Need to flush decoder
        decoder.reset();
    }

    // 如果一个字也没读出来，则返回读取失败
    if (cb.position() == 0) {
        if (eof)
            return -1;
        assert false;
    }
    
    // 返回读取长度
    return cb.position();
}```
可以看到，最关键的解码是由`decoder.decode`来完成的，那么这个`decoder`是啥呢，我们来瞅瞅：

```java
private CharsetDecoder decoder;

StreamDecoder(InputStream in, Object lock, Charset cs) {
    this(in, lock, cs.newDecoder().onMalformedInput(CodingErrorAction.REPLACE).onUnmappableCharacter(CodingErrorAction.REPLACE));
}

StreamDecoder(InputStream in, Object lock, CharsetDecoder dec) {
    super(lock);
    this.cs = dec.charset();
    this.decoder = dec;

    // This path disabled until direct buffers are faster
    if (false && in instanceof FileInputStream) {
        ch = getChannel((FileInputStream)in);
        if (ch != null)
            bb = ByteBuffer.allocateDirect(DEFAULT_BYTE_BUFFER_SIZE);
    }
    if (ch == null) {
        this.in = in;
        this.ch = null;
        bb = ByteBuffer.allocate(DEFAULT_BYTE_BUFFER_SIZE);
    }
    bb.flip();                      // So that bb is initially empty
}
```
通过看源代码可以发现，这个东东是由构造函数去初始化的，回顾下`InputStreamReader`的构造函数，构造`StreamDecoder`的方法其实是这个：

```java
sd = StreamDecoder.forInputStreamReader(in, this, (String)null);```
OK，来瞅瞅这个`forInputStreamReader`：

```java
public static StreamDecoder forInputStreamReader(InputStream in, Object lock, String charsetName) throws UnsupportedEncodingException {
    String csn = charsetName;
    if (csn == null)
        csn = Charset.defaultCharset().name();
    try {
        if (Charset.isSupported(csn))
            return new StreamDecoder(in, lock, Charset.forName(csn));
    } catch (IllegalCharsetNameException x) { }
    throw new UnsupportedEncodingException (csn);
}```
`charsetName`参数传进来的就是`null`，所以实际会取`Charset.defaultCharset().name()`。
查看源码可知，这个默认编码可以通过启动参数修改，默认是`UTF-8`。
这里我就不再去分析`Charset.newDecoder`的做了什么了，直接拿一段简单的代码执行一下就知道了：

```java
Log.debugVals(Charset.defaultCharset().newDecoder().getClass());
// [00:00:00] [DEBUG]: [class sun.nio.cs.UTF_8$Decoder]
```
OK，现在我们知道了，解码工作实际是由`sun.nio.cs.UTF_8$Decoder`来完成的。
这个类是个很长的类，里面实现了`UTF-8`的解码，这个就比较复杂了，我就不写了，有兴趣可以自己去瞅瞅：
[sun.nio.cs.UTF_8$Decoder](http://hg.openjdk.java.net/jdk8/jdk8/jdk/file/687fd7c7986d/src/share/classes/sun/nio/cs/UTF_8.java#l81)

## 结论
`FileReader`是通过`UTF-8`解码来读取中文的。

## 链接 & 参考
* [StreamDecoder.java](http://hg.openjdk.java.net/jdk8/jdk8/jdk/file/687fd7c7986d/src/share/classes/sun/nio/cs/StreamDecoder.java)
