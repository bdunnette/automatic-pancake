var config = {
    apiKey: "AIzaSyAIZZxVn14qPES4cyoWBcl6MU0aCdsbSss",
    authDomain: "nerdy-web.firebaseapp.com",
    databaseURL: "https://nerdy-web.firebaseio.com",
    storageBucket: "nerdy-web.appspot.com",
};

firebase.initializeApp(config);

var app = angular.module('nerdy', ['ngRoute', 'firebase', 'ui.bootstrap'])
    .config(['$locationProvider', '$routeProvider',
        function config($locationProvider, $routeProvider) {
            // $locationProvider.hashPrefix('!');

            $routeProvider.
            when('/', {
                templateUrl: 'views/skater-list.html',
                controller: 'MainCtrl'
            }).
            when('/:collectionId', {
                templateUrl: 'views/collection-detail.html',
                controller: 'CollectionCtrl'
            }).
            when('/:collectionId/:caseId/:slideId', {
                templateUrl: 'views/slide.html',
                controller: 'SlideCtrl'
            }).
            otherwise('/');
        }
    ]);

app.controller('MainCtrl', function($scope, $firebaseArray) {
    $scope.newSkater = {};
    var ref = firebase.database().ref().child("skaters");
    // create a synchronized array
    // click on `index.html` above to see it used in the DOM!
    $scope.skaters = $firebaseArray(ref);
    console.log($scope.skaters);

    $scope.addSkater = function(skater) {
        if (skater.$id) {
            $scope.skaters.$save(skater);
        } else {
            $scope.skaters.$add(skater);
        }
        $scope.newSkater = {};
    }

    $scope.editSkater = function() {
        $scope.newSkater = this.skater;
    }
});

app.controller('NavbarCtrl', function($scope, $firebaseAuth) {
    $scope.authObj = $firebaseAuth();
    $scope.firebaseUser = $scope.authObj.$getAuth();

    $scope.login = function(authType) {
        switch (authType) {
            case 'facebook':
            default:
                // login with Google
                $scope.authObj.$signInWithPopup(authType).then(function(firebaseUser) {
                    console.log("Signed in as:", firebaseUser.uid);
                    console.log($scope.authObj.$getAuth());
                }).catch(function(error) {
                    console.log("Authentication failed:", error);
                });
        }
    }
});

app.controller('CollectionCtrl', function($scope, $firebaseObject, $routeParams) {
    console.log($routeParams);
    var ref = firebase.database().ref().child("collections/" + $routeParams.collectionId);
    // download the data into a local object
    var syncObject = $firebaseObject(ref);
    // synchronize the object with a three-way data binding
    // click on `index.html` above to see it used in the DOM!
    syncObject.$bindTo($scope, "collection");
});

app.controller('SlideCtrl', function($scope, $firebaseObject, $routeParams, leafletData) {
    var ref = firebase.database().ref().child("collections/" + $routeParams.collectionId);
    console.log(ref);
    // download the data into a local object
    var syncObject = $firebaseObject(ref);
    // synchronize the object with a three-way data binding
    // click on `index.html` above to see it used in the DOM!
    syncObject.$bindTo($scope, "collection");
    console.log($scope);

    leafletData.getMap("map").then(function(map) {
        map.attributionControl.setPrefix('');
    });
    $scope.contributors = ['Regents of the University of Minnesota'];

    angular.extend($scope, {
        slideCenter: {
            lat: 0,
            lng: 0,
            zoom: 2
        },
        defaults: {
            maxZoom: 8,
            noWrap: true,
            continuousWorld: false
        },
        tiles: {
            url: '',
            options: {
                continuousWorld: false,
                noWrap: true,
                attribution: 'Images &copy; 2016 Regents of the University of Minnesota'
            }
        },
        controls: {
            fullscreen: {
                position: 'topleft'
            }
        }
    });

    $scope.$watch(
        "collection",
        function handleCollectionChange(newValue, oldValue) {
            $scope.case = $scope.collection.cases[$routeParams.caseId];
            console.log($scope.case);
            $scope.slide = $scope.case.slides[$routeParams.slideId];
            console.log($scope.slide);
            $scope.collectionYear = new Date($scope.collection.date).getFullYear();
            if ('contact' in $scope.collection) {
                // If a contact is given for a collection, credit them first in the attribution, with their name followed by their titles/credentials
                $scope.contributors.unshift([$scope.collection.contact.name, $scope.collection.contact.titles.join(' ')].join(' '));
            };
            $scope.tiles.options.attribution = 'Images &copy; ' + $scope.collectionYear + ' ' + $scope.contributors.join(' and ');
            $scope.tiles.url = 'http://slides.pathology.umn.edu/' + $scope.collection.date + '/' + $scope.slide + '/{z}/{y}/{x}.jpg'
        }
    );

    console.log($scope.tiles);
});
