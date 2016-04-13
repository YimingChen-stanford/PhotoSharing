'use strict';

cs142App.controller('LoginRegisterController', ['$scope', '$routeParams','$rootScope', '$location', '$resource',
  function ($scope, $routeParams,$rootScope, $location, $resource) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    $scope.login ={};
    $scope.login.loginName = "";
    $scope.login.password = "";
    
    $scope.register ={};
    $scope.register.login_name = "";
    $scope.register.password1 = "";
    $scope.register.password2 = "";
    $scope.register.first_name = "";
    $scope.register.last_name = "";
    $scope.register.location = "";
    $scope.register.description = "";
    $scope.register.occupation = "";
    

    $scope.submitForm = function(){
      var resource = $resource('/admin/login');
      
      resource.save({login_name:$scope.login.loginName,password:$scope.login.password}, function (model) {
        $scope.main.loggedIn = true;
        $rootScope.$broadcast('loggedIn');
        $scope.toolbar.message = "Hi "+ model.first_name;
        
        if(model.mentionPhotos){
           $scope.main.mentionPhotos = model.mentionPhotos;
           $scope.main.mentionId = model.id;
          $scope.main.mention = true;

        }
       $location.path('/users/'+model.id);

    }, function errorHandling(err) {
      console.log(err);
      $location.path('/login-register');
      if(err.status===401){

        window.alert("wrong password");
      }
      else{
        window.alert("your login name is not valid");
      }
      
      
    });
    };
    $scope.register = function(){
        if($scope.register.password1!==$scope.register.password2){
          window.alert("the passwords you entered didn't match");
          return;
        }
        if(!$scope.register.password1||!$scope.register.password2){
          window.alert("please enter the password");
          return;
        }
        if(!$scope.register.login_name){
          window.alert("please enter your login name");
          return;
        }
        if(!$scope.register.first_name){
          window.alert("please enter your first name");
          return;
        }
        if(!$scope.register.last_name){
          window.alert("please enter your last name");
          return;
        }

      var resource = $resource('/user');
      resource.save({
        login_name:$scope.register.login_name,
    password:$scope.register.password1,
    first_name: $scope.register.first_name,
   last_name:$scope.register.last_name,
   location:$scope.register.location,
    description: $scope.register.description,
   occupation:$scope.register.occupation
      }, function (model) {
        $scope.main.register = false;
        window.alert("you've registerd!");
    }, function errorHandling(err) {
      if(err.status===401){
        window.alert("loing_name already taken please use another one");
      }
      
    });
    };

  }]);
