function logMilestone(message) {
    console.log(" ================== " + message + " ================== ")
}

var config = {
    apiKey: "AIzaSyAqSEv9WS9OGziS1dxEKAE4iiOOcPlViB8",
    authDomain: "nerdy-attendance.firebaseapp.com",
    databaseURL: "https://nerdy-attendance.firebaseio.com",
    storageBucket: "nerdy-attendance.appspot.com",
    messagingSenderId: "171472526719"
};

firebase.initializeApp(config);

var app = angular.module('crossover', [
    'ui.router',
    'ngMaterial',
    'firebase',
    'signature'
]);

app.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('lime')
        .accentPalette('orange');
});

app.run(RunBlock);

RunBlock.$inject = ['$state', '$rootScope'];

function RunBlock($state, $rootScope) {
    // $state.go('home');
    $rootScope.$on('$stateChangeError', function $stateChangeError(event, toState,
        toParams, fromState, fromParams, error) {
        console.group();
        console.error('$stateChangeError', error);
        console.error(error.stack);
        console.info('event', event);
        console.info('toState', toState);
        console.info('toParams', toParams);
        console.info('fromState', fromState);
        console.info('fromParams', fromParams);
        console.groupEnd();
    });
}

app.config(ConfigBlock);

ConfigBlock.$inject = ['$stateProvider', '$urlRouterProvider'];

function ConfigBlock($stateProvider, $urlRouterProvider) {

    logMilestone("Config");

    var HomeState = {
        name: 'home',
        url: '/',
        template: '<ui-view></ui-view>'
    };

    var AttendanceState = {
        name: 'attendance',
        parent: 'home',
        url: 'attendance/',
        templateUrl: 'views/attendance.html',
        controller: 'AttendanceCtrl'
    };

    $stateProvider.state('home', HomeState);
    $stateProvider.state('attendance', AttendanceState);
    $urlRouterProvider.otherwise('/attendance/');
}

app.controller('NavbarCtrl', function($scope, $firebaseAuth) {
    $scope.authObj = $firebaseAuth();
    $scope.firebaseUser = $scope.authObj.$getAuth();

    $scope.login = function(authType) {
        switch (authType) {
            case 'google':
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

app.controller('AttendanceCtrl', function($scope, $firebaseArray, $mdDialog) {
    var ref = firebase.database().ref().child("participants");
    $scope.participants = $firebaseArray(ref);

});
