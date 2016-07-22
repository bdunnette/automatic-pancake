var app = angular.module('nerdy', ['firebase', 'ui.bootstrap', 'ui.select', 'signature']);

function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var bb = new BlobBuilder();
    bb.append(ab);
    return bb.getBlob(mimeString);
}

function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {
        type: mime
    });
}

app.run(function($rootScope) {
    var config = {
        apiKey: "AIzaSyA-Qq5Uafa7SpfNEUkdAh4khBZcjC6sk6U",
        authDomain: "crossover-5f313.firebaseapp.com",
        databaseURL: "https://crossover-5f313.firebaseio.com",
        storageBucket: "crossover-5f313.appspot.com",
    };

    firebase.initializeApp(config);
});

app.controller('MainCtrl', function($scope, $firebaseArray) {
    $scope.newSkater = {};
    var ref = firebase.database().ref().child("skaters");
    $scope.imageStorage = firebase.storage().ref().child('images/');
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

    $scope.sign = function() {
        var signature = $scope.accept();
        console.log(signature);
        var sigFile = $scope.imageStorage.child(Date.now() + ".png");
        console.log(sigFile);
        var blob = dataURLtoBlob(signature.dataUrl);
        console.log(blob);
        var uploadTask = sigFile.put(blob);
        console.log(uploadTask);
        uploadTask.on('state_changed', function(snapshot) {
            // Observe state change events such as progress, pause, and resume
            // See below for more detail
            console.log(snapshot);
        }, function(error) {
            // Handle unsuccessful uploads
            console.log(error);
        }, function() {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            var downloadURL = uploadTask.snapshot.downloadURL;
            console.log(uploadTask);
            console.log(uploadTask.snapshot);
        });
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
