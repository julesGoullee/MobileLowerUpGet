angular.module('lower-up-get.controllers', [])

  .filter("sanitize", ['$sce', function($sce) {
    return function(htmlCode){
      return $sce.trustAsHtml(htmlCode);
    }
  }])
  .controller('WebCtrl', function(API, $scope, $http, $timeout) {
    var apiBaseUrl = API + "/get?url=";
    $scope.url = "http://google.fr";
    $scope.content = "";
    $scope.error = "";

    $scope.clickbtn = function(){
      if($scope.url && $scope.url.length > 0){
        if( !$scope.url.includes('http', 0) ){
          $scope.url = 'http://' + $scope.url;
        }
        $scope.content = "Rendering " + $scope.url + " ....";
        $http.get(apiBaseUrl + $scope.url)
          .success(function(content){
            $scope.content = content;
          })
          .error(function(err){
            $scope.error = err;
            $timeout(function(){
              $scope.error = "";
            }, 2000);
          });
      }
    };
  });