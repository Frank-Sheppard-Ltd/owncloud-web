import vue from 'rollup-plugin-vue'
import resolve from 'rollup-plugin-node-resolve'
import json from '@rollup/plugin-json'
import commonjs from '@rollup/plugin-commonjs'
import babel from 'rollup-plugin-babel'
import builtins from '@erquhart/rollup-plugin-node-builtins'
import copy from 'rollup-plugin-copy-watch'
import modify from 'rollup-plugin-modify'
import {terser} from 'rollup-plugin-terser'
import visualizer from 'rollup-plugin-visualizer'
import * as path from 'path'
import del from 'rollup-plugin-delete'
import * as fs from 'fs'
import gzip from 'rollup-plugin-gzip'
import ejs from 'ejs'
import * as _ from 'lodash'
import progress from 'rollup-plugin-progress'
import postcss from 'rollup-plugin-postcss'
import serve from 'rollup-plugin-serve'
import html from '@rollup/plugin-html'

const production = !process.env.ROLLUP_WATCH

const plugins = [
    del({
        runOnce: true,
        targets: path.join('dist', '*'),
        dot: true
    }),
    postcss({
        extract: path.join('css', 'web.css'),
        minimize: production,
    }),
    vue({
        css: false
    }),
    builtins(),
    json(),
    resolve({
        include: 'node_modules/**',
        preferBuiltins: true
    }),
    babel({
        exclude: 'node_modules/**'
    }),
    modify({
        'process.env.NODE_ENV': JSON.stringify('production'),
        /* todo: remove after pending PR is merged */
        /* fix for 'assignment to undeclared variable dav' in davclient.js/lib/client.js 6:0 */
        "if (typeof dav === 'undefined') { dav = {}; }": 'var dav = dav || {}',
        /* todo: add something like crypto-browserify as a crypto replacement which is node only */
        /* crypto is not available, even if it's build with polyfill in src repo. */
        'n.pbkdf2Sync(e,r,s,i.HASH_LENGTH,t).toString(i.DIGEST_VALUE)': 1
    }),
    commonjs({
        include: 'node_modules/**'
    }),
    copy({
        watch: !production && './config',
        targets: [
            {src: './packages/web-container/img', dest: 'dist'},
            {src: './packages/web-container/themes', dest: 'dist'},
            {src: './packages/web-container/oidc-callback.html', dest: 'dist'},
            {src: './packages/web-container/oidc-silent-redirect.html', dest: 'dist'},
            {src: './packages/web-container/manifest.json', dest: 'dist'},
            {src: `./config/${production ? 'config.dist.json' : 'config.json'}`, dest: 'dist'},
            {src: 'node_modules/requirejs/require.js', dest: 'dist/js'},
        ]
    }),
    html({
        title: 'ownCloud',
        attributes: {
            html: {lang: 'en'},
            link: [],
            script: []
        },
        meta: [
            {
                charset: 'utf-8'
            },
            {
                name: 'viewport',
                content: 'initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no'
            },
            {
                name: 'theme-color',
                content: '#375f7E'
            },
            {
                'http-equiv': 'x-ua-compatible',
                content: 'IE=11'
            },
        ],
        template: ({attributes, files, meta, publicPath, title}) => {
            return new Promise((resolve, reject) => {
                ejs.renderFile(
                    './packages/web-container/index.html.ejs',
                    {
                        helpers: {
                            makeHtmlAttributes: html.makeHtmlAttributes
                        },
                        data: {
                            attributes,
                            meta,
                            publicPath,
                            title,
                            files,
                            bundle: Object.keys(files).reduce((acc, c) => {
                                if (!Object.hasOwnProperty.call(acc, c)) {
                                    acc[c] = {}
                                }
                                files[c].forEach(f => {
                                    const fp = path.parse(f.fileName)
                                    acc[c][
                                        production
                                            ? fp.name.substr(0, fp.name.lastIndexOf('-')) || fp.name
                                            : fp.name
                                        ] = c === 'js' ? fp.name : f.fileName
                                })

                                return acc
                            }, {}),
                            roots: {
                                css: 'css',
                                js: 'js',
                            }
                        }
                    },
                    {},
                    (err, html) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(html)
                        }
                    }
                )
            })
        }
    }),
    progress(),
]

if (production) {
    plugins.push(terser())
}

if (process.env.SERVER === 'true') {
    plugins.push(serve({
        contentBase: ['dist'],
        port: process.env.PORT || 9100
    }))
}

if (process.env.REPORT === 'true') {
    plugins.push(visualizer({
        filename: path.join('dist', 'report.html')
    }))
}

if (production) {
    plugins.push(gzip())
}

export default {
    input: fs.readdirSync('packages').reduce((acc, i) => {
        const p = path.join('packages', i, 'src', 'index.js')
        if (fs.existsSync(p)) {
            acc[i] = p
        }
        return acc
    }, {}),
    output: {
        dir: 'dist',
        format: 'amd',
        chunkFileNames: path.join(
            'js',
            '_chunks',
            production ? '[name]-[hash].js' : '[name].js'
        ),
        entryFileNames: path.join('js', production ? '[name]-[hash].js' : '[name].js')
    },
    manualChunks: id => {
        if (id.includes('node_modules')) {
            return 'vendor'
        }
    },
    onwarn: warning => {
        if (warning.code !== 'CIRCULAR_DEPENDENCY') {
            console.error(`(!) ${warning.message}`)
        }
    },
    plugins,
}
