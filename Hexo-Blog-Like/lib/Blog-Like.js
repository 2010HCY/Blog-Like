const fs = require('fs');
const path = require('path');

// 处理Cloudflare后端地址，防止有憨批多打斜杠、https
function processCloudflareBackend(input) {
  if (!input) return '';
  input = input.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return input;
}

hexo.on('generateAfter', function() {
  const cfg = hexo.config['Blog-Like'] || {};
  if (!cfg.enable) {
    hexo.log.info('Blog-Likes插件已禁用');
    return;
  }

  // 校验配置项
  let backendType = cfg.Backend || 'Cloudflare';
  let backendAddr = cfg.CloudflareBackend ? processCloudflareBackend(cfg.CloudflareBackend) : '';

  if (backendType === "Cloudflare" && !backendAddr) {
    hexo.log.error('Error Blog-Likes插件 Cloudflare后端地址未配置！');
    process.exit(1);
  }
  if (backendType === "Leancloud" && (!cfg.AppID || !cfg.AppKEY)) {
    hexo.log.error('Error Blog-Likes插件 Leancloud密钥未配置！');
    process.exit(1);
  }

  let jsConfig = {
    enable: (cfg.enable !== false),
    Backend: backendType,
    CloudflareBackend: backendAddr,
    AppID: cfg.AppID || "",
    AppKEY: cfg.AppKEY || "",
    xianzhi: (typeof cfg.xianzhi === 'undefined' ? true : cfg.xianzhi),
    number: (typeof cfg.number === 'undefined' ? 5 : Number(cfg.number)),
    GoogleAnalytics: (typeof cfg.GoogleAnalytics === 'undefined' ? false : cfg.GoogleAnalytics),
    GAEventCategory: cfg.GAEventCategory || "Engagement",
    GAEventAction: cfg.GAEventAction || "Like"
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
  const mainJS = `
(function(){
  // 通用弹窗和工具
  function showAlert(msg) {
    var alertBox = document.createElement("div");
    alertBox.innerText = msg;
    alertBox.style.position = "fixed";
    alertBox.style.top = "20%";
    alertBox.style.left = "50%";
    alertBox.style.transform = "translate(-50%, -50%)";
    alertBox.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    alertBox.style.color = "white";
    alertBox.style.padding = "15px 30px";
    alertBox.style.borderRadius = "8px";
    alertBox.style.zIndex = "1000";
    alertBox.style.fontSize = "16px";
    alertBox.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.2)";
    document.body.appendChild(alertBox);
    setTimeout(function () {
      document.body.removeChild(alertBox);
    }, 1800);
  }
  function heartAnimation() {
    var heart = document.querySelector('.heart');
    if (!heart) return;
    heart.classList.remove('heartAnimation');
    void heart.offsetWidth;
    heart.classList.add('heartAnimation');
    setTimeout(function(){
      heart.classList.remove('heartAnimation');
    },800);
  }
  function getVisitorLikes(url) {
    var likes = getCookie("likes_" + url); 
    return likes ? parseInt(likes) : 0;
  }
  function setVisitorLikes(url, likes) {
    setCookie("likes_" + url, likes, 30); 
  }
  function getCookie(name) {
    var cookieArr = document.cookie.split(";");
    for (var i = 0; i < cookieArr.length; i++) {
      var cookie = cookieArr[i].trim();
      if (cookie.startsWith(name + "=")) {
        return cookie.substring(name.length + 1);
      }
    }
    return null;
  }
  function setCookie(name, value, days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    var expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }
  function updateZanText(num) {
    var el = document.getElementById("zan_text");
    if (el) el.innerHTML = num;
  }
  function sendGAEvent() {
    if (BLOG_LIKE_CONFIG.GoogleAnalytics && typeof window.gtag === 'function') {
      gtag('event', BLOG_LIKE_CONFIG.GAEventAction || 'Like', {
        'event_category': BLOG_LIKE_CONFIG.GAEventCategory || 'Engagement',
        'event_label': window.url // 使用当前页面URL作为事件标签
      });
    }
  }    

  // Cloudflare存储
  function mainCloudflare() {
    var BLOG_LIKE_CONFIG = ${configStr};
    var url = location.host + location.pathname;
    var flag = 0;
    window.flag = 0;
    window.url = location.host + location.pathname;

    function cloudflareLike(flag) {
      if (!BLOG_LIKE_CONFIG.CloudflareBackend) {
        showAlert("Cloudflare Workers 后端未配置");
        console.error('Cloudflare后端地址未配置！');
        return;
      }
      var urlParam = encodeURIComponent(url);
      var backend = BLOG_LIKE_CONFIG.CloudflareBackend.replace(/^https?:\\/\\//, '').replace(/\\/$/, '');
      var apiUrl = 'https://' + backend + '/likes/page?url=' + urlParam;
      if (flag) apiUrl += "&likes=1";
      fetch(apiUrl)
        .then(function(resp){
          if (resp.status === 429) {
            showAlert("您已达到速率限制");
            throw new Error("429");
          }
          return resp.json();
        })
        .then(d => {
          if (typeof d['likes'] !== "undefined") {
            updateZanText(d['likes']);
            if(flag) {
              var currentLikes = getVisitorLikes(url);
              setVisitorLikes(url, currentLikes + 1);
              showAlert("点赞成功");
            }
          } else {
            showAlert("获取点赞数失败");
          }
        })
        .catch(e => {
          if(e && e.message === "429") return;
          showAlert("后端请求失败, 请检查Cloudflare配置");
        });
    }
    function likeBackend(flag) {
      cloudflareLike(flag);
    }
    window.goodplus = function(u, f) {
      if(BLOG_LIKE_CONFIG.xianzhi) {
        var currentLikes = getVisitorLikes(url);
        if (currentLikes >= BLOG_LIKE_CONFIG.number) {
          showAlert("最多只能点 " + BLOG_LIKE_CONFIG.number + " 个赞");
          return;
        }
      }
      sendGAEvent();  
      likeBackend(true);
      heartAnimation();
    };
    document.addEventListener('DOMContentLoaded', function() {
      likeBackend(false);
    });
  }

  // Leancloud存储
  function mainLeancloud() {
    var BLOG_LIKE_CONFIG = ${configStr};
    var url = location.host + location.pathname;
    var flag = 0;
    window.flag = 0;
    window.url = location.host + location.pathname;

    function initLeanCloud() {
      if(!BLOG_LIKE_CONFIG.AppID || !BLOG_LIKE_CONFIG.AppKEY) {
        showAlert("LeanCloud 配置不完整");
        console.error('Leancloud密钥未配置！');
        return false;
      }
      try {
        AV.init({
          appId: BLOG_LIKE_CONFIG.AppID,
          appKey: BLOG_LIKE_CONFIG.AppKEY,
        });
      } catch(e) { showAlert("LeanCloud 初始化失败"); return false; }
      return true;
    }
    function leanCloudLike(flag) {
      if (!initLeanCloud()) return;
      var Zan = AV.Object.extend('Zan');
      var query = new AV.Query('Zan');
      query.equalTo("url", url);
      query.find().then(function (results) {
        if (results.length === 0) {
          var zan = new Zan();
          zan.set('url', url);
          zan.set('views', flag ? 1 : 0);
          zan.save().then(function () {
            updateZanText(flag?1:0);
            if(flag) {
              var currentLikes = getVisitorLikes(url);
              setVisitorLikes(url, currentLikes + 1);
              showAlert("点赞成功");
            }
          });
        } else {
          var zan = results[0];
          var vViews = zan.get('views');
          if (flag) {
            zan.set('views', vViews + 1);
            zan.save().then(function () {
              updateZanText(vViews + 1);
              var currentLikes = getVisitorLikes(url);
              setVisitorLikes(url, currentLikes + 1);
              showAlert("点赞成功");
            });
          } else {
            updateZanText(vViews);
          }
        }
      }).catch(function (error) {
        showAlert("LeanCloud 失败: " + (error.message?error.message:error));
        console.error("查询或保存出错：", error);
      });
    }
    function likeBackend(flag) {
      leanCloudLike(flag);
    }
    window.goodplus = function(u, f) {
      if(BLOG_LIKE_CONFIG.xianzhi) {
        var currentLikes = getVisitorLikes(url);
        if (currentLikes >= BLOG_LIKE_CONFIG.number) {
          showAlert("最多只能点 " + BLOG_LIKE_CONFIG.number + " 个赞");
          return;
        }
      }
      sendGAEvent();   
      likeBackend(true);
      heartAnimation();
    };
    document.addEventListener('DOMContentLoaded', function() {
      likeBackend(false);
    });
  }

  // 主入口判定
  var BLOG_LIKE_CONFIG = ${configStr};
  if (BLOG_LIKE_CONFIG.Backend === "Leancloud") {
    var s = document.createElement('script');
    s.src = "/Blog-Like/av-min.js";
    s.onload = mainLeancloud;
    s.onerror = function() {
      showAlert("LeanCloud SDK 文件加载失败，请检查 av-min.js 是否存在且未损坏！");
      console.error("LeanCloud SDK 加载失败: /Blog-Like/av-min.js");
    };
    document.head.appendChild(s);
  } else {
    mainCloudflare();
  }
})();
`;

  fs.writeFileSync(path.join(publicBlogLikePath, 'Blog-Like.js'), mainJS, 'utf-8');
  hexo.log.info('Blog-Likes OK!');
});

hexo.extend.injector.register('head_end', function() {
  return `<link rel="stylesheet" href="/Blog-Like/style.css">\n<script src="/Blog-Like/Blog-Like.js"></script>`;
}, 'default');