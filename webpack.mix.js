const mix = require('laravel-mix');

mix.copy('node_modules/bootstrap/dist/css/bootstrap.min.css', 'app/lib/bootstrap/dist/css/bootstrap.min.css')
    .copy('node_modules/jquery-confirm/dist/jquery-confirm.min.css', 'app/lib/jquery-confirm2/dist/jquery-confirm.min.css')
    .copy('node_modules/font-roboto/dist', 'app/lib/font-roboto/dist')
    .copy('node_modules/fullcalendar/dist/fullcalendar.min.css', 'app/lib/fullcalendar/dist/fullcalendar.min.css')
    
    .copy('node_modules/bootstrap/dist/js/bootstrap.min.js', 'app/lib/bootstrap/dist/js/bootstrap.min.js')
    .copy('node_modules/jquery-confirm/dist/jquery-confirm.min.js', 'app/lib/jquery-confirm2/dist/jquery-confirm.min.js')
    .copy('node_modules/jquery-scroll-lock/jquery-scrollLock.min.js', 'app/lib/jquery-scrollLock/jquery-scrollLock.min.js')
    .copy('node_modules/jquery/dist/jquery.min.js', 'app/lib/jquery/dist/jquery.min.js')
    .copy('node_modules/moment/moment.js', 'app/lib/moment/moment.js')
    .copy('node_modules/tether/dist/js/tether.min.js', 'app/lib/tether/dist/js/tether.min.js')
    .copy('node_modules/fullcalendar/dist/fullcalendar.min.js', 'app/lib/fullcalendar/dist/fullcalendar.min.js')
    .copy('node_modules/crel/crel.min.js', 'app/lib/crel/crel.min.js')
    .copy('node_modules/salvattore/dist/salvattore.js', 'app/lib/salvattore/dist/salvattore.js')
    .combine([
        'node_modules/datejs/src/core/i18n.js', 
        'node_modules/datejs/src/core/core.js', 
        'node_modules/datejs/src/core/core-prototypes.js', 
        'node_modules/datejs/src/core/sugarpak.js', 
        'node_modules/datejs/src/core/format_parser.js', 
        'node_modules/datejs/src/core/parsing_operators.js', 
        'node_modules/datejs/src/core/parsing_translator.js', 
        'node_modules/datejs/src/core/parsing_grammar.js', 
        'node_modules/datejs/src/core/parser.js', 
        'node_modules/datejs/src/core/extras.js', 
        'node_modules/datejs/src/core/time_period.js', 
        'node_modules/datejs/src/core/parser.js', 
        'node_modules/datejs/src/core/time_span.js', 
    ], 'app/lib/date.js/build/date.js')
