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
    if ngx.re.find(origin, [[^https?://(localhost|127\.0\.0\.1)(:\d+)?$]], "jo") then return true end
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

if ngx.req.get_method() == "OPTIONS" then ngx.exit(204) end

-- ======================== 逻辑处理 ========================
local db, _ = mysql:new()
db:connect(DB_CONFIG)

ngx.req.read_body()
local body = cjson.decode(ngx.req.get_body_data() or "{}")
local url = body.Url or ngx.var.arg_url or ""
local add_val = tonumber(body.Add or ngx.var.arg_add or 0)

if url == "" then
    ngx.status = 400
    ngx.say(cjson.encode({error = "参数Url缺失"}))
    return
end

local url_cn = ngx.unescape_uri(url)
local domain = ngx.re.match(url_cn, [[(?:https?://)?([^/]+)]], "jo")[1] or ""

if ngx.req.get_method() == "GET" then
    local res = db:query(string.format("SELECT * FROM Likes WHERE Url = %s", ngx.quote_sql_str(url_cn)))
    local res_s = db:query(string.format("SELECT * FROM Site WHERE Domain = %s", ngx.quote_sql_str(domain)))
    
    local page_likes = (res and res[1]) and tonumber(res[1].Likes) or 0
    local site_likes = (res_s and res_s[1]) and tonumber(res_s[1].Likes) or 0

    -- 如果记录不存在则初始化 (复刻PHP逻辑)
    if not res or #res == 0 then
        db:query(string.format("INSERT INTO Likes (Url, Likes) VALUES (%s, 0)", ngx.quote_sql_str(url_cn)))
    end

    ngx.say(cjson.encode({
        Url = ngx.escape_uri(url_cn),
        PageLikes = page_likes,
        SiteLikes = site_likes
    }))

elseif ngx.req.get_method() == "POST" then
    db:query("START TRANSACTION")
    
    -- 获取并锁定行
    local row = db:query(string.format("SELECT Likes FROM Likes WHERE Url = %s FOR UPDATE", ngx.quote_sql_str(url_cn)))
    local current_likes = (row and row[1]) and tonumber(row[1].Likes) or 0
    
    if add_val > 0 then
        current_likes = current_likes + add_val
    elseif add_val < 0 then
        current_likes = math.max(0, current_likes + add_val)
    end

    if row and #row > 0 then
        db:query(string.format("UPDATE Likes SET Likes = %d WHERE Url = %s", current_likes, ngx.quote_sql_str(url_cn)))
    else
        db:query(string.format("INSERT INTO Likes (Url, Likes) VALUES (%s, %d)", ngx.quote_sql_str(url_cn), current_likes))
    end

    if add_val > 0 then
        db:query(string.format("INSERT INTO Site (Domain, VisitCount, VisitorCount, Likes) VALUES (%s, 0, 0, %d) ON DUPLICATE KEY UPDATE Likes=Likes+VALUES(Likes)", ngx.quote_sql_str(domain), add_val))
    elseif add_val < 0 then
        db:query(string.format("UPDATE Site SET Likes = GREATEST(Likes + %d, 0) WHERE Domain = %s", add_val, ngx.quote_sql_str(domain)))
    end

    db:query("COMMIT")
    ngx.say(cjson.encode({likes = current_likes}))
end

db:set_keepalive(10000, 100)
