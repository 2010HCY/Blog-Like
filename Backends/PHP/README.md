# PHP

部署PHP后端需要有自己的服务器或网站托管服务，服务器上应安装PHP环境（我的版本是8.4.13），Mysql数据库。

该PHP文件包括访问量统计和点赞后端功能，如果不需要的话可以自行删掉`handle_visitor`函数。

## 1.Mysql数据库

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

各个表功能说明：

1. Likes表是记录页面点赞数据的
2. Post表是记录页面访问量统计数据的
3. Site表是站点级总访问量、点赞量数据，按域名区分

如果没打算部署访问量统计的话无需创建Post表

## PHP后端部署

下载[index.php](./index.php)，用文本编辑器打开，修改配置项、CORS跨域、默认跨域。

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

/* ======================== 路由配置 ======================== */
$ROUTE_MAP = [
    '/visitor-count' => 'handle_visitor', // 在此配置访问量统计后端
    '/like'    => 'handle_like',          // 在此配置点赞后端
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

填写好后部署网站，记下PHP网站运行地址，如果没有修改的话，`/like`是点赞后端路由地址`/visitor-count`是访问量统计地址。

一切完毕后就可以前往[前端部署](../../README.md#前端部署)进行下一步