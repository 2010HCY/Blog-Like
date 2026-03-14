const fs = require('fs');
const path = require('path');

// 处理后端地址
function processBackendUrl(input) {
  if (!input) return '';
  return input.replace(/\/$/, '');
}

hexo.on('generateAfter', function() {
  const cfg = hexo.config['Blog-Like'] || {};
  if (!cfg.enable) {
    hexo.log.info('Blog-Likes插件已禁用');
    return;
  }

  // 校验配置项
  let backendType = cfg.Backend || 'Cloudflare';
  let backendAddr = cfg.CloudflareBackend ? processBackendUrl(cfg.CloudflareBackend) : '';
  let phpBackend = cfg.PHPBackend ? processBackendUrl(cfg.PHPBackend) : '';

  if (backendType === "Cloudflare" && !backendAddr) {
    hexo.log.error('Error Blog-Likes插件 Cloudflare后端地址未配置！');
    process.exit(1);
  }
  if (backendType === "Leancloud" && (!cfg.AppID || !cfg.AppKEY)) {
    hexo.log.error('Error Blog-Likes插件 Leancloud密钥未配置！');
    process.exit(1);
  }
  if (backendType === "PHP" && !phpBackend) {
    hexo.log.error('Error Blog-Likes插件 PHP后端地址未配置！');
    process.exit(1);
  }

  let jsConfig = {
    enable: (cfg.enable !== false),
    Backend: backendType,
    CloudflareBackend: backendAddr,
    PHPBackend: phpBackend,
    AppID: cfg.AppID || "",
    AppKEY: cfg.AppKEY || "",
    GoogleAnalytics: (typeof cfg.GoogleAnalytics === 'undefined' ? false : cfg.GoogleAnalytics),
    GAEventCategory: cfg.GAEventCategory || "Engagement",
    GAEventAction: cfg.GAEventAction || "Like",
    AutoInjectLike: (typeof cfg.AutoInjectLike === 'undefined' ? false : cfg.AutoInjectLike)
  };

  // 复制静态资源
  const publicBlogLikePath = path.join(hexo.public_dir, 'Blog-Like');
  if (!fs.existsSync(publicBlogLikePath)) fs.mkdirSync(publicBlogLikePath, { recursive: true });
  const assetBase = path.join(__dirname, '..', 'assets');
  fs.copyFileSync(path.join(assetBase, 'style.css'), path.join(publicBlogLikePath, 'style.css'));
  fs.copyFileSync(path.join(assetBase, 'zan.png'),   path.join(publicBlogLikePath, 'zan.png'));
  // 若设置LeanCloud为后端则复制SDK
  if (backendType === "Leancloud") {
    fs.copyFileSync(path.join(assetBase, 'av-min.js'), path.join(publicBlogLikePath, 'av-min.js'));
  }

  const configStr = JSON.stringify(jsConfig, null, 2);
  const jsLibPath = path.join(__dirname, 'js');
  const commonUtils = fs.readFileSync(path.join(jsLibPath, 'Common.js'), 'utf-8');         // 通用弹窗和工具
  const cloudflareMain = fs.readFileSync(path.join(jsLibPath, 'Cloudflare.js'), 'utf-8');  // Cloudflare 后端主逻辑
  const leancloudMain = fs.readFileSync(path.join(jsLibPath, 'Leancloud.js'), 'utf-8');    // Leancloud 后端主逻辑
  const phpMain = fs.readFileSync(path.join(jsLibPath, 'Server.js'), 'utf-8');                // PHP 后端主逻辑

  // 拼接选择的后端代码
  let mainJS = '(function(){\n  var BLOG_LIKE_CONFIG = ' + configStr + ';\n' + commonUtils + '\n';

  if (backendType === 'Cloudflare') {
    mainJS += cloudflareMain + '\n  mainCloudflare();\n';
  } else if (backendType === 'Leancloud') {
    // Leancloud 先加载 SDK
    mainJS += leancloudMain + `
  var s = document.createElement('script');
  s.src = "/Blog-Like/av-min.js";
  s.onload = mainLeancloud;
  s.onerror = function() {
    showAlert("LeanCloud SDK 文件加载失败，请检查 av-min.js 是否存在且未损坏！");
    console.error("LeanCloud SDK 加载失败: /Blog-Like/av-min.js");
  };
  document.head.appendChild(s);
`;
  } else if (backendType === 'PHP') {
    mainJS += phpMain + '\n  mainPHP();\n';
  } else {
    mainJS += cloudflareMain + '\n  mainCloudflare();\n';
  }

  mainJS += '})();\n';

  fs.writeFileSync(path.join(publicBlogLikePath, 'Blog-Like.js'), mainJS, 'utf-8');
  hexo.log.info('Blog-Likes OK!');
});

hexo.extend.injector.register('head_end', function() {
  return `<link rel="stylesheet" href="/Blog-Like/style.css">\n<script src="/Blog-Like/Blog-Like.js"></script>`;
}, 'default');

// 自动注入点赞组件到文章末尾
hexo.extend.filter.register('after_post_render', function(data) {
  const cfg = hexo.config['Blog-Like'] || {};
  if (!cfg.enable || !cfg.AutoInjectLike) {
    return;
  }
  if (data.__post === false) {
    return;
  }
  const likeHTML = `<div id="zan" class="clearfix">
        <div class="heart" onclick="goodplus(url, flag)"></div>
        <br>
        <div id="zan_text"></div>
    </div>`;
  data.content += '\n' + likeHTML;
});