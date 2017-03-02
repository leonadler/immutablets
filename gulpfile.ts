import * as del from 'del';
const gulp = require('gulp');
import * as mocha from 'gulp-mocha';
import * as sourcemaps from 'gulp-sourcemaps';
import { createProject as createTypescriptProject } from 'gulp-typescript';
import { log, colors } from 'gulp-util';
import * as merge2 from 'merge2';
import { install as installSourceMapSupport } from 'source-map-support';
installSourceMapSupport();


gulp.task('clean', clean);
gulp.task('build', gulp.series(buildES5, buildES6));
gulp.task('test', test);
gulp.task('watch', gulp.series(clean, buildES5, test, watch));


const es5project = createTypescriptProject('tsconfig.es5.json', {
    typescript: require('typescript')
});

const es6project = createTypescriptProject('tsconfig.es6.json', {
    typescript: require('typescript')
});


function clean() {
    return del(['es5/**', '!es5', 'es6/**', '!es6', 'declarations/**', '!declarations']);
}

function buildES5() {
    return buildTypescript(es5project, 'es5');
}

function buildES6() {
    return buildTypescript(es6project, 'es6');
}

function buildTypescript(tsProject: any, destination: string) {
    const tsResult = gulp
        .src(['src/**/*.ts', '!src/**/*.spec.*'])
        .pipe(sourcemaps.init())
        .pipe(tsProject());
    return merge2(
        tsResult.dts
            .pipe(gulp.dest('declarations')),
        tsResult.js
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(destination))
    );
}

function watch() {
    gulp.watch(['src/**', '!src/**/*.spec.ts'], gulp.series(test, buildES5, buildES6));
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

gulp.task('default', gulp.series(clean, buildES5, buildES6, test));


process.on('SIGINT', () => {
    process.exit();
    process.kill(process.pid);
});
