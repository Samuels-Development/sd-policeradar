fx_version 'cerulean'
games { 'gta5' }

author 'Made with Love by Samuel0008'
description 'Police Radar for FiveM'
version '2.0.2'

ui_page 'web/build/index.html'

files {
    'web/build/index.html',
    'web/build/assets/*.js',
    'web/build/assets/*.css',
    'web/build/plates/*.png'
}

client_scripts { 'config.lua', 'client.lua' }

shared_scripts { '@ox_lib/init.lua' }
