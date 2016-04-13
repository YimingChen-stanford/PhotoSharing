'use strict';

cs142App.controller('UserListController', ['$scope','$location','$rootScope',
    function ($scope,$location,$rootScope) {
        $scope.main.title = 'Users';
        $scope.user = {};
        $scope.user.list = [];
    
        $scope.toolbar.page = "photo";
       
        function doneCallback (model) {
            $scope.$apply(function () {
                $scope.user.list = model;
            // Put code that updates any $scope variables here
            });
        }
       
        if($scope.main.loggedIn){
             $scope.FetchModel("/user/list",doneCallback);
        }

        $rootScope.$on('loggeOut', function() {
      $scope.user = {};
        });
    }]);

