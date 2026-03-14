# OpenResty

这是基于Nginx的OpenResty使用的后端版本，注意host配置是否正确，OpenResty是否有文件读写权限，修改完配置文件后需重启OpenResty。

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

## 2.修改配置项

> like.lua是点赞后端，visitor.lua是访问量统计后端

分别打开like.lua、visitor.lua，修改配置部分，然后将其放置在OpenResty能够读取的地方，例如`/www/api/`。

```
-- ======================== 配置 ========================
local DB_CONFIG = {
    host     = "127.0.0.1", -- 数据库地址
    port     = 3306,        -- 数据库端口
    database = "ABC",       -- 数据库名称
    user     = "ABC",       -- 数据库用户名
    password = "ABCDEFG"    -- 数据库密码
}

local ALLOW_DOMAINS = { "example.com", "example.example.com" }  -- 允许的域名列表，逗号分隔
```

## 3.配置文件插入

打开站点配置文件，在server块里填写以下内容：

```
# 访问量、点赞API
location ^~ /api/visitor-count {
    content_by_lua_file /www/api/visitor.lua;
}
location ^~ /api/like {
    content_by_lua_file /www/api/like.lua;
}
```

完成后记得重启OpenResty。

一切完毕后就可以前往[前端部署](../../README.md#前端部署)进行下一步