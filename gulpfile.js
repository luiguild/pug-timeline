'use strict';

const gulp = require('gulp'),
nameDeps = require('app-name'),
loadDeps = require('load-deps'),
camelCase = require('camelcase'),
stripDeps = ['gulp'],
pug = require('gulp-pug');

let renameDeps = function renameFn(name) {
    return camelCase(nameDeps(name, stripDeps));
};

let $ = loadDeps('*', {
    renameKey: renameDeps
});


///////////
// VARS //
//////////
const app = {
    name: "timeline"
};

const paths = {
    debug: 'dev/',
    production: 'dist/'
};

const server = {
    folder: paths.production,
    port: 8100,
    host: 'http://127.0.0.1',
    get address() {
        return this.host + ':' + this.port
    }
};

const files = {
    sass: {
        src: paths.debug + 'sass/' + app.name + '.sass',
        dest: paths.production + 'css',
        debug: paths.debug + 'sass/**/*.sass',
        production: paths.production + 'css/' + app.name + '.min.css',
    },
    templates: {
        src: paths.debug + 'pug/index.pug',
        dest: paths.production + 'templates',
        debug: paths.debug + 'pug/**',
        production: paths.production + 'index.html'
    },
    extras: {
        css: {
            src: paths.debug + 'css/**/**',
            dest: paths.production + 'css'
        },
        design: {
            src: paths.debug + 'design/**',
            dest: paths.production + 'design',
            debug: paths.debug + 'design/**',
            production: paths.production + 'design/**'
        }
    }
};

const pugPattern = [paths.debug + 'pug/**/*.pug', '!' + paths.debug + 'pug/index.pug', '!' + paths.debug + 'pug/includes/**'];
const liveServer = $.liveServer.static(server.folder, server.port);

///////////
// SERVE //
///////////
gulp.task('serve', function (cb) {
    $.runSequence('build', 'start:server', cb);
});

gulp.task('start:server', function(done) {
    liveServer.start();
    try {
        liveServer.start.apply(liveServer);
    } catch (e) {
        liveServer.start.bind(liveServer);
    }
    setTimeout(function(){
        $.runSequence('watch');
        $.openurl.open(server.address);
    }, 300);
});


///////////
// WATCH //
///////////
gulp.task('watch', function () {
    gulp.watch([files.templates.debug], function (file) {
        $.runSequence('make:pug');

        gulp.watch([files.templates.production], function (file) {
            liveServer.notify.apply(liveServer, [file]);
        });
    });

    gulp.watch([files.sass.debug], function (file) {
        $.runSequence('make:sass');

        gulp.watch([files.sass.production], function (file) {
            liveServer.notify.apply(liveServer, [file]);
        });
    });

    gulp.watch([files.extras.css.src], function (file) {
        $.runSequence('copy:css');

        gulp.watch([files.extras.css.dest], function (file) {
            liveServer.notify.apply(liveServer, [file]);
        });
    });

    gulp.watch([files.extras.design.debug], function (file) {
        $.runSequence('copy:design');

        gulp.watch([files.extras.design.production], function (file) {
            liveServer.notify.apply(liveServer, [file]);
        });
    });
});


///////////
// TASKS //
///////////
gulp.task('make:pug', function (cb) {
    $.pump([
        gulp.src(files.templates.src),
        pug(),
        gulp.dest(paths.production)
    ],
    [
        gulp.src(pugPattern),
        pug(),
        gulp.dest(files.templates.dest)
    ], cb);
});

gulp.task('make:sass', function(cb) {
    $.pump([
        gulp.src(files.sass.src),
        $.sass().on('error', $.sass.logError),
        $.csscomb(),
        $.cssbeautify({
            indent: '    ',
            openbrace: 'end-of-line',
            autosemicolon: true
        }),
        $.autoprefixer(),
        $.cleanCss({
            compatibility: 'ie8',
            keepSpecialComments: 0
        }),
        $.rename(function (path) {
            path.basename += '.min';
        }),
        gulp.dest(files.sass.dest)
    ], cb);
});

gulp.task('copy:css', function (cb) {
    $.pump([
        gulp.src(files.extras.css.src),
        gulp.dest(files.extras.css.dest)
    ], cb);
});

gulp.task('copy:design', function (cb) {
    $.pump([
        gulp.src(files.extras.design.src),
        gulp.dest(files.extras.design.dest)
    ], cb);
});


///////////
// BUILD //
///////////
gulp.task('default', ['build']);

gulp.task('build', function () {
    $.runSequence('make:pug', 'make:sass', 'copy');
});

gulp.task('copy', function () {
    $.runSequence('copy:design', 'copy:css');
});
