'use strict';

cs142App.controller('UserPhotosController', ['$scope', '$routeParams','$rootScope', '$location', '$resource','mentioUtil',
  function($scope, $routeParams,$rootScope, $location, $resource, mentioUtil) {
    /*
     * Since the route is specified as '/photos/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    var userId = $routeParams.userId;
    console.log('UserPhoto of ', $routeParams.userId);
    $scope.photos = {};
    $scope.mention={};
    $scope.mention.users=[];
    
    $scope.toolbar.display ="Photos of "+$scope.toolbar.display;
    function doneCallback (model) {
            $scope.$apply(function () {
                $scope.photos = model;
                console.log("3333");
            // Put code that updates any $scope variables here
            });
        }

    if($scope.main.loggedIn){
       $scope.FetchModel("/photosOfUser/"+userId,doneCallback);
    }
   
    $scope.submitComment = function(id,commentContent){
      console.log("****"+id+"***"+commentContent);
var str = "12345.00";
str = str.substring(0, str.length - 1);
      var mention = commentContent.match(/@[\w]*\b/g);
      var mention_userId = [];
      if(mention){
        for (var i = 0;i<mention.length;i++){
        mention[i] = mention[i].substring(1, mention[i].length);
      }
      console.log(mention);
      for(var j = 0;j<$scope.mention.users.length;j++){
        if(mention.indexOf($scope.mention.users[j].first_name)!==-1){
            mention_userId.push($scope.mention.users[j].id);
        }
      }
      console.log(mention_userId);
      }
      
       var resource = $resource('/commentsOfPhoto/'+id);
       resource.save({comment:commentContent,mention_id:mention_userId}, function () {
console.log(">>>>>>");
        $scope.FetchModel("/photosOfUser/"+userId,doneCallback);
    }, function errorHandling(err) {
        window.alert("can't input empty comment");
    });
  

    };
    $rootScope.$on('phototUploaded', function() {
      $scope.FetchModel("/photosOfUser/"+userId,doneCallback);
    });
    $rootScope.$on('loggeOut', function() {
      $scope.photos = {};
    });

    $scope.getPeopleText = function(item) {
            return '@' + item.first_name;
        };

    function callback (model) {

              $scope.mention.users=model;
              for(var i=0;i<model.length;i++){
                
              $scope.mention.users[i].label =  $scope.mention.users[i].first_name;

              }
              console.log("$scope.mention.users[0].first_name");
              console.log($scope.mention.users[0].label);
               
                
            // Put code that updates any $scope variables here
            
        }
       
        if($scope.main.loggedIn){
             $scope.FetchModel("/user/list",callback);
        }

  }]);
