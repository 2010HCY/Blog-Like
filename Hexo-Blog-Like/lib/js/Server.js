  function mainPHP() {
    window.flag = 0;
    window.url = location.host + location.pathname;
    var url = window.url;
    var flag = window.flag;
    var isRequesting = false;

    function getPHPApiUrl() {
      return BLOG_LIKE_CONFIG.CloudflareBackend;
    }

    function phpLike(delta, done) {
      var apiUrl = getPHPApiUrl();
      if (!apiUrl) {
        showAlert("PHP 后端未配置");
        console.error('PHP 后端地址未配置！');
        if (done) done();
        return;
      }

      var bodyData = {
        Url: url,
        Add: delta
      };

      var xhr = new XMLHttpRequest();
      xhr.open("POST", apiUrl, true);
      xhr.withCredentials = true;
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var response = JSON.parse(xhr.responseText);
              if (typeof response.likes !== "undefined") {
                updateZanText(response.likes);
                if (delta > 0) {
                  setVisitorLiked(url, true);
                  setHeartLiked(true);
                  heartAnimation();
                  showAlert("点赞成功");
                } else if (delta < 0) {
                  setVisitorLiked(url, false);
                  setHeartLiked(false);
                  showAlert("取消点赞");
                }
              } else {
                showAlert("后端请求失败,请稍后再试");
              }
            } catch (e) {
              showAlert("解析 JSON 失败");
              console.error("解析 PHP 后端返回失败：", e);
            }
          } else {
            showAlert("请求失败, 状态码: " + xhr.status);
          }
          if (done) done();
        }
      };
      xhr.send(JSON.stringify(bodyData));
    }

    function likeBackend(delta, done) {
      phpLike(delta, done);
    }

    window.goodplus = function(u, f) {
      if (isRequesting) return;
      var targetLiked = !getVisitorLiked(url);
      var delta = targetLiked ? 1 : -1;
      if (targetLiked) sendGAEvent();
      isRequesting = true;
      likeBackend(delta, function(){
        isRequesting = false;
      });
    };

    document.addEventListener('DOMContentLoaded', function() {
      setHeartLiked(getVisitorLiked(url));
      likeBackend(0);
    });
  }