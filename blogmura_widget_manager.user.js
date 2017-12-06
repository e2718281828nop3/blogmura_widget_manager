(function() {

    'use strict';

// ==UserScript==
// @name         Blogmura Widget Manager
// @namespace    https://github.com/e2718281828nop3/
// @version      0.1
// @description  manage blogmura widgets
// @author       e2718281828nop3
// @copyright    2017, e2718281828nop3 (https://github.com/e2718281828nop3/)
// @license      GPL-3.0
// @match        http*://*.blogmura.com/*
// @require      https://github.com/e2718281828nop3/javascripts/raw/master/utilities/ext/object.js
// @require      https://github.com/e2718281828nop3/javascripts/raw/master/utilities/ext/array.js
// @require      https://github.com/e2718281828nop3/javascripts/raw/master/utilities/ext/dom.js
// @require      https://github.com/e2718281828nop3/javascripts/raw/master/utilities/class/storage.js
// @require      https://github.com/e2718281828nop3/blogmura_widget_namager/raw/master/widget_manager.js
// ==/UserScript==

    const APP_NAME = 'BlogmuraWidgetManager';

    WidgetManager.run(location.href, APP_NAME);

})();











