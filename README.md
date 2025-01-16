# Blog-Like 博客点赞插件

## 特点介绍

此点赞功能适配Hexo博客，适合任何静态网站，只是步骤有所不同，以下是它的特点：

1. 免费，此点赞功能使用开发者的好伙伴**leancloud**存储点赞数据，免费版足够使用
2. 简洁，轻轻一点即可完成操作
3. 小巧，大小仅24.4kb（图像资源20kb）
4. 便捷，Hexo框架的博客仅需3步即可使用！

效果展示：

<img src="/images/效果展示.png" style="zoom:80%;" />

你可以到我的博客体验一下点赞功能哦 [立即前往](https://100713.xyz/%E7%BD%91%E7%AB%99%E7%BB%B4%E6%8A%A4/Hexo%E5%8D%9A%E5%AE%A2%E5%8A%A0%E5%85%A5%E7%82%B9%E8%B5%9E%E5%8A%9F%E8%83%BD)

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

<iframe
    src="https://ghbtns.com/github-btn.html?user=2010HCY&repo=Blog-Like&type=star&count=true"
    frameborder="0"
    scrolling="0"
    width="170"
    height="20"
    title="GitHub">
</iframe>

### 手动部署

#### 1.下载文件

首先下载此[压缩包](https://github.com/2010HCY/Blog-Like/releases/download/1.0/Blog-Like.7z)，你也可以到[Releases](https://github.com/2010HCY/Blog-Like/releases)下载最新版本。

下载后解压，得到三个文件zan.css、zan.js、zan.png

#### 2.初始化leancloud应用并获取凭证

注册好[**leancloud**账号](https://www.leancloud.com/)后进入控制台，点击创建应用，计费计划选择开发版，应用名称、描述随便填，

<img src="/images/创建应用.png" style="zoom:80%;" />

创建好后进入应用设置→点击应用凭证，将**AppID**和**AppKey**复制下来待会要用

<img src="/images/获取应用凭证.png" style="zoom:80%;" />

然后打开数据存储→结构化数据，创建一个名为Zan的Class。

<img src="/images/创建Class.png" style="zoom:70%;" />

#### 3.将JS、CSS放入博客

> 不同博客框架、主题路径可能有些许差别，但大体步骤是一样的。我的主题是matery

打开你的博客根目录，依次打开themes→hexo-theme-matery→source，在此目录下有JS和CSS两个文件夹，把zan.css扔进CSS目录，zan.js扔进JS目录，图片你可以放进图床或直接放在博客主题的source目录下，这样做是为了方便分类。

文件放好后还需要配置一下，打开zan.js，将第2、3行的ID、KEY修改成前面获取的**AppID** **AppKey**。

<img src="/images/JS配置.png" style="zoom:67%;" />

如果你按前面把图片放主题文件夹下的source文件夹，就跳过这行字，如果你把图片放图床了，那记得修改zan.css第45行改成你的图床链接。

<img src="/images/CSS修改.png" style="zoom:67%;" />

2.0版本加入了点赞次数限制配置功能，你可以修改true、false来开启关闭点赞次数限制，限制单访客点赞的次数，默认是限制单访客只能点5个赞，你可以自行修改

<img src="/images/点赞次数限制.png" style="zoom:67%;" />

#### 引入JS、CSS

打开你的博客head模板，通常在`themes/[你的主题]/layout/_partial/head.ejs`路径下，在最后几行`</head>`标签前添加以下代码：

```
    <link rel="stylesheet" href="/css/zan.css">
    <script src="https://cdn.jsdelivr.net/npm/leancloud-storage/dist/av-min.js"></script>
    <script src="/js/zan.js"></script>
```

<img src="/images/引入JS、CSS.png" style="zoom:67%;" />

完事保存退出，现在你已经完成了所有配置，最后只需要在文章内引用就可以啦

### 将点赞卡片插入到文章内

在你希望的位置插入如下代码片段，然后可以开耍喽！

```
<div id="zan" class="clearfix">
    <div class="heart" onclick="goodplus(url, flag)"></div>
    <br>
    <div id="zan_text"></div>
</div>
```

<img src="/images/效果展示.png" style="zoom:80%;" />

Starred！Starred！！Starred！！！弄好后自觉Starred！😈
<iframe
    src="https://ghbtns.com/github-btn.html?user=2010HCY&repo=Blog-Like&type=star&count=true"
    frameborder="0"
    scrolling="0"
    width="170"
    height="20"
    title="GitHub">
</iframe>

## 未来打算

- [x] 此脚本目前没有限制点赞次数，同一个访客可以不停的搓点赞次数，搓个上万次不成问题，未来打算加入一个开关选择是否限制单访客点赞次数，若打开则通过Cookie记录限制只能点一次赞或几次。
- [x] 制作成Hexo插件，可以一键安装使用
- [x] 长期接收意见以及维护

## 版本更新记录


2.1版本，修复了多个页面只能点五个赞，新版本把不同URL分开计算 2025.1.16

发布npm包，可以在Hexo博客中一键安装咯！ 2025.1.15

2.0版本，增加了点赞次数限制，使用Cookie记录点赞次数 2025.1.15

1.1版本，优化了代码逻辑 2025.1.15

1.0版本横空出世 2025.1.14