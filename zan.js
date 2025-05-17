(function(){
  // === 配置项 BEGIN ===
  var BLOG_LIKE_CONFIG = {
    enable: true,
    Backend: "Cloudflare", // "Cloudflare" 或 "Leancloud"
    CloudflareBackend: "", // 你的后端地址
    AppID: "", // 你的ID
    AppKEY: "", // 你的KEY
    xianzhi: true, // 是否限制点赞数
    number: 5 // 限制几个赞
  };
  // === 配置项 END ===

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

  // Cloudflare存储
  function mainCloudflare() {
    window.flag = 0;
    window.url = location.host + location.pathname;
    var url = window.url;
    var flag = window.flag;

    function cloudflareLike(flag) {
      if (!BLOG_LIKE_CONFIG.CloudflareBackend) {
        showAlert("Cloudflare Workers 后端未配置");
        console.error('Cloudflare后端地址未配置！');
        return;
      }
      var urlParam = encodeURIComponent(url);
      var backend = BLOG_LIKE_CONFIG.CloudflareBackend.replace(/^https?:\/\/|\/$/g, '');
      var apiUrl = 'https://' + backend + '/likes/page?url=' + urlParam;
      if (flag) apiUrl += "&likes=1";
      fetch(apiUrl)
        .then(function(resp){
          if (resp.status === 429 && (response.statusText === "Too Many Requests" || response.statusText === "TOO MANY REQUESTS")) {
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
      likeBackend(true);
      heartAnimation();
    };
    document.addEventListener('DOMContentLoaded', function() {
      likeBackend(false);
    });
  }

  // Leancloud存储
  function mainLeancloud() {
    window.flag = 0;
    window.url = location.host + location.pathname;
    var url = window.url;
    var flag = window.flag;

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
      likeBackend(true);
      heartAnimation();
    };
    document.addEventListener('DOMContentLoaded', function() {
      likeBackend(false);
    });
  }

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