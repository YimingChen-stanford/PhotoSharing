'use strict';

var cs142App = angular.module('cs142App', ['ngRoute', 'ngMaterial','ngResource','mentio']);


cs142App.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.

            when('/users', {
                templateUrl: 'components/user-list/user-listTemplate.html',
                controller: 'UserListController'
            }).
            when('/users/:userId', {
                templateUrl: 'components/user-detail/user-detailTemplate.html',
                controller: 'UserDetailController'
            }).
            when('/photos/:userId', {
                templateUrl: 'components/user-photos/user-photosTemplate.html',
                controller: 'UserPhotosController'
            }).
             when('/login-register', {
                templateUrl: 'components/login-register/login-registerTemplate.html',
                controller: 'LoginRegisterController'
            }).
             when('/search-comments', {
                templateUrl: 'components/search-comments/search-comments.html',
                controller: 'SearchCommentsController'
            }).
            otherwise({
                redirectTo:'/login-register'
            });
    }]);
cs142App.config(function($mdThemingProvider) {
$mdThemingProvider.theme('default')
        .primaryPalette('indigo')
        .accentPalette('light-blue');
});

cs142App.controller('MainController', ['$scope','$location', '$resource', '$http', '$rootScope',
    function ($scope,$location, $resource, $http, $rootScope) {
        console.log("67");
         $scope.main = {};
        $scope.main.title = {title: 'Users'};
        $scope.main.loggedIn = false;
        $scope.main.register = true;
        $scope.main.mention = false;
        $scope.main.mentionPhotos=[];
        $scope.main.mentionId="";

        var noOneIsLoggedIn = function(){
            if($scope.main.loggedIn === false){
                
                return true;
            }
            else{
                
                return false;
            }
        };
        $rootScope.$on( "$routeChangeStart", function(event, next, current) {
            
          if (noOneIsLoggedIn()) {
            console.log("#######");
         // no logged user, redirect to /login-register unless already there
         if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
            
            $location.path("/login-register");
        }
        }

        else{
            console.log("$$$$$$$$$$$$$");
            //console.log(current.templateUrl);
             console.log(next.templateUrl);
           // $location.path("/login-register");
        }

        });

        $scope.toolbar = {};
        $scope.toolbar.check = false;
        $scope.toolbar.page ="1";
        $scope.toolbar.display ="";
        $scope.toolbar.version ="";
        $scope.toolbar.message = "";
        $scope.sidebar = {};
        $scope.sidebar.search = "";
        $scope.sidebar.photos = {};

       
        $scope.FetchModel = function(url, doneCallback) {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                console.log(xhr.readyState);
            //Don’t do anything if not final state
            if (xhr.readyState !== 4){ 
            return; 
            }
            //Final State but status not OK
            if (xhr.status !== 200) {
                console.log(5);
            return;
            }
                doneCallback(JSON.parse(xhr.responseText));
            };
            xhr.open("GET", url);
            xhr.send();
            
        };
        
        function doneCallback (model) {
            $scope.$apply(function () {
                $scope.toolbar.version = model.version;
            // Put code that updates any $scope variables here
            });
        }
        $scope.logout = function (){
            var resource = $resource('/admin/logout');
            console.log("+++");
            resource.save({}, function () {
                window.alert("You've logged out!");
                $rootScope.$broadcast('loggeOut');
                $location.path("/login-register");
                $scope.main.loggedIn = false;
                $scope.main.register = true;
            }, function errorHandling(err) { 
              
          });
        };

        $scope.FetchModel("/test/info",doneCallback);
        
        var selectedPhotoFile;   // Holds the last file selected by the user

        // Called on file selection - we simply save a reference to the file in selectedPhotoFile
        $scope.inputFileNameChanged = function (element) {
            selectedPhotoFile = element.files[0];
                $scope.uploadPhoto();
        };

        // Has the user selected a file?
        $scope.inputFileNameSelected = function () {
            
            return !!selectedPhotoFile;
        };

        // Upload the photo file selected by the user using a post request to the URL /photos/new
        $scope.uploadPhoto = function () {
            
            if (!$scope.inputFileNameSelected()) {
                console.error("uploadPhoto called will no selected file");
                return;
            }
            console.log('fileSubmitted', selectedPhotoFile);

            // Create a DOM form and add the file to it under the name uploadedphoto
            var domForm = new FormData();
            domForm.append('uploadedphoto', selectedPhotoFile);

            // Using $http to POST the form
            $http.post('/photos/new', domForm, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).success(function(newPhoto){
                window.alert("New photo have been successfully uploaded");
                $rootScope.$broadcast('phototUploaded');
                // The photo was successfully uploaded. XXX - Do whatever you want on success.
            }).error(function(err){
                // Couldn't upload the photo. XXX  - Do whatever you want on failure.
                console.error('ERROR uploading photo', err);
            });

        };


         $scope.search = function (){
            var resource = $resource('/search');
            console.log("+++");
            console.log($scope.sidebar.search);
            resource.query({keyword:$scope.sidebar.search}, function (model) {
                 console.log("TTTTTTTTTTTTT");
                $scope.sidebar.photos = model;
                
                console.log(model);
                if(model[0]){
                    $location.path("/search-comments");
                }
            }, function errorHandling(err) { 
              console.log(err);
          });
        };


    }]);



