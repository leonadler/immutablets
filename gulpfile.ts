'use strict';

import del = require('del');
const gulp: any = require('gulp');
import mocha = require('gulp-mocha');
import sourcemaps = require('gulp-sourcemaps');
import ts = require('gulp-typescript');
require('source-map-support').install({});


gulp.task('clean', clean);
gulp.task('build', build);
gulp.task('test', test);
gulp.task('watch', gulp.series(clean, build, test, watch));

const tsProject = ts.createProject('tsconfig.json', {
    typescript: require('typescript'),
    rootDir: 'src'
});


function clean() {
    return del(['dist/**', '!dist']);
}

function build() {
    return gulp.src(['src/**/*.ts', '!src/**/*.spec.ts'])
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
}

function watch() {
    gulp.watch(['src/**', '!src/**/*.spec.ts'], gulp.series(build));
    gulp.watch(['src/**'], gulp.series(test));
}

function test() {
    const watching = process.argv.some(arg => arg === 'watch');
    return gulp.src(['src/**/*.spec.ts'])
        .pipe(mocha({
            reporter: watching ? 'min' : 'spec'
        }))
        .on('error', function () {
            process.exitCode = 1;
            this.emit('end');
        });
}

gulp.task('default', gulp.series(build, test));

process.on('SIGINT', () => {
    process.exit();
    process.kill(process.pid);
});
