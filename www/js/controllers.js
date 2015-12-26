angular.module('lower-up-get.controllers', [])

  .filter("sanitize", ['$sce', function($sce) {
    return function(htmlCode){
      return $sce.trustAsHtml(htmlCode);
    }
  }])
  .controller('WebCtrl', function(API, KEY_GOOGLE_PAGE_SPEED,  $scope, $http, $timeout) {
    var urlApi_GPageSpeed = 'https://www.googleapis.com/pagespeedonline/v2/runPagespeed?url=';
    var paramsApi_GPageSpeed = '&filter_third_party_resources=true&screenshot=false&strategy=mobile&fields=pageStats&key=' + KEY_GOOGLE_PAGE_SPEED;
    
    var apiBaseUrl = API + "/get?url=";
    $scope.renderFinish = false;
    $scope.url = "http://google.fr";
    $scope.content = "";
    $scope.error = "";
    $scope.stats = {
      appReq: {
        totalSize: 0,
        nbHost: 1,
        nbRequest:1
      },
      compare:{
        totalSize: 0,
        nbHost: 1,
        nbRequest:1
      }
    };

    function BytestoHumanValue(bytesVal){
      var intVal = parseInt(bytesVal);
      if(intVal < 1000){
        return intVal + "o";
      }

      if( intVal < 1000000){
        return parseInt(intVal / 1000) + "Ko";
      }
      else{
        return (parseInt(intVal / 1000) / 1000).toFixed(1) + "Mo";
      }
    }
    
    function sumBytes(arrayBytes){
      var intSum = 0;

      var i;

      for( i=0; i < arrayBytes.length; i++){
        var testInt = parseInt(arrayBytes[i]);
        if( !isNaN(testInt) ){
          intSum += testInt;
        }
      }

      return intSum;
    }
    
    function getUrl(){
      $scope.renderFinish = false;
      $http.get(apiBaseUrl + $scope.url)
        .success(function(content){
          $scope.stats.appReq.totalSize = BytestoHumanValue(content.length);
          $scope.content = content;
          $scope.renderFinish = true;
        })
        .error(function(err){
          $scope.error = err || "Api error";
          $timeout(function(){
            $scope.error = "";
          }, 2000);
        });
    }
    
    function getPageSpeed(){
      
      
      $http.get(urlApi_GPageSpeed + $scope.url + paramsApi_GPageSpeed)
        .success(function(data){
          var stats = data.pageStats;
          $scope.stats.compare.nbRequest = stats.numberResources;
          $scope.stats.compare.nbHost = stats.numberHosts;
          $scope.stats.compare.totalSize = BytestoHumanValue(sumBytes([stats.cssResponseBytes, stats.htmlResponseBytes, stats.imageResponseBytes, stats.javascriptResponseBytes, stats.otherResponseBytes, stats.textResponseBytes]));
        })
        .error(function(err){
          $scope.error = err;
          $timeout(function(){
            $scope.error = "";
          }, 2000);
        });
    }
    
    $scope.clickbtn = function(){
      if($scope.url && $scope.url.length > 0){
        if( !$scope.url.includes('http', 0) ){
          $scope.url = 'http://' + $scope.url;
        }
        $scope.content = "Rendering " + $scope.url + " ....";
        getUrl();
        getPageSpeed();
      }
    };
  });