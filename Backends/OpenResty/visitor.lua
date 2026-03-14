-- ======================== 配置 ========================
local DB_CONFIG = {
    host     = "127.0.0.1", -- 数据库地址
    port     = 3306,        -- 数据库端口
    database = "ABC",       -- 数据库名称
    user     = "ABC",       -- 数据库用户名
    password = "ABCDEFG"    -- 数据库密码
}

local ALLOW_DOMAINS = { "example.com", "example.example.com" }  -- 允许的域名列表，逗号分隔

-- ======================== 依赖与工具 ========================
local mysql = require "resty.mysql"
local cjson = require "cjson"

local function get_origin() return ngx.var.http_origin or "" end

local function is_allowed(origin)
    if origin == "" then return false end
    -- 匹配 localhost / 127.0.0.1
    if ngx.re.find(origin, [[^https?://(localhost|127\.0\.0\.1)(:\d+)?$]], "jo") then return true end
    -- 匹配 允许的域名
    for _, dom in ipairs(ALLOW_DOMAINS) do
        local pattern = "^https://([a-z0-9-]+\\.)?" .. dom:gsub("%.", "%%.") .. "$"
        if ngx.re.find(origin, pattern, "jo") then return true end
    end
    return false
end

-- ======================== CORS 处理 ========================
local origin = get_origin()
local allowed = is_allowed(origin)
ngx.header["Access-Control-Allow-Origin"] = allowed and origin or "https://hcyhub.com"
ngx.header["Access-Control-Allow-Credentials"] = "true"
ngx.header["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
ngx.header["Access-Control-Allow-Headers"] = "Content-Type, X-Requested-With, X-Target, Authorization, Accept"

if ngx.req.get_method() == "OPTIONS" then
    ngx.exit(204)
end

-- ======================== 逻辑处理 ========================
local db, err = mysql:new()
db:set_timeout(1000)
local ok, err, errcode, sqlstate = db:connect(DB_CONFIG)

if not ok then
    ngx.status = 500
    ngx.say(cjson.encode({error = "数据库连接失败"}))
    return
end

-- 解析输入
ngx.req.read_body()
local body = cjson.decode(ngx.req.get_body_data() or "{}")
local target = body.Target or ngx.var.arg_target or ngx.var.http_x_target or ""
local is_new = body.NewVisitor and 1 or 0

if target == "" then
    ngx.status = 400
    ngx.say(cjson.encode({error = "缺少Target参数"}))
    return
end

local target_cn = ngx.unescape_uri(target)
local domain = ngx.re.match(target_cn, [[(?:https?://)?([^/]+)]], "jo")[1] or ""

if ngx.req.get_method() == "POST" then
    db:query("START TRANSACTION")
    -- 更新 Post 表
    local q1 = string.format("INSERT INTO Post (Url, VisitCount, VisitorCount) VALUES (%s, 1, %d) ON DUPLICATE KEY UPDATE VisitCount=VisitCount+1, VisitorCount=VisitorCount+VALUES(VisitorCount)", ngx.quote_sql_str(target_cn), is_new)
    -- 更新 Site 表
    local q2 = string.format("INSERT INTO Site (Domain, VisitCount, VisitorCount) VALUES (%s, 1, %d) ON DUPLICATE KEY UPDATE VisitCount=VisitCount+1, VisitorCount=VisitorCount+VALUES(VisitorCount)", ngx.quote_sql_str(domain), is_new)
    
    local res1 = db:query(q1)
    local res2 = db:query(q2)
    
    if res1 and res2 then
        db:query("COMMIT")
        ngx.say(cjson.encode({success = true}))
    else
        db:query("ROLLBACK")
        ngx.status = 500
        ngx.say(cjson.encode({error = "DB更新失败"}))
    end
elseif ngx.req.get_method() == "GET" then
    local res_p = db:query(string.format("SELECT * FROM Post WHERE Url = %s", ngx.quote_sql_str(target_cn)))
    local res_s = db:query(string.format("SELECT * FROM Site WHERE Domain = %s", ngx.quote_sql_str(domain)))
    
    local page = (res_p and res_p[1]) or {VisitCount = 0, VisitorCount = 0}
    local site = (res_s and res_s[1]) or {VisitCount = 0, VisitorCount = 0}
    
    if page.Url then page.Url = ngx.escape_uri(page.Url) end
    
    ngx.say(cjson.encode({Page = page, Site = site}))
end

db:set_keepalive(10000, 100) -- 连接池