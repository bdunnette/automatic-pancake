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
    'webcam'
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

    $scope.showDialog = function(ev) {
        $mdDialog.show({
                controller: SignInOutController,
                templateUrl: 'views/sign-in-out.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: true
            })
            .then(function(answer) {
                console.log(answer);
            }, function() {
                console.log('You cancelled the dialog.');
            });
    };

    function SignInOutController($scope, $mdDialog) {
        $scope.hide = function() {
            $mdDialog.hide();
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.answer = function(answer) {
            $mdDialog.hide(answer);
        };

        $scope.editingImage = {};
        var storageRef = firebase.storage().ref().child("images");

        var _video = null,
            patData = null;

        $scope.patOpts = {
            x: 0,
            y: 0,
            w: 25,
            h: 25
        };

        // Setup a channel to receive a video property
        // with a reference to the video element
        // See the HTML binding in main.html
        $scope.channel = {
            videoWidth: 160,
            videoHeight: 120
        };

        $scope.webcamError = false;
        $scope.onError = function(err) {
            $scope.$apply(
                function() {
                    $scope.webcamError = err;
                }
            );
        };

        $scope.onSuccess = function() {
            // The video element contains the captured camera data
            _video = $scope.channel.video;
            $scope.$apply(function() {
                $scope.patOpts.w = _video.width;
                $scope.patOpts.h = _video.height;
                $scope.showDemos = true;
            });
        };

        $scope.onStream = function(stream) {
            // You could do something manually with the stream.
        };


        /**
         * Make a snapshot of the camera data and show it in another canvas.
         */
        $scope.makeSnapshot = function makeSnapshot() {
            if (_video) {
                var patCanvas = document.querySelector('#snapshot');
                if (!patCanvas) return;

                patCanvas.width = _video.width;
                patCanvas.height = _video.height;
                var ctxPat = patCanvas.getContext('2d');

                var idata = getVideoData($scope.patOpts.x, $scope.patOpts.y, $scope.patOpts.w, $scope.patOpts.h);
                ctxPat.putImageData(idata, 0, 0);
                console.log(patCanvas);
                patCanvas.toBlob(function(blob) {
                    var imageName = Date.now().toString();
                    console.log(imageName);
                    var uploadTask = storageRef.child(imageName + '.png').put(blob);
                    uploadTask.on('state_changed', function(snapshot) {
                        // Observe state change events such as progress, pause, and resume
                        // See below for more detail
                    }, function(error) {
                        // Handle unsuccessful uploads
                        console.error(error);
                    }, function() {
                        // Handle successful uploads on complete
                        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                        var downloadURL = uploadTask.snapshot.downloadURL;
                        console.log(uploadTask.snapshot);
                        $scope.editingImage.url = downloadURL;
                        console.log($scope.editingImage);
                    });
                })

                patData = idata;
            }
        };

        /**
         * Redirect the browser to the URL given.
         * Used to download the image by passing a dataURL string
         */
        $scope.downloadSnapshot = function downloadSnapshot(dataURL) {
            window.location.href = dataURL;
        };

        var getVideoData = function getVideoData(x, y, w, h) {
            var hiddenCanvas = document.createElement('canvas');
            hiddenCanvas.width = _video.width;
            hiddenCanvas.height = _video.height;
            var ctx = hiddenCanvas.getContext('2d');
            ctx.drawImage(_video, 0, 0, _video.width, _video.height);
            return ctx.getImageData(x, y, w, h);
        };

        /**
         * This function could be used to send the image data
         * to a backend server that expects base64 encoded images.
         *
         * In this example, we simply store it in the scope for display.
         */
        var sendSnapshotToServer = function sendSnapshotToServer(imgBase64) {
            $scope.snapshotData = imgBase64;
        };
    }
});
