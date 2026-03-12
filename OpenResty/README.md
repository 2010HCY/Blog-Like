# OpenResty

这是基于Nginx的OpenResty使用的后端版本，注意host配置是否正确，OpenResty是否有文件读写权限，修改完配置文件后需重启OpenResty。

## 1.修改配置项

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

## 2.配置文件插入

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