# Blog-Like 博客点赞插件

## 特点介绍

此点赞功能适配Hexo博客，适合任何静态网站，只是步骤有所不同，以下是它的特点：

1. 免费，此点赞功能使用开发者的好伙伴**leancloud**存储点赞数据，免费版足够使用
2. 简洁，轻轻一点即可完成操作
3. 小巧，大小仅24.4kb（图像资源20kb）
4. 便捷，Hexo框架的博客仅需3步即可使用！

效果展示：

<img src="/images/效果展示.gif" style="zoom:80%;" />

不仅仅是Hexo，所以静态博客都可以用，只是其他博客需要自己下载代码植入博客，Hexo可以一键安装

你可以到我的博客体验一下点赞功能哦 [立即前往](https://100713.xyz/%E7%BD%91%E7%AB%99%E7%BB%B4%E6%8A%A4/Hexo%E5%8D%9A%E5%AE%A2%E5%8A%A0%E5%85%A5%E7%82%B9%E8%B5%9E%E5%8A%9F%E8%83%BD) 

## 部署教程

下面开始部署教程，你需要有一个[**leancloud**账号](https://www.leancloud.com/)，没有的话就注册一个，只需要邮箱即可注册，无需绑定信用卡之类的，注册即用（中国大陆版要备案，可以使用国际版，备案要支付宝刷脸）。

在开始之前，你需要获取AppID和AppKEY这两个凭证：

### 1.初始化leancloud应用并获取凭证

注册好[**leancloud**账号](https://www.leancloud.com/)后进入控制台，点击创建应用，计费计划选择开发版，应用名称、描述随便填，

<img src="/images/创建应用.png" style="zoom:80%;" />

创建好后进入应用设置→点击应用凭证，将**AppID**和**AppKey**复制下来待会要用

<img src="/images/获取应用凭证.png" style="zoom:80%;" />

然后打开数据存储→结构化数据，创建一个名为Zan的Class。

<img src="/images/创建Class.png" style="zoom:70%;" />

> leancloud有中国版和国际版，国际版无需备案，完成上述步骤即可使用，中国版需要多一个步骤绑定API域名，在设置→域名绑定里。（根据服务条款域名要备案）

### 2.安装配置插件

> 适用于Hexo框架，其他框架我没用过

在博客根目录粘贴以下命令一键安装

```
npm install hexo-blog-like --save
```

安装好后在博客根目录的`_config.yml`（**不是你主题的`_config.yml`！**）添加以下配置项：

```
Blog-Like:
  enable: true 
  AppID: "你的ID" 
  AppKEY: "你的KEY" 
  xianzhi: true 
  number: 5 
 #非必填serverURLs:
```

> 配置项说明：
> enable是否启用本插件
>
> `AppID`、`AppKEY`前面获取的`AppID`、`AppKEY`
>
> `xianzhi`是否限制访客点赞数
>
> 若`xianzhi`为true，则可以使用`number`限制单用户点赞数
>
> 若你使用的是中国版leancloud，你需要添加`serverURLs`配置项，值填写你前面绑定的API域名

完事后`hexo clean && hexo g && hexo s`启动博客，在你想要的显示位置（例如文章末尾）插入如下代码块，打开博客瞅瞅效果吧！

```
<div id="zan" class="clearfix">
    <div class="heart" onclick="goodplus(url, flag)"></div>
    <br>
    <div id="zan_text"></div>
</div>
```

<img src="/images/效果展示.png" style="zoom:80%;" />

如果你不想要手动一个个添加，你可以编辑主题的文章模板（通常位于主题/主题名/目录下的`layout/_partial/article.ejs`或`layout/post.ejs`文件）里添加此代码段。

> 我使用的主题是`matery`，该主题把代码段放置在`layout/_partial/reprint-statement.ejs`文件中最前面效果最好，其他主题视情况而定。
>
> <img src="/images/添加代码段.png" style="zoom:80%;" />

对你有帮助的话给我个Starred吧！

[![Star this project on GitHub](https://img.shields.io/github/stars/2010HCY/Blog-Like.svg?style=social)](https://github.com/2010HCY/Blog-Like)


## 未来打算

- [x] 此脚本目前没有限制点赞次数，同一个访客可以不停的搓点赞次数，搓个上万次不成问题，未来打算加入一个开关选择是否限制单访客点赞次数，若打开则通过Cookie记录限制只能点一次赞或几次。
- [x] 制作成Hexo插件，可以一键安装使用
- [ ] 制作多种样式以供选择
- [ ] 支持多种存储方式
- [x] 长期接收意见以及维护

## 版本更新记录

**v2.1.1 (2025.1.23)**

添加了中国版leancloud适配

**v2.1.0 (2025.1.16)**

修复了多个页面只能点五个赞，新版本把不同URL分开计算

**v2.0.0 (2025.1.15)**

发布npm包，可以在Hexo博客中一键安装咯！

**v1.1.0 (2025.1.15)**

增加了点赞次数限制，使用Cookie记录点赞次数，优化了代码逻辑

**v1.0.0 (2025.1.14)**

博客点赞插件横空出世 



