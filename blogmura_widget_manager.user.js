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
// ==/UserScript==

    const APP_NAME = 'BlogmuraWidgetManager';

    const WidgetManager = class WidgetManager {
        static run(url){
            new WidgetManager(url).run();
        }

        constructor(url){
            console.time('constructor');
            this.parse(url);
            this.storage = StorageFactory.load(APP_NAME, this.scope);
            this.widgets = $class('widget');
            this.rightColumn = $last('#partition>tbody>tr>td');
            console.timeEnd('constructor');
        }

        parse(url) {
            console.time('parse()');
            let u = url.split('://').pop().split('/').filter(str => str.length > 0);

            if (u.length > 3) {
                throw new Error('unexpected url type.');
            }

            //detect category from subdomain
            let category = u.first.split('.').first;
            let context = (category === 'www') ? 'Top' : 'Category';

            //detect page
            let page = u.last.match(/\.html/) ?
                u.pop().replace(/\d*\.html$/, '') : 'index';

            //detect subcategory
            let subcategory = u.length == 1 ? '' : u.last;
            if (subcategory) context = 'Subcategory';

            if(!context) throw Error('WidgetManager: Page detect faild.');

            this.category = category;
            this.subcategory = subcategory;
            this.page = page;
            this.context = context;
            this.scope = [category, subcategory, page];

            console.timeEnd('parse()');
        }

        modifyWidgets(){
            console.time('modifyWidgets()');

            let storage = this.storage;
            this.widgets.each(function(widget, i) {
                Object.defineProperty(widget, 'STATUS', {
                    value: {EXPAND: 0, COLLAPSE: 1, CLOSE: 2,}
                });

                Object.defineProperties(widget, {
                    'status': {
                        writable: true,
                    },
                    'methodMap': {
                        value: {
                            [widget.STATUS.EXPAND]: 'expand',
                            [widget.STATUS.COLLAPSE]: 'collapse',
                            [widget.STATUS.CLOSE]: 'close',
                        }
                    },
                    'captions': {
                        value: {
                            [widget.STATUS.EXPAND]: '−',
                            [widget.STATUS.COLLAPSE]: '□',
                            [widget.STATUS.CLOSE]: '×',
                        }
                    },
                    'toggle': {
                        value: function(status) {
                            if(isBlank(status))
                                status = (this.status == this.STATUS.EXPAND) ?
                                    this.STATUS.COLLAPSE : this.STATUS.EXPAND;

                            widget.$all(
                                ['.widget-cont', '.widget-footer', '.list-inline', '.page-tab-nb'].join()
                            ).each(e => e[(status == this.STATUS.EXPAND ? 'show' : 'hide')]());

                            this.$('.toggle').innerText = this.captions[status];
                            this.status = status;
                        }
                    },
                    'expand': {
                        value: function(){ this.toggle(this.STATUS.EXPAND);}
                    },
                    'collapse': {
                        value: function(){ this.toggle(this.STATUS.COLLAPSE);}
                    },
                    'close': {
                        value: function(){
                            this.hide();
                            this.status = this.STATUS.CLOSE;
                        }
                    },
                    'changeStatus': {
                        value: function(status){this[this.methodMap[status]]();}
                    },
                });

                let toggleButton = $create('li');
                toggleButton.className = 'toggle';
                toggleButton.style.cursor = 'pointer';
                toggleButton.onclick = function(){
                    widget.toggle();
                    storage.save(i, widget.status);
                };

                let closeButton = $create('li');
                closeButton.className = 'close';
                closeButton.innerText = widget.captions[widget.STATUS.CLOSE];
                closeButton.style.cursor = 'pointer';
                closeButton.onclick = function(){
                    widget.close();
                    storage.save(i, widget.status);
                };

                let bar = widget.$('.widget-title-inner');
                let to = bar.$('ul') || bar.appendChild($create('ul'));
                to.appendChildren(toggleButton, closeButton);
                //to.appendChild(closeButton);

                bar.style.cursor = 'pointer';
                bar.ondblclick = function(){ toggleButton.onclick();};
            });

            console.timeEnd('modifyWidgets()');
        }

        addConfigPanel(){
            console.time('addControllPanel()');

            let widgets = this.widgets;
            let rightColumn = this.rightColumn;
            let storage = this.storage;

            const zIndex = 20000;
            const color = {
                baseColor: [32,32,64],
                transparent: 1,
                getColor:function(ratio, transparent = this.transparent){
                    if (typeof ratio === 'number') ratio = [ratio, ratio, ratio];
                    let color = this.baseColor.map((c, i) => c * ratio[i]);
                    color.push(transparent);
                    return this.rgba(color.join());
                },
                rgba: colorStr => `rgba(${colorStr})`,
                get color(){return this.rgba(this.getColor(1/2));},
                get background(){return this.getColor([6,6,3]);},
                get bar(){return this.getColor(1);},
                get border(){return this.getColor(1);},
                get layer(){return this.rgba('128,255,128,0.5');},
            };

            let menu = $create('li');
            menu.innerText = 'ウィジェット設定';
            menu.className = 'list-info';
            menu.style.cursor = 'pointer';
            $id('header-navi').insertBefore(menu, $id('header-navi').firstChild);

            menu.addEventListener('click', function(){
                let body = document.body;
                body.style.position = 'relative';

                let layer = $create('div');
                layer.className = 'layer';

                ({position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: color.layer,
                  zIndex: zIndex,
                 }).each((v, k) => layer.style[k] = v);

                let boxWidth = 600;
                let boxHeight = 400;
                let box = $create('div');
                box.id = 'WidgetManagerControlPanel';
                ({
                    position: 'absolute',
                    top: window.innerHeight/2-(boxHeight/2)+'px',
                    left: body.clientWidth/2-boxWidth/2+'px',
                    width: boxWidth+'px',
                    height: boxHeight+'px',
                    borderRadius: '7px',
                    border: `4px ${color.border} solid`,
                    color: color.color,
                    backgroundColor: color.background,
                    padding: 0,
                    zIndex: zIndex+1,
                    overflowY: 'auto',
                }).each((v, k) => box.style[k] = v);

                let bar = $create('p');
                bar.innerText = APP_NAME+' 設定';
                ({margin: 0,
                  padding:'4px 12px',
                  borderBottom: `4px ${color.border} solid`,
                  backgroundColor: color.bar,
                  color: 'white',
                 }).each((v, k) => bar.style[k] = v);

                let closeCaption = $create('span');
                closeCaption.innerText = '×';
                closeCaption.addEventListener('click', () => body.removeChild(layer));
                ({position: 'absolute',
                  right: '10px',
                  cursor: 'pointer',
                  fontSize: '120%',
                 }).each((v, k) => closeCaption.style[k] = v);

                let panel = $create('div');
                ({
                    position: 'absolute',
                    padding: '12px',
                    width: boxWidth-24+'px',
                    height: boxHeight-100+'px',
                    overflowY: 'auto',
                }).each((v, k) => panel.style[k] = v);

                let table = $create('table');
                let tr = $create('tr');
                tr.style.padding = '6px 12px';

                let td = $create('td');
                td.innerText = '右カラムを隠す';

                let checkBox = $create('input');
                checkBox.type = 'checkbox';
                checkBox.checked = storage.get('rc') == 1;
                checkBox.addEventListener('change', function(){
                    rightColumn[this.checked ? 'hide' : 'show']();
                    storage.save('rc', this.checked ? 1 : 0);
                });

                table.appendChild(tr).appendChild(td).appendChild(checkBox);

                widgets.each(function(widget, i){
                    let title = widget.$('.widget-title-inner>h3').innerText ||
                        widget.$('.widget-title-inner>h3>a').innerText;

                    let select = $create('select');
                    select.id = 'widgetStatus'+i;
                    select.style.marginLeft = '12px';

                    widget.STATUS.each((value, key) => {
                        let option = $create('option');
                        option.value = value;
                        option.innerText = key.toLowerCase();
                        select.appendChild(option);
                    });

                    select.addEventListener('change', function(){
                        let status = this.options[this.selectedIndex].value;
                        widget.changeStatus(status);
                        storage.save(i, status);
                    });

                    select.selectedIndex = widget.status;

                    let row = $create('tr');
                    row.style.padding = '6px 12px';

                    let cell1 = $create('td');
                    cell1.innerText = title;

                    let cell2 = $create('td');
                    cell2.appendChild(select);

                    panel.appendChild(table).appendChild(row).appendChildren(cell1, cell2);
                });

                body.appendChild(layer).appendChild(box);
                box.appendChild(bar).appendChild(closeCaption);
                box.appendChild(panel);
            });

            console.timeEnd('addControllPanel()');
        }

        load(){
            console.time('load()');

            let storage = this.storage;

            this.widgets.each((widget, i) => {
                widget.changeStatus(
                    !Object.isBlank(storage.get(i)) ? storage.get(i) : widget.STATUS.EXPAND
                );
            });

            if(storage.get('rc')) this.rightColumn.hide();

            console.timeEnd('load()');
        }

        run(url){
            console.time('run()');

            this.modifyWidgets();
            this.addConfigPanel();
            this.load();

            console.timeEnd('run()');
            log('Done.');
        }
    };


    WidgetManager.run(location.href);

})();











