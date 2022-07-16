# Twitch Chat Danmaku With YouTube
## 在twitch中同时显示twitch和YouTube弹幕
### 已支持YouTube头像和表情。特殊用途，懂得都懂（dddd

# 使用方式

## 1，安装并配置<code>python</code>环境

## 2，安装<code>chat_downloader</code>组件
> <code> pip install chat_downloader </code>

> 用于获取YouTube弹幕数据。项目详见 (https://github.com/xenova/chat-downloader)

## 3，替换文件

### 替换<code>chat_downloader.py</code>文件

> 以Windows系统为例，此文件位置在
> <code> Python\Lib\site-packages\chat_downloader\  </code>中，
> 或者使用<code>everything</code>这个软件直接搜索<code>chat_downloader.py</code>

> 用于在本地建立一个WebSocket服务，方便弹幕插件获取YouTube弹幕数据

## 4，启动chat_downloader，获取一个正在直播中的YouTube弹幕数据

> <code> chat_downloader https://www.youtube.com/watch?v=kgx4WGK0oNU </code>

> 网址请自行替换为需要显示弹幕内容的YouTube直播地址

> 可以通过<code>弹幕播放姬.html</code>这个文件进行测试，使用浏览器打开即可。
> 若可以同步显示YouTube那边弹幕数据，且发送的消息可正常显示，则说明WebScoket服务已正常启用

## 5，浏览器进入插件管理界面，开启开发者模式，点击【加载解压缩的扩展】，导入插件

## 6，打开一个twitch直播，若出现<code>已连接YT弹幕服务器</code>，就可以同时显示twitch和YouTube弹幕了

> 后面可能会搭建一个在线的WebSocket服务器，这样就不需要本地python环境了。如果有比较便宜好用的外网服务器求个推荐^_^！