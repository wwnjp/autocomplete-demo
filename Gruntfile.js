    var path      = require('path'),
    fs        = require('fs');



module.exports = function (grunt) {

    // TODO: Make this more manageable with suffixes outside somehow.
    var __paths = {
        src: {
            scripts: "./src/script/**/*.js",
            style: './src/style/**',
            fonts: './src/style/fonts/',
            images: './src/style/img/',
            scss: './src/style/scss/settings.scss',
            content: './src/content',
            contentDir: './src/content/**'
        },
        dst: {
            fonts: './dist/style/fonts/',
            images: './dist/style/img/',
            script: './dist/script/',
            scriptMap: './dist/script/<%=pkg.name%>.js.map',
            cssdir: './dist/style/',
            css: './dist/style/<%=pkg.name%>.css',
            scss: './dist/style/scss/<%=pkg.name%>.scss',
            content: './dist/',
            temp: './dist/temp/'
        }
    };



    var minFileName = __paths.dst.script + '<%=pkg.name%>.min.js';
    var pkgFileName = minFileName.replace(/.min.js$/, ".js");

    var config = {
        'pkg': grunt.file.readJSON('package.json'),

        'cssmin': {
            options: {
                sourceMap: true,
                processImport: false,
                keepSpecialComments: 0
            },
            target: {
                files: [{
                    expand: true,
                    cwd: __paths.dst.cssdir,
                    src: ['*.compressed.css', '!*.min.css'],
                    dest: __paths.dst.cssdir,
                    ext: '.min.css'
                }]
            }
        },


        'copy': {
            main: {
                files: [
                    {expand: true, cwd: __paths.src.content, src: ['**/*.js'], dest: __paths.dst.content},
                    {expand: true, cwd: __paths.src.fonts, src: ['**'], dest: __paths.dst.fonts},
                    {expand: true, cwd: __paths.src.images, src: ['**'], dest: __paths.dst.images}
                ]
            }
        },

        'sass': {
            dist: {
                files: {}
            }
        },

        'htmlmin': {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    'dist/index.html': 'src/content/index.html'
                }
            }
        },

        'concat': {
            'dist': {
                'src': [__paths.src.scripts],
                'dest': pkgFileName
            }
        },

        'watch': {
            scripts: {
                files: __paths.src.scripts,
                tasks: ['scripts'],
                options: {interrupt: true}
            },
            style: {
                files: __paths.src.style,
                tasks: ['style'],
                options: {interrupt: true}
            },
            content: {
                files: __paths.src.contentDir,
                tasks: ['htmlmin'],
                options: {interrupt: true}
            }
        },

        'uglify': {
            'options': {
                'sourceMap': __paths.dst.scriptMap
            },
            'dist': {
                'files': {}
            }
        },

        'css_selectors': {
            options: {
            },
            'dist': {
                'files': {
                    'dist/style/autocomplete.compressed.css': ['dist/style/autocomplete.css']
                }
            }
        },

        'clean': {
            js: [__paths.dst.script],
            style: [__paths.dst.cssdir],
            temp: [__paths.dst.temp]
        }
    };


    config.uglify.dist.files[minFileName] = pkgFileName;
    config.sass.dist.files[__paths.dst.css] = __paths.src.scss;

    grunt.initConfig(config);
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-css-selectors');

    grunt.registerTask('style', ['copy', 'sass', 'htmlmin']);

    grunt.registerTask('scripts', ['concat:dist', 'uglify']);

    // Compile and package code locally, while running tests at each step
    grunt.registerTask('build', ['style', 'concat', 'uglify']);
};