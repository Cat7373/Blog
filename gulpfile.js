var gulp = require('gulp');
var cleanCSS = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var htmlclean = require('gulp-htmlclean');
var htmlmin = require('gulp-htmlmin');
var pump = require('pump');


// 压缩 public 目录 css
gulp.task('minify-css', function() {
    return gulp.src(['./public/**/*.css', '!./public/**/*.min.css'])
        .pipe(cleanCSS())
        .pipe(gulp.dest('./public'));
});

// 压缩 public/js 目录 js
gulp.task('minify-js', function (cb) {
    pump([
        gulp.src(['./public/**/*.js', '!./public/**/*.min.js']),
        uglify(),
        gulp.dest('./public')
    ], cb);
});

// 压缩 public 目录 html
gulp.task('minify-html', function() {
  return gulp.src('./public/**/*.html')
    .pipe(htmlclean())
    .pipe(htmlmin({
         removeComments: true,
         minifyJS: true,
         minifyCSS: true,
         minifyURLs: true,
    }))
    .pipe(gulp.dest('./public'))
});

// 执行 gulp 命令时执行的任务
gulp.task('default', [
    'minify-html','minify-css','minify-js'
]);
