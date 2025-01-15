## 部署教程

下面开始部署教程，你需要提前注册好[**leancloud**账号](https://www.leancloud.com/)，只需要邮箱即可注册，无需绑定信用卡之类的，注册即用（中国大陆版要备案）。

### npm一键部署

> 适用于Hexo框架，其他框架我没用过

在博客根目录粘贴以下命令一键安装

```
npm install hexo-blog-like --save
```

安装好后在博客根目录的_config.yml添加以下配置项：

```
Blog-Like:
  enable: true //是否启用本插件
  AppID: "你的ID" //填写前面获取的AppID
  AppKEY: "你的KEY" //填写AppKEY
  xianzhi: true //是否开启访客点赞数限制
  number: 5 //限制为几个赞，默认是5个
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