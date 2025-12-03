<?php
/**
 *  PHP API
 */

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

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, X-Target, Authorization, Accept");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

/* ======================== 公共函数区 ======================== */

// 获取真实 IP
function get_real_ip() {
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) return $_SERVER['HTTP_CF_CONNECTING_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

// 取得 header
function getHeader($Key) {
    foreach (getallheaders() as $k => $v) {
        if (strcasecmp($k, $Key) === 0) return $v;
    }
    return null;
}

// 查询一行
function getRow($Db, $Table, $Key, $Val, $forupdate=false) {
    $sql = "SELECT * FROM $Table WHERE $Key = ?";
    if ($forupdate) $sql .= " FOR UPDATE";
    $stmt = $Db->prepare($sql);
    $stmt->execute([$Val]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/* ======================== 数据库连接 ======================== */

try {
    $Db = new PDO(
        'mysql:host='.DB_HOST.';dbname='.DB_NAME,
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error'=>'数据库连接失败']);
    exit();
}

/* ======================== 路由 ======================== */

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (preg_match('#^/visitor-count/?#', $path)) handle_visitor($Db);
elseif (preg_match('#^/like/?#', $path))       handle_like($Db);
else {
    http_response_code(404);
    echo json_encode(['error'=>'Not Found', 'debug'=>$path]);
    exit();
}

/* ======================== 模块：访问统计 ======================== */

function handle_visitor($Db){
    $raw = file_get_contents('php://input');
    $Body = $raw ? json_decode($raw, true) : [];
    $Target = $Body['Target'] ?? ($_GET['target'] ?? getHeader('X-Target'));
    $isNew = !empty($Body['NewVisitor']);

    if (!$Target) {
        http_response_code(400);
        echo json_encode(['error'=>'缺少Target参数']);
        exit();
    }

    $Domain = parse_url('http://' . $Target, PHP_URL_HOST);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        try {
            $Db->beginTransaction();

            $Db->prepare("INSERT INTO Post (Url, VisitCount, VisitorCount)
                VALUES (?, 1, ?)
                ON DUPLICATE KEY UPDATE VisitCount=VisitCount+1, VisitorCount=VisitorCount+VALUES(VisitorCount)")
                ->execute([$Target, $isNew?1:0]);

            $Db->prepare("INSERT INTO Site (Domain, VisitCount, VisitorCount)
                VALUES (?, 1, ?)
                ON DUPLICATE KEY UPDATE VisitCount=VisitCount+1, VisitorCount=VisitorCount+VALUES(VisitorCount)")
                ->execute([$Domain, $isNew?1:0]);

            $Db->commit();

            echo json_encode(['success'=>true]);
        } catch(Exception $e){
            $Db->rollBack();
            http_response_code(500);
            echo json_encode(['error'=>'DB更新失败']);
        }
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $Page = getRow($Db,'Post','Url',$Target);
        $Site = getRow($Db,'Site','Domain',$Domain);

        echo json_encode([
            'Page'=>$Page ?: ['VisitCount'=>0,'VisitorCount'=>0],
            'Site'=>$Site ?: ['VisitCount'=>0,'VisitorCount'=>0],
        ]);
        exit();
    }

    http_response_code(405);
    echo json_encode(['error'=>'Unsupported Method']);
    exit();
}

/* ======================== 模块：点赞 ======================== */

function handle_like($Db){
    $raw = file_get_contents('php://input');
    $Data = ($raw && $_SERVER['REQUEST_METHOD']==='POST') ? json_decode($raw, true) : [];

    $Url = trim($Data['Url'] ?? ($_GET['url'] ?? ''));
    $Add = intval($Data['Add'] ?? ($_GET['add'] ?? 0));

    if (!$Url) {
        http_response_code(400);
        echo json_encode(['error'=>'参数Url缺失']);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $row = getRow($Db, 'Likes', 'Url', $Url);
        $likes = $row ? intval($row['Likes']) : 0;

        if (!$row) {
            $Db->prepare("INSERT INTO Likes (Url, Likes) VALUES (?, 0)")
                ->execute([$Url]);
        }

        echo json_encode(['likes'=>$likes]);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $Db->beginTransaction();

        $row = getRow($Db, 'Likes', 'Url', $Url, true);
        $likes = $row ? intval($row['Likes']) : 0;

        if ($Add > 0) $likes += $Add;

        if ($row)
            $Db->prepare("UPDATE Likes SET Likes=? WHERE Url=?")->execute([$likes,$Url]);
        else
            $Db->prepare("INSERT INTO Likes (Url, Likes) VALUES (?, ?)")->execute([$Url,$likes]);

        $Db->commit();

        echo json_encode(['likes'=>$likes]);
        exit();
    }

    http_response_code(405);
    echo json_encode(['error'=>'Unsupported Method']);
    exit();
}

?>
