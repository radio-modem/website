'use strict';

const fs = require('fs');
const gulp = require('gulp');
const gulpsmith = require('gulpsmith');
const del = require('del');
const $ = require('gulp-load-plugins')();
const $$ = require('load-metalsmith-plugins')();
const _ = require('lodash');
const async = require('async');
const humans = require('humans-generator');
const robots = require('robots-generator');

gulp.task('img', ['img:clean'], () => gulp.src('img/**')
  .pipe($.plumber())
  .pipe($.changed('dist/img'))
  .pipe($.imagemin({
    svgoPlugins: [
      {removeTitle: true},
      {removeDesc: true}
    ]
  }))
  .pipe(gulp.dest('dist/img'))
  .pipe($.size({
    title: 'img',
    showFiles: true
  }))
);

gulp.task('img:clean', () => del(['dist/img']));

gulp.task('html', ['html:clean'], () => gulp.src('html/**/*.{md,html}')
  .pipe($.plumber())
  .pipe($.frontMatter().on('data', file => {
    _.assign(file, file.frontMatter);
  }))
  .pipe(gulpsmith()
    .use($$.markdown())
    .use($$.permalinks(':title'))
    .use($$.layouts({
      engine: 'ejs',
      directory: 'tpl'
    }))
    .use($$.inPlace({
      engine: 'ejs'
    }))
  )
  .pipe($.htmlmin())
  .pipe(gulp.dest('dist'))
  .pipe($.livereload())
  .pipe($.size({
    title: 'html',
    showFiles: true
  }))
);

gulp.task('html:clean', () => del(['dist/**/*.html']));

gulp.task('copy', () => gulp.src([
  'favicon.ico',
  'CNAME'
], {
  base: './'
})
  .pipe($.plumber())
  .pipe($.changed('dist'))
  .pipe(gulp.dest('dist'))
);

gulp.task('meta', ['html', 'meta:clean'], done => async.parallel([
  next => {
    humans(require('./humans.json'), (err, content) => {
      if (err) {
        return;
      }

      fs.writeFile('dist/humans.txt', content.join('\n'), next);
    });
  },
  next => {
    robots(require('./robots.json'), (err, content) => {
      if (err) {
        return;
      }

      fs.writeFile('dist/robots.txt', content.join('\n'), next);
    });
  }
], done));

gulp.task('meta:clean', () => del(['dist/humans.txt', 'dist/robots.txt']));

gulp.task('build', [
  'img',
  'html',
  'copy',
  'meta'
]);

gulp.task('default', ['build']);

gulp.task('watch', ['build'], () => {
  $.livereload.listen();

  gulp.watch([
    'tpl/**/*.html',
    'html/**/*.{md,html}'
  ], ['html']);
});

gulp.task('serve', ['watch'], () => gulp.src('dist')
  .pipe($.plumber())
  .pipe($.webserver({
    open: true,
    livereload: true
  }))
);

gulp.task('deploy', ['deploy:clean', 'build'], () => gulp.src('dist/**/*')
  .pipe($.plumber())
  .pipe($.ghPages({
    remoteUrl: 'git@github.com:radio-modem/radio-modem.github.io.git',
    branch: 'master',
    cacheDir: '.tmp',
    force: true
  }))
  .pipe($.size({
    title: 'deploy'
  }))
);

gulp.task('deploy:clean', () => del(['.tmp']));
