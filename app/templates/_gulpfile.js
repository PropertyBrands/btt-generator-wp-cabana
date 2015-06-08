/**
 * Front end tasks.
 */
var gulp          = require('gulp');
var plumber       = require('gulp-plumber');
var sass          = require('gulp-sass');
var sourcemap     = require('gulp-sourcemaps');
var autoprefixer  = require('gulp-autoprefixer');
var livereload    = require('gulp-livereload');
var notify        = require('gulp-notify');
var changed       = require('gulp-changed');
var iconfont      = require('gulp-iconfont');
var consolidate   = require('gulp-consolidate');
var cache         = require('gulp-cache');
var imagemin      = require('gulp-imagemin');

// Define variables for our paths
var paths = {
  sass: ['./sass/*.scss', './sass/**/*.scss'],
  files: '*.php',
  js: './js/*.js',
  img: './images/*.{jpg,png,gif,svg}',
  css: './'
};

// Sass error function
function errorAlert(error){
  notify.onError({
    title: 'SCSS Error',
    message: 'Check your terminal',
    sound: 'Sosumi'
  })(error);
  console.log(error.toString());
  this.emit('end');
};

// Sass Tasks
// Set Sass and Autoprefix options here
gulp.task('sass', function() {
  return gulp.src(paths.sass)
    .pipe(plumber({errorHandler: errorAlert}))
    .pipe(sourcemap.init({loadMaps: true}))
    .pipe(sass())
    .on("error", notify.onError({
      message: 'Error: <%= error.message %>'
    }))
    .pipe(autoprefixer('> 0.25%'))
    .pipe(sourcemap.write('./maps'))
    .pipe(gulp.dest(paths.css));
});

// Clear the gulp cache - run `gulp clear`
gulp.task('clear', function (done) {
  return cache.clearAll(done);
});

// Minify images and set up the folder for livereload. First run
// will minify all images, subsequent runs will minify only new or
// modified files
gulp.task('img', function () {
  return gulp.src(paths.img)
    .pipe(cache(imagemin({optimizationLevel: 3, verbose: true})))
    .pipe(gulp.dest('images/'));
});

// Watch function
gulp.task('watch', function () {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(paths.img, ['img']);
  livereload.listen({basePath: './**'});
  gulp.watch(['style.css', '*.php', 'js/*.js', 'images/*.{jpg,png,gif,svg}']).on('change', livereload.changed);
});

// Define default task
gulp.task('default', ['watch']);

// Create icon font from a folder of SVGs
// Has to be run separately from default task
// To use, run `gulp icons`
gulp.task('icons', function () {
  gulp.src(['icons/*.svg'])
    .pipe(iconfont({
      fontName: 'icons',
      appendCodepoints: true,
      normalize: true
    }))
    .on('codepoints', function (codepoints, options) {
      gulp.src('sass/typography/_icons-template.scss')
        .pipe(consolidate('lodash', {
          glyphs: codepoints,
          fontName: 'icons',
          fontPath: 'fonts/icons/',
          className: 'icon'
        }))
        .pipe(gulp.dest('sass/elements'));
    })
    .pipe(gulp.dest('fonts/icons'));
});
