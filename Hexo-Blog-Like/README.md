## 部署教程

下面开始部署教程，你可以使用Cloudflare或leancloud储存点赞数据

使用Cloudflare储存点赞数据后端一键部署：

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/2010HCY/Blog-Likes-Backend)


使用leancloud储存点赞数据需要提前注册好[**leancloud**账号](https://www.leancloud.com/)，只需要邮箱即可注册，无需绑定信用卡之类的，注册即用（中国大陆版要备案）。

### npm一键部署

> 适用于Hexo框架，其他框架我没用过

在博客根目录粘贴以下命令一键安装

```
npm install hexo-blog-like --save
```

安装好后在博客根目录的_config.yml添加以下配置项：

```
Blog-Like:
enable: true #是否启用插件
Backend: Cloudflare # 或者 Leancloud，默认Cloudflare
CloudflareBackend: #你的后端地址
AppID: #如果你使用Leancloud，记得填你的Leancloud ID和KEY
AppKEY: #你的KEY
xianzhi: true #是否限制点赞数，默认开启
number: 5 #如果限制点赞数，限制的点赞数，默认为5个赞
```

完事后`hexo clean && hexo g && hexo s`启动博客，在你想要的位置插入如下代码块，打开博客瞅瞅效果吧！

```
<div id="zan" class="clearfix">
    <div class="heart" onclick="goodplus(url, flag)"></div>
    <br>
    <div id="zan_text"></div>
</div>
```

<img src="/images/效果展示.png" style="zoom:80%;" />

对你有帮助的话给我个Starred吧！

https://github.com/2010HCY/Blog-Like