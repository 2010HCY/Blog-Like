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

你可以到我的博客体验一下点赞功能哦 [立即前往](https://hcyhub.com/%E7%BD%91%E7%AB%99%E7%BB%B4%E6%8A%A4/Hexo%E5%8D%9A%E5%AE%A2%E5%8A%A0%E5%85%A5%E7%82%B9%E8%B5%9E%E5%8A%9F%E8%83%BD) 

## 部署教程

### 使用Cloudflare做后端（推荐，可白嫖）

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/2010HCY/Blog-Likes-Backend)

点击上方按钮一键部署后端，然后绑定自定义域（自带的workers.dev在中国大陆访问不稳定）

记好你的Workers地址，然后

### 安装配置插件

> 适用于Hexo框架，其他框架我没用过

在博客根目录粘贴以下命令一键安装

```
npm install hexo-blog-like --save
```

安装好后在博客根目录的`_config.yml`（**不是你主题的`_config.yml`！**）添加以下配置项并填写：

```yml
Blog-Like:
  enable: true #是否启用插件
  Backend: Cloudflare # 或者 Cloudflare | Leancloud | PHP，默认Cloudflare
  CloudflareBackend: #你的后端地址
  PHPBackend: #自部署PHP后端地址
  AppID: #如果你使用Leancloud，记得填你的Leancloud ID和KEY，获取方法在后面
  AppKEY: #你的KEY
  xianzhi: true #是否限制点赞数，默认开启
  number: 5 #如果限制点赞数，限制的点赞数，默认为5个赞
  GoogleAnalytics: true #是否向谷歌分析发送点赞事件，默认关闭
  GAEventCategory: Engagement #点赞事件类别，默认Engagement
  GAEventAction: Like #事件名称，默认Like
```

完事后`hexo clean && hexo g && hexo s`启动博客，在你想要的显示位置（例如文章末尾）插入如下代码块，打开博客瞅瞅效果吧！

```html
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

### 使用PHP做后端（推荐，自由度高）

部署PHP后端需要有自己的服务器，服务器上应安装PHP环境（我的版本是8.4.13），Mysql数据库。

#### Mysql数据库

首先创建一个数据库，记好以下信息：

> 主机地址通常是 localhost，看你的数据库部署方式，自己找数据库连接地址。

1. 数据库主机地址
2. 数据库名称
3. 数据库用户名
4. 数据库密码

初始化数据库：

1. 创建 Post 表

```
CREATE TABLE `Post` (
  `Url` varchar(512) NOT NULL COMMENT 'URL',
  `VisitCount` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'PV',
  `VisitorCount` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'UV',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Url`),
  UNIQUE KEY `url_unique` (`Url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页面访问数据';
```

2. 创建 Site 表

```
CREATE TABLE `Site` (
  `Domain` varchar(255) NOT NULL COMMENT 'Domain',
  `VisitCount` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'PV',
  `VisitorCount` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'UV',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Domain`),
  UNIQUE KEY `domain_unique` (`Domain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站点访问数据';
```

3. 创建 Likes 表

```
CREATE TABLE `Likes` (
  `Url` varchar(512) NOT NULL COMMENT 'URL',
  `Likes` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '点赞数',
  `CreatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Url`),
  UNIQUE KEY `url_unique` (`Url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点赞数据';
```

Post表是记录文章访问量统计数据的，Site表是记录站点访问量统计数据的（此PHP后端是二合一的，包含访问量统计+点赞后端两个功能，若不需要访问量统计Post、Site表可以不创建）

#### PHP后端部署

下载[index.php](/index.php)，用文本编辑器打开，修改配置项、CORS跨域、默认跨域。

> 此PHP还有访问量统计后端功能，点赞后端只是一部分

```
/* ======================== 配置 ======================== */

define('DB_HOST', 'HOST');       // 数据库主机地址
define('DB_NAME', 'DbName');     // 数据库名称
define('DB_USER', 'DbUser');     // 数据库用户名
define('DB_PASS', 'Password');   // 数据库密码

// 允许的域名
$ALLOW_DOMAINS = [
    'example.com', // 可添加多个，用逗号分隔
    'example.example.com',
];

/* ======================== CORS 处理 ======================== */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allow = false;

foreach ($ALLOW_DOMAINS as $dom) {
    if (preg_match("~^https://([a-z0-9-]+\.)?$dom$~i", $origin)) {
        $allow = true;
        break;
    }
}

if ($allow) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: https://example.com"); // 默认允许的域名，自己修改
}
```

填写好后部署网站，记下PHP网站运行地址，`/like`是点赞后端路由地址`/visitor-count`是访问量统计地址。

然后：[安装配置插件](#安装配置插件)

### 使用Leancloud做后端（不推荐，中国大陆要备案）

下面开始部署教程，你需要有一个[**leancloud**账号](https://www.leancloud.com/)，没有的话就注册一个，只需要邮箱即可注册，无需绑定信用卡之类的，注册即用（中国大陆版要备案，可以使用国际版，备案要支付宝刷脸）。

在开始之前，你需要获取AppID和AppKEY这两个凭证：

#### 1.初始化leancloud应用并获取凭证

注册好[**leancloud**账号](https://www.leancloud.com/)后进入控制台，点击创建应用，计费计划选择开发版，应用名称、描述随便填，

<img src="/images/创建应用.png" style="zoom:80%;" />

创建好后进入应用设置→点击应用凭证，将**AppID**和**AppKey**复制下来待会要用

<img src="/images/获取应用凭证.png" style="zoom:80%;" />

然后打开数据存储→结构化数据，创建一个名为Zan的Class。

<img src="/images/创建Class.png" style="zoom:70%;" />

> leancloud有**中国版和国际版**，国际版**无需备案**，完成上述步骤即可使用，中国版需要**多一个步骤****绑定API域名**，在设置→域名绑定里。（根据服务条款域名好像要备案）

获取好凭证后按照安装配置插件的步骤安装即可

## 未来打算

- [x] 此脚本目前没有限制点赞次数，同一个访客可以不停的搓点赞次数，搓个上万次不成问题，未来打算加入一个开关选择是否限制单访客点赞次数，若打开则通过Cookie记录限制只能点一次赞或几次。
- [x] 制作成Hexo插件，可以一键安装使用
- [ ] 制作多种样式以供选择
- [x] 支持多种存储方式
- [x] 长期接收意见以及维护

## 版本更新记录
**v3.0.0 (2025.12.03)**

不再使用URL传参，改为Post JSON，避免爬虫扫接口，添加新的存储PHP
**注意，v2.* 升级到v3.* 需要更新后端！**

**v2.2.2 (2025.5.28)**

添加了谷歌分析发送事件功能，能够在谷歌分析里查看统计数据

**v2.2.1 (2025.5.17)**

添加了速率限制提示，现在你们可以用Cloudflare速率限制规则了

**v2.2.0 (2025.4.20)**

增加了Cloudflare存储点赞数据方式

**v2.1.2 (2025.2.06)**

修复了运行报错。

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



