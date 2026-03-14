  function mainLeancloud() {
    window.flag = 0;
    window.url = location.host + location.pathname;
    var url = window.url;
    var flag = window.flag;
    var isRequesting = false;

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
    function leanCloudLike(delta, done) {
      if (!initLeanCloud()) { if (done) done(); return; }
      var Zan = AV.Object.extend('Zan');
      var query = new AV.Query('Zan');
      query.equalTo("url", url);
      query.find().then(function (results) {
        if (results.length === 0) {
          var zan = new Zan();
          var nextViews = delta > 0 ? 1 : 0;
          zan.set('url', url);
          zan.set('views', nextViews);
          zan.save().then(function () {
            updateZanText(nextViews);
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
            if (done) done();
          });
        } else {
          var zan = results[0];
          var vViews = zan.get('views') || 0;
          if (delta > 0) {
            var inc = vViews + 1;
            zan.set('views', inc);
            zan.save().then(function () {
              updateZanText(inc);
              setVisitorLiked(url, true);
              setHeartLiked(true);
              heartAnimation();
              showAlert("点赞成功");
              if (done) done();
            });
          } else if (delta < 0) {
            var dec = Math.max(0, vViews - 1);
            zan.set('views', dec);
            zan.save().then(function () {
              updateZanText(dec);
              setVisitorLiked(url, false);
              setHeartLiked(false);
              showAlert("取消点赞");
              if (done) done();
            });
          } else {
            updateZanText(vViews);
            if (done) done();
          }
        }
      }).catch(function (error) {
        showAlert("LeanCloud 失败: " + (error.message?error.message:error));
        console.error("查询或保存出错：", error);
        if (done) done();
      });
    }
    function likeBackend(delta, done) {
      leanCloudLike(delta, done);
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