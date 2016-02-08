angular.module('lower-up-get.controllers', [])

  .filter("sanitize", ['$sce', function($sce) {
    return function(htmlCode){
      return $sce.trustAsHtml(htmlCode);
    }
  }])
  .controller('WebCtrl', function(API, KEY_GOOGLE_PAGE_SPEED,  $scope, $http, $timeout) {
      var urlApi_GPageSpeed = 'https://www.googleapis.com/pagespeedonline/v2/runPagespeed?url=';
      var paramsApi_GPageSpeed = '&filter_third_party_resources=true&screenshot=false&strategy=mobile&fields=pageStats&key=' + KEY_GOOGLE_PAGE_SPEED;
      var apiBaseUrl = API + '/get/';

      var iframeDoc = window.frames.iframeSite.contentWindow.document;
      iframeDoc.write('<body></body>');
      window.frames.iframeSite.setAttribute('width', '100%');
      window.frames.iframeSite.setAttribute('height', (document.body.scrollHeight - document.getElementById('header').scrollHeight) + "px");


      $scope.renderFinish = false;
      $scope.url = 'https://duckduckgo.com';
      $scope.loading = '';
      $scope.error = '';
      $scope.stats = {
        appReq: {
          totalSize: 0,
          nbHost: 1,
          nbRequest: 1
        },
        compare: {
          totalSize: 0,
          nbHost: 1,
          nbRequest: 1
        }
      };

      function BytestoHumanValue(bytesVal) {
        var intVal = parseInt(bytesVal);
        if (intVal < 1000) {
          return intVal + 'o';
        }

        if (intVal < 1000000) {
          return parseInt(intVal / 1000) + 'Ko';
        }
        else {
          return (parseInt(intVal / 1000) / 1000).toFixed(1) + 'Mo';
        }
      }

      function sumBytes(arrayBytes) {
        var intSum = 0;

        var i;

        for (i = 0; i < arrayBytes.length; i++) {
          var testInt = parseInt(arrayBytes[i]);
          if (!isNaN(testInt)) {
            intSum += testInt;
          }
        }

        return intSum;
      }

      function encodeUrl(url) {

        var urlParsed = new URL(url);// eslint-disable-line no-undef
        var address = encodeURIComponent(urlParsed.protocol + '//' + urlParsed.hostname);
        var path = '';

        if (urlParsed.pathname && urlParsed.pathname.length > 1) {

          path = '/' + encodeURIComponent(urlParsed.pathname);

        }

        var search = urlParsed.search;
        var apiCall = apiBaseUrl + address + path + search;

        return apiCall;

      }

      function onclick(e) {
        e.preventDefault();
        var urlFrag = this.href.split('/');
        var urlDecode = decodeUrl(urlFrag);
        $scope.url = urlDecode.address + urlDecode.path + urlDecode.params;
        getUrl();
      }

      function onsubmit(e) {

        e.preventDefault();

        var params = '';
        for (var i = 0; i < e.currentTarget.length; i++) {

          var input = e.currentTarget[i];
          if (input.name && input.value) {

            if(input.type !== 'submit' || input.name === this.submitName){


              if (i === 0) {
                params += '?';
              }

              if (i !== 0) {
                params += '&';
              }
              params += input.name + '=' + input.value.replace(' ', '+');

            }

          }

        }

        var urlFrag = (this.action + params).split('/');
        var urlDecode = decodeUrl(urlFrag);
        $scope.url = urlDecode.address + urlDecode.path + urlDecode.params;
        getUrl();
      }

      /**
       * Return clean parts url
       * @param {Array} urlFrag - splice / array of url
       * @return {Object} decode address, path, params
       */
      function decodeUrl(urlFrag) {

        var address = decodeURIComponent(urlFrag[4]);

        var path = '';
        var params = '';

        if (urlFrag[5] && urlFrag[5].length > 1) {

          if (urlFrag[5].indexOf('?') === 0) {

            params = urlFrag[6];

          } else {

            var pathAndParams = urlFrag[5].split('?');

            path = decodeURIComponent(pathAndParams[0]);

            if (pathAndParams[1] && pathAndParams[1].length > 1) {

              params = '?' + pathAndParams[1].replace(' ', '+');

            }

          }

        }

        return { 'address': address, 'path': path, 'params': params };

      }

      function getUrl() {

        $scope.renderFinish = false;
        $scope.loading = 'Rendering ' + $scope.url + ' ....';

        var encodedUrl = encodeUrl($scope.url);
        $http.get(encodedUrl)
          .success(function (content) {

            $scope.stats.appReq.totalSize = BytestoHumanValue(content.length);

            iframeDoc.body.innerHTML = content;

            var links = iframeDoc.getElementsByTagName('a');

            for (var i = 0; i < links.length; i++) {

              links[i].addEventListener('click', onclick, false);

            }

            var forms = iframeDoc.getElementsByTagName('form');

            for (var j = 0; j < forms.length; j++) {

              var form = forms[j];
              form.addEventListener('submit', onsubmit);

              for (var k = 0; k < form.length; k++) {

                var input = form[k];

                if(input.type === 'submit'){

                  input.addEventListener('click', function(){
                    form.submitName = input.name;
                  }, false);

                }

              }

            }

            window.frames.iframeSite.setAttribute('width', '100%');
            window.frames.iframeSite.setAttribute('height', (document.getElementById('content').offsetHeight - document.getElementById('header').scrollHeight) + "px");
            $scope.loading = '';
            $scope.renderFinish = true;
          })
          .error(function (err) {
            $scope.error = err || 'Api error';
            $timeout(function () {
              $scope.error = '';
            }, 2000);
          });
      }

      function getPageSpeed() {


        $http.get(urlApi_GPageSpeed + $scope.url + paramsApi_GPageSpeed)
          .success(function (data) {

            var stats = data.pageStats;
            $scope.stats.compare.nbRequest = stats.numberResources;
            $scope.stats.compare.nbHost = stats.numberHosts;
            $scope.stats.compare.totalSize = BytestoHumanValue(sumBytes([stats.cssResponseBytes, stats.htmlResponseBytes, stats.imageResponseBytes, stats.javascriptResponseBytes, stats.otherResponseBytes, stats.textResponseBytes]));

          })
          .error(function (err) {
            $scope.error = err;
            $timeout(function () {
              $scope.error = '';
            }, 2000);
          });
      }

      $scope.clickbtn = function () {

        if ($scope.url && $scope.url.length > 0) {

          if ($scope.url.indexOf('http') !== 0) {

            $scope.url = 'http://' + $scope.url;

          }

          getUrl();
          getPageSpeed();

        }

      };
    
  });
