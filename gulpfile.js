// Gulpfile.js
var gulp = require('gulp'),
    install = require("gulp-install"),
    wiredep = require('wiredep').stream,
    browserSync = require('browser-sync');

gulp.task('install', function() {
    return gulp.src(['./bower.json', './package.json'])
        .pipe(install());
});

gulp.task('index', function() {
    gulp.src('./public/index.html')
        .pipe(wiredep({
            // optional: 'configuration',
            // goes: 'here'
        }))
        .pipe(gulp.dest('./public'));
});

gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./public"
        }
    });
});

gulp.task('js', function() {
    return gulp.src('public/**/*.js')
        // do stuff to JavaScript files
        //.pipe(uglify())
        //.pipe(gulp.dest('...'));
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('css', function() {
    return gulp.src('public/**/*.css')
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('bs-reload', function() {
    browserSync.reload();
});

gulp.task('default', ['install', 'index', 'browser-sync'], function() {
    gulp.watch('public/**/*.js', ['js', 'index']);
    gulp.watch('public/**/*.css', ['css', 'index']);
    gulp.watch('public/**/*.html', ['bs-reload']);
    gulp.watch('bower.json', ['install', 'index', 'bs-reload'])
});