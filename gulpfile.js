var gulp = require('gulp');
var cleanCSS = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var htmlclean = require('gulp-htmlclean');
var htmlmin = require('gulp-htmlmin');

// ѹ�� public Ŀ¼ css
gulp.task('minify-css', function() {
    return gulp.src('./public/**/*.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest('./public'));
});

// ѹ�� public/js Ŀ¼ js
gulp.task('minify-js', function() {
    return gulp.src('./public/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('./public'));
});

// ѹ�� public Ŀ¼ html
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

// ִ�� gulp ����ʱִ�е�����
gulp.task('default', [
    'minify-html','minify-css','minify-js'
]);
