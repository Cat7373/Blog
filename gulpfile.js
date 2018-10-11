let gulp = require('gulp');
let cleanCSS = require('gulp-clean-css');
let uglify = require('gulp-uglify');
let htmlclean = require('gulp-htmlclean');
let htmlmin = require('gulp-htmlmin');
let sriHash = require('gulp-sri-hash');
let pump = require('pump');
let dom = require('gulp-dom')


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
    .pipe(dom(function () {
      Array.from(this.querySelectorAll('a'))
        .filter(link => link.target === '_blank')
        .forEach(link => link.rel = 'noopener noreferrer')
      return this
    }))
    .pipe(htmlclean())
    .pipe(htmlmin({
      removeComments: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    }))
    .pipe(gulp.dest('./public'))
});

// SRI
gulp.task('sri', function() {
  return gulp.src('./public/**/*.html')
    .pipe(sriHash({algo: 'sha512'}))
    .pipe(gulp.dest('./public'))
});

// 执行 gulp 命令时执行的任务
gulp.task('default', gulp.series(gulp.parallel('minify-html', 'minify-css', 'minify-js'), 'sri'));
