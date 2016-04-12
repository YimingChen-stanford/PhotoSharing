'use strict';

cs142App.controller('UserDetailController', ['$scope', '$routeParams','$rootScope',
  function ($scope, $routeParams,$rootScope) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    var userId = $routeParams.userId;
    console.log('UserDetail of ', userId);

    $scope.detail = {};
    $scope.feed = {};

    
    $scope.toolbar.page = "detail";
    
    if($scope.main.mentionId!==userId){
        $scope.main.mention = false;
    }
    else{
         $scope.main.mention = true;
    }
    function doneCallback (model) {
            $scope.$apply(function () {
                $scope.toolbar.display = model.first_name +" "+model.last_name;
                $scope.detail = model;
                
            // Put code that updates any $scope variables here
            });
        }
        if($scope.main.loggedIn){
          $scope.FetchModel("/user/"+userId,doneCallback);
         
        }

        $rootScope.$on('loggeOut', function() {
         $scope.detail = {};
        });

     

    

  }]);
