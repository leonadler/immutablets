'use strict';

import del = require('del');
const gulp = require('gulp');
import mocha = require('gulp-mocha');
import sourcemaps = require('gulp-sourcemaps');
import ts = require('gulp-typescript');
import { log, colors } from 'gulp-util';
import { install as installSourceMapSupport } from 'source-map-support';
installSourceMapSupport();


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
    gulp.watch(['src/**', '!src/**/*.spec.ts'], gulp.series(test, build));
    gulp.watch(['src/**/*.spec.ts'], gulp.series(test));
}

function test() {
    const watching = process.argv.some(arg => arg === 'watch');
    process.exitCode = 0;

    return gulp.src(['src/**/*.spec.ts'])
        .pipe(mocha({
            reporter: watching ? 'min' : 'spec'
        }))
        .on('error', function (error: Error) {
            if (error.name === 'TSError') {
                log(colors.red(error.message));
            } else if (!/^\s*\d+ tests? failed./.test(error.message)) {
                log(colors.red(error.toString()));
            }
            process.exitCode = 1;
            this.emit('end');
        });
}

gulp.task('default', gulp.series(build, test));

process.on('SIGINT', () => {
    process.exit();
    process.kill(process.pid);
});
