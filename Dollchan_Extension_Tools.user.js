// ==UserScript==
// @name		Dollchan Extension Tools
// @version		2010-09-30
// @namespace	http://freedollchan.org/scripts
// @author		Sthephan Shinkufag @ FreeDollChan
// @copyright	(C)2084, Bender Bending Rodríguez
// @description	Doing some profit for imageboards
// @include		*www.0chan.ru*
// @include		*2-ch.ru*
// @include		*iichan.ru*
// @include		*dobrochan.ru*
// @include		*410chan.ru*
// @include		*wakachan.org*
// @include		*nowere.net*
// @include		*sibirchan.ru*
// @include		*samechan.ru*
// @include		*horochan.ru*
// @include		*ne2.ch*
// @include		*4chan.org*
// ==/UserScript==

(function() {
var defaultCfg = [
	1,		// 0	antiwipe detectors:
	1,		// 1		same lines
	1,		// 2		same words
	1,		// 3		specsymbols
	1,		// 4		long columns
	1,		// 5		long words
	1,		// 6		numbers
	0,		// 7		cAsE/CAPS
	0,		// 8	hide posts with sage
	0,		// 9	hide posts with theme
	0,		// 10	hide posts without text
	0,		// 11	hide posts without img
	0,		// 12	hide posts by text size:
	500,	// 13		text size in symbols
	0,		// 14	hide posts by regexp
	0,		// 15	process hidden posts (0=off, 1=merge, 2=full hide)
	1,		// 16	mouseover hidden posts preview
	1,		// 17	additional hider menu
	1,		// 18	apply filter to threads
	2,		// 19	upload new posts (0=off, 1=by click, 2=auto)
	1,		// 20	format buttons(0=off, 1=graph, 2=text, 3=standart)
	1,		// 21	expand images (0=off, 1=simple, 2=+preview)
	2,		// 22	>>links navigation (0=off, 1=no map, 2=+refmap)
	1,		// 23	reply without reload (verify on submit)
	1,		// 24	YouTube player
	1,		// 25	mp3 player
	1,		// 26	expand shorted posts
	0,		// 27	hide post names
	1,		// 28	hide scrollers in posts
	1,		// 29	open spoilers
	1,		// 30	email field -> sage btn
	0,		// 31	reply with SAGE
	0,		// 32	move postform down
	2,		// 33	2-ch captchas (x0,x1,x2)
	0,		// 34	apply user name:
	'',		// 35		user name value
	0,		// 36	apply user password:
	'',		// 37		user password value
	1,		// 38	hide board rules
	1,		// 39	hide 'goto' field
	1,		// 40	hide password field
	530,	// 41	textarea width
	140,		// 42	textarea height
	1,		// 43	auto upload interval
	1,		// 44	error alerts on auto upload
	0		// 45	move format buttons down
],
Cfg = [],
Visib = [],
Posts = [],
oPosts = [],
Expires = [],
postByNum = [],
ajaxPosts = {},
ajaxThrds = [],
refArr = [],
doc = document,
STORAGE_LIFE = 259200000; // 3 days

/*=============================================================================
									UTILS
=============================================================================*/

function $X(path, root) {
	return doc.evaluate(path, root || doc, null, 6, null);
}
function $x(path, root) {
	return doc.evaluate(path, root || doc, null, 8, null).singleNodeValue;
}
function $id(id) {
	return doc.getElementById(id);
}
function $n(name) {
	return doc.getElementsByName(name)[0];
}
function $next(el) {
	do el = el.nextSibling;
	while(el && el.nodeType != 1);
	return el;
}
function $prev(el) {
	do el = el.previousSibling;
	while(el && el.nodeType != 1);
	return el;
}
function $up(el, i) {
	if(!i) i = 1;
	while(i--) el = el.parentNode;
	return el;
}
function $1(el) {
	return el.firstChild;
}
function $each(list, fn) {
	if(!list) return;
	var i = list.snapshotLength;
	if(i > 0) while(i--) fn(list.snapshotItem(i), i);
}
function $html(el, html) {
	var cln = el.cloneNode(false);
	cln.innerHTML = html;
	el.parentNode.replaceChild(cln, el);
	return cln;
}
function $attr(el, attr) {
	for(var key in attr) {
		if(key == 'html') {el.innerHTML = attr[key]; continue}
		if(key == 'text') {el.textContent = attr[key]; continue}
		if(key == 'value') {el.value = attr[key]; continue}
		el.setAttribute(key, attr[key]);
	}
	return el;
}
function $event(el, events) {
	for(var key in events)
		el.addEventListener(key, events[key], false);
}
function $rattr(el, attr) {
	if(!nav.Opera) {
		if(el.getAttribute(attr)) el.removeAttribute(attr);
	} else if(el[attr]) el[attr] = '';
}
function $revent(el, events) {
	for(var key in events)
		el.removeEventListener(key, events[key], false);
}
function $append(el, childs) {
	for(var i = 0, len = childs.length, child; i < len; i++) {
		child = childs[i];
		if(child) el.appendChild(child);
	}
}
function $before(el, inserts) {
	for(var i = 0, len = inserts.length; i < len; i++)
		if(inserts[i]) el.parentNode.insertBefore(inserts[i], el);
}
function $after(el, inserts) {
	var i = inserts.length;
	while(i--) if(inserts[i]) el.parentNode.insertBefore(inserts[i], el.nextSibling);
}
function $new(tag, attr, events) {
	var el = doc.createElement(tag);
	if(attr) $attr(el, attr);
	if(events) $event(el, events);
	return el;
}
function $New(tag, childs, attr, events) {
	var el = $new(tag, attr, events);
	$append(el, childs);
	return el;
}
function $txt(el) {
	return doc.createTextNode(el);
}
function $if(cond, el) {
	if(cond) return el;
}
function $disp(el) {
	el.style.display = (el.style.display != 'none') ? 'none' : '';
}
function $del(el) {
	if(el) el.parentNode.removeChild(el);
}
function delNexts(el) {
	while(el.nextSibling) $del(el.nextSibling);
}
function delChilds(el) {
	while(el.hasChildNodes()) el.removeChild($1(el));
}
function $close(el) {
	if(!el) return;
	var h = el.clientHeight - 18;
	el.style.height = h +'px';
	var i = 9;
	var closing = setInterval(function() {
		var s = el.style;
		s.opacity = i--/10;
		s.paddingTop = parseInt(s.paddingTop) - 1 + 'px';
		s.paddingBottom = parseInt(s.paddingBottom) - 1 + 'px';
		var hh = parseInt(s.height) - h/10;
		s.height = (hh < 0 ? 0 : hh) + 'px';
		if(i < 1) {$del(el); clearInterval(closing)}
	}, 30);
}
function $show(el) {
	var i = 1;
	var showing = setInterval(function() {
		var s = el.style;
		s.opacity = i/10;
		s.paddingTop = parseInt(s.paddingTop) + 1 + 'px';
		s.paddingBottom = parseInt(s.paddingBottom) + 1 + 'px';
		if(i++ > 9) clearInterval(showing);
	}, 30);
}
function toggleChk(box) {
	box.checked = !box.checked;
}
function getOffset(a, b) {
	var c = 0;
	while (a) {c += a[b]; a = a.offsetParent}
	return c;
}
function rand10() {
	return Math.floor(Math.random()*1e10).toString(10);
}
function incc(arr, w) {
	if(arr[w]) arr[w] += 1;
	else arr[w] = 1;
}
function InsertInto(x, text) {
	var start = x.selectionStart;
	var end = x.selectionEnd;
	x.value = x.value.substr(0, start) + text + x.value.substr(end);
	x.setSelectionRange(start + text.length, start + text.length);
	x.focus();
}
String.prototype.trim = function() {
	var str = this.replace(/^\s\s*/, '');
	var i = str.length;
	while(/\s/.test(str.charAt(--i)));
	return str.substring(0, i + 1); 
};
function txtSelection() {
	return nav.Opera ? doc.getSelection() : window.getSelection().toString();
}

var jsonParse = function() {var u={'"':'"','/':'/','\\':'\\','b':'\b','f':'\f','n':'\n','r':'\r','t':'\t'};function v(h,j,e){return j?u[j]:String.fromCharCode(parseInt(e,16))}var w=new String(""),x=Object.hasOwnProperty;return function(h,j){h=h.match(new RegExp('(?:false|true|null|[\\{\\}\\[\\]]|(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)|(?:\"(?:[^\\0-\\x08\\x0a-\\x1f\"\\\\]|\\\\(?:[\"/\\\\bfnrt]|u[0-9A-Fa-f]{4}))*\"))','g'));var e,c=h[0],l=false;if("{"===c)e={};else if("["===c)e=[];else{e=[];l=true}for(var b,d=[e],m=1-l,y=h.length;m<y;++m){c=h[m];var a;switch(c.charCodeAt(0)){default:a=d[0];a[b||a.length]=+c;b=void 0;break;case 34:c=c.substring(1,c.length-1);if(c.indexOf('\\')!==-1)c=c.replace(new RegExp('\\\\(?:([^u])|u(.{4}))','g'),v);a=d[0];if(!b)if(a instanceof Array)b=a.length;else{b=c||w;break}a[b]=c;b=void 0;break;case 91:a=d[0];d.unshift(a[b||a.length]=[]);b=void 0;break;case 93:d.shift();break;case 102:a=d[0];a[b||a.length]=false;b=void 0;break;case 110:a=d[0];a[b||a.length]=null;b=void 0;break;case 116:a=d[0];a[b||a.length]=true;b=void 0;break;case 123:a=d[0];d.unshift(a[b||a.length]={});b=void 0;break;case 125:d.shift();break}}if(l){if(d.length!==1)throw new Error;e=e[0]}else if(d.length)throw new Error;if(j){var p=function(n,o){var f=n[o];if(f&&typeof f==="object"){var i=null;for(var g in f)if(x.call(f,g)&&f!==n){var q=p(f,g);if(q!==void 0)f[g]=q;else{i||(i=[]);i.push(g)}}if(i)for(g=i.length;--g>=0;)delete f[i[g]]}return j.call(n,o,f)};e=p({"":e},"")}return e}}();

function Log(txt) {
	var newTime = (new Date()).getTime();
	timeLog += '\n' + txt + ': ' + (newTime - oldTime).toString() + 'ms';
	oldTime = newTime;
}

/*=============================================================================
								STORAGE / CONFIG
=============================================================================*/

function setCookie(name, value, life) {
	if(name) doc.cookie = escape(name) + '=' + escape(value) + ';expires=' 
		+ (new Date((new Date()).getTime()
		+ (life == 'delete' ? -10 : STORAGE_LIFE))).toGMTString() + ';path=/';
}

function getCookie(name) {
	var arr = doc.cookie.split('; ');
	var i = arr.length;
	while(i--) {
		var one = arr[i].split('=');
		if(one[0] == escape(name)) return unescape(one[1]);
	}
}

function turnCookies(name) {
	var max = ch._0ch ? 10 : 15;
	var data = getCookie(ID('Cookies'));
	var arr = data ? data.split('|') : [];
	arr[arr.length] = name;
	if(arr.length > max) {
		setCookie(arr[0], '', 'delete');
		arr.splice(0, 1);
	}
	setCookie(ID('Cookies'), arr.join('|'));
}

function getStored(name) {
	if(sav.GM) return GM_getValue(name);
	if(sav.local) return localStorage.getItem(name);
	return getCookie(name);
}

function setStored(name, value) {
	if(sav.GM) {GM_setValue(name, value); return}
	if(sav.local) {localStorage.setItem(name, value); return}
	setCookie(name, value);
}

function ID(name, pNum) {
	var c = !sav.cookie ? '_' + domain : '';
	if(name == 'Posts' || name == 'Threads')
		return 'DESU_' + name + c + '_' + board + (!pNum ? '' : '_' + pNum);
	if(name == 'Config' || name == 'Cookies' || name == 'RegExpr')
		return 'DESU_' + name + c;
}

function setDefaultCfg() {
	Cfg = defaultCfg;
	setStored(ID('Config'), defaultCfg.join('|'));
}

function saveCfg(num, val) {
	Cfg[num] = val;
	setStored(ID('Config'), Cfg.join('|'));
}

function toggleCfg(num) {
	saveCfg(num, Cfg[num] == 0 ? 1 : 0);
}

function initCfg() {
	var data = getStored(ID('Config'));
	if(!data) setDefaultCfg();
	else Cfg = data.split('|');
	if(!getStored(ID('RegExpr')))
		setStored(ID('RegExpr'), '');
}

function getVisib(pNum) {
	var key = !sav.cookie ? board + pNum : postByNum[pNum].Count;
	if(key in Visib) return Visib[key];
}

function readPostsVisib() {
	if(!sav.cookie) {
		var data = getStored(ID('Posts'));
		if(!data) return;
		var arr = data.split('-');
		var i = arr.length/3;
		while(i--) {
			if((new Date()).getTime() < arr[i*3 + 2]) {
				Visib[arr[i*3]] = arr[i*3 + 1];
				Expires[arr[i*3]] = arr[i*3 + 2];
			} else setStored(ID('Posts'), arr.splice(i*3, 3).join('-'));
		}
	} else if(!main) {
		var data = getStored(ID('Posts', oPosts[0].Num));
		if(!data) return;
		for(var i = 0, len = data.length; i < len; i++)
			Visib[i + 1] = data[i];
	}
	forAll(function(post) {post.Vis = getVisib(post.Num)});
}

function storePostsVisib() {
	if(!sav.cookie) {
		var arr = [];
		for(var key in Visib)
			arr[arr.length] = key + '-' + Visib[key] + '-' + Expires[key];
		setStored(ID('Posts'), arr.join('-'));
	} else {
		if(!main) {
			var name = ID('Posts', oPosts[0].Num);
			if(!getStored(name)) turnCookies(name);
			setStored(name, Visib.join(''));
		}
	}
}

function readThreadsVisib() {
	var data = getStored(ID('Threads'));
	if(!data) return;
	var arr = data.split('-');
	var ar = [];
	var i = arr.length;
	while(i--) ar[arr[i]] = 1;
	forOP(function(post) {
		if(board + post.Num in ar) {
			hideThread(post);
			post.Vis = 0;
		}
	});
}

function storeThreadVisib(post, vis) {
	if(post.Vis == vis) return;
	post.Vis = vis;
	var key = board + post.Num;
	var data = getStored(ID('Threads'));
	var arr = data ? data.split('-') : [];
	if(vis == 0) {
		if(sav.cookie && arr.length > 80) arr.splice(0, 1);
		arr[arr.length] = key;
	} else {
		var i = arr.length;
		while(i--) if(arr[i] == key) arr.splice(i, 1);
	}
	setStored(ID('Threads'), arr.join('-'));
}

function storeFavorities(post) {
	var txt = getTitle(post).replace(/\|/g, '');
	txt = !sav.cookie ? txt.substring(0, 70) : txt.substring(0, 25);
	var pNum = post.Num;
	var data = getStored('DESU_Favorities');
	var arr = data ? data.split('|') : [];
	if(sav.cookie && arr.length/4 > 25) return;
	for(var i = 0; i < arr.length/4; i++)
		if(arr[i*4 + 1] == board && arr[i*4 + 2] == pNum) return;
	arr[arr.length] = (/www\./.test(location.hostname) ? 'www.' : '') + domain + '|'
		+ board + (/\/arch/.test(location.pathname) ? '/arch|' : '|') + pNum + '|' + txt;
	setStored('DESU_Favorities', arr.join('|'));
}

function removeFavorities(el) {
	var key = el.textContent.replace('arch/', '').replace('res/', '').split('/');
	var arr = getStored('DESU_Favorities').split('|');
	for(var i = 0; i < arr.length/4; i++)
		if(arr[i*4] == key[0] && arr[i*4 + 1].split('/')[0] == key[1] && arr[i*4 + 2] == key[2])
			arr.splice(i*4, 4);
	$del($up(el, 2));
	if(arr.length == 0)
		$1($id('favorities_div')).innerHTML = '<b>Избранные треды отсутствуют...</b>';
	setStored('DESU_Favorities', arr.join('|'));
}


/*=============================================================================
							CONTROLS / COMMON CHANGES
=============================================================================*/

function addControls() {
	var ctlBtn = function(val, events, id) {
		return $new('input', {'type': 'button', 'id': (id ? id : ''), 'value': val}, events);
	},
	chBox = function(num, txt, fn, id) {
		if(!fn) fn = toggleCfg;
		var box = $new('input', {'type': 'checkbox'}, {'click': function() {fn(num)}});
		box.checked = Cfg[num] == 1;
		if(id) box.id = id;
		return $New('span', [box, $txt(' ' + txt)]);
	},
	trBox = function(num, txt, fn, id) {
		return $New('tr', [chBox(num, txt, fn, id)]);
	},
	optSel = function(id, arr, num, fn) {
		for(var i = 0; i < arr.length; i++)
			arr[i] = '<option value="' + i + '">' + arr[i] + '</option>';
		var x = $new('select', {'id': id, 'html': arr.join('')}, {
			'change': (fn ? fn : function() {saveCfg(num, this.selectedIndex)})
		});
		x.selectedIndex = Cfg[num];
		return x;
	},
	tools = $new('tbody');
	$append(doc.body, [$new('div', {
		'id': 'DESU_alertbox',
		'style': 'position:fixed; z-index:9999; top:0; right:0; cursor:default; font:14px sans-serif'
	})]);
	$before(postarea || dForm, [$New('div', [
		ctlBtn('Настройки', {'click': function() {
			delChilds($id('hiddenposts_div'));
			delChilds($id('favorities_div'));
			$disp($id('controls_div'));
		}}),
		ctlBtn('Скрытое', {'click': hiddenPostsPreview}),
		ctlBtn('Избранное', {'click': favorThrdsPreview}),
		ctlBtn('Обновить', {
			'click': function(e) {window.location.reload(); e.stopPropagation(); e.preventDefault()},
			'mouseover': function() {if(main) selectAjaxPages()},
			'mouseout': function(e) {if(main) removeSelMenu(e.relatedTarget)}
		}, 'refresh_btn'),
		$if(main && pForm, ctlBtn('Создать тред', {'click': function() {
			$disp(postarea);
			$disp(!ch._4ch ? $prev(dForm) : $next(postarea));
		}})),
		$New('div', [$New('table',
			[tools], {
			'class': 'reply',
			'id': 'controls_div',
			'style': 'display:none; overflow:hidden; width:370px; min-width:370px; border:1px solid grey; margin:5px 0px 5px 20px; padding:5px; font:13px sans-serif',
		})]),
		$new('div', {'id': 'hiddenposts_div'}),
		$new('div', {'id': 'favorities_div'})
	], {'id': 'DESU_panel'}), $new('hr')]);
	$append(tools, [
		$new('tr', {
			'text': 'Dollchan Extension Tools',
			'style': 'width:100%; text-align:center; font-weight:bold; font-size:14px'
		}),
		$New('tr', [
			chBox(0, 'Анти-вайп детекторы '),
			$new('span', {
				'html': '[<a>&gt;</a>]',
				'style': 'cursor:pointer'}, {
				'click': function() {$disp($id('antiwipecfg'))}
			})
		]),
		$New('div', [
			trBox(1, 'Same lines'),
			trBox(2, 'Same words'),
			trBox(3, 'Specsymbols'),
			trBox(4, 'Long columns'),
			trBox(5, 'Long words'),
			trBox(6, 'Numbers'),
			trBox(7, 'CaSe/CAPS')
			], {
			'id': 'antiwipecfg',
			'style': 'display:none; padding-left:15px'
		}),
		$if(!(ch.iich || ch.sib), trBox(8, 'Скрывать с сажей ', toggleSage, 'sage_hider')),
		$if(!ch.sib, trBox(9, 'Скрывать с темой ', toggleTitle)),
		trBox(10, 'Скрывать без текста ', toggleNotext, 'notext_hider'),
		trBox(11, 'Скрывать без изображений ', toggleNoimage, 'noimage_hider'),
		$New('tr', [
			chBox(12, 'Скрывать с текстом более ', toggleMaxtext, 'maxtext_hider'),
			$new('input', {
				'type': 'text',
				'id': 'maxtext_field',
				'value': Cfg[13],
				'size': 4
			}),
			$txt(' символов')
		]),
		$New('tr', [
			chBox(14, 'Скрытие по выражениям: ', toggleRegexp, 'regexp_hider'),
			$new('span', {
				'html': '[<a>?</a>]',
				'style': 'cursor:pointer'}, {
				'click': function() {$alert('Поиск в тексте/теме поста:\nвыраж.1\nвыраж.2\n...\n\nРегулярные выражения: $exp выраж.\n$exp /[bб].[tт]+[hх].[rр][tт]/i\n$exp /кукл[оа]([её]б|бляд|быдл)/i\n\nКартинки: $img [<,>,=][вес][@ширxвыс]\n$img <35@640x480\n$img >@640x480\n$img =35\n\nИмя/трипкод: $name [имя][!трипкод][!!трипкод]\n$name Sthephan!ihLBsDA91M\n$name !!PCb++jGu\nЛюбой трипкод: $alltrip\n\nАвтозамена: $rep искомое заменяемое\n$rep /\:cf:/ig <img src="http://1chan.ru/img/coolface.gif" />\n$rep /(ху[йияеё])/ig <font color="red">beep</font>')}
			}),
			$new('input', {
				'type': 'button',
				'value': 'Применить',
				'style': 'float:right'}, {
				'click': function() {applyRegExp()}
			}),
			$new('br'),
			$new('textarea', {
				'id': 'regexp_field',
				'value': getStored(ID('RegExpr')),
				'rows': 7,
				'cols': 48,
				'style': 'font:12px courier new'
			})
		]),
		$New('tr', [
			optSel('prochidden_sel', ['Не изменять', 'Объединять', 'Удалять'], 15, function() {
				processHidden(this.selectedIndex, Cfg[15]);
			}),
			$txt(' скрытые посты')
		]),
		trBox(16, 'Быстрый просмотр скрытых постов'),
		trBox(17, 'Дополнительное меню по кнопке скрытия'),
		trBox(18, 'Применять фильтры к тредам'),
		$new('hr'),
		$New('tr', [
			optSel('upload_sel', ['Откл.', 'По клику', 'Авто'], 19),
			$txt(' подгрузка постов в треде, T='),
			optSel('upload_int', [0.5, 1, 1.5, 2, 5, 15, 30], 43),
			$txt('мин*')
		]),
		trBox(44, 'Уведомления подгрузки постов'),
		$if(pForm, $New('tr', [
			optSel('txtbtn_sel', ['Откл.', 'Графич.', 'Упрощ.', 'Станд.'], 20, function() {
				saveCfg(20, this.selectedIndex);
				$each($X('.//span[@id="txt_btns"]'), function(div) {$del(div)});
				if(Cfg[20] != 0) {
					textFormatPanel(pForm);
					if(qForm) textFormatPanel(qForm);
				}
			}), 
			$txt(' кнопки форматирования '),
			chBox(45, 'внизу ', function() {
				toggleCfg(45);
				if(Cfg[20] != 0) {
					textFormatPanel(pForm);
					if(qForm) textFormatPanel(qForm);
				}
			})
		])),
		$New('tr', [
			optSel('imgexp_sel', ['Не', 'Обычно', 'С превью'], 21),
			$txt(' раскрывать изображения')
		]),
		$New('tr', [
			optSel('refprv_sel', ['Откл.', 'Без карты', 'С картой'], 22),
			$txt(' навигация по >>ссылкам*')
		]),
		$if(!ch._4ch, trBox(23, 'Постить без перезагрузки (проверять ответ)*')),
		trBox(24, 'Плейер к YouTube ссылкам*'),
		trBox(25, 'Плейер к mp3 ссылкам*'),
		$if(wk, trBox(26, 'Раскрывать сокращенные посты*')),
		trBox(27, 'Скрывать имена в постах', function() {toggleCfg(27);scriptStyles()}),
		$if(ch._2ch, trBox(28, 'Без прокрутки в постах', function() {toggleCfg(28);scriptStyles()})),
		trBox(29, 'Раскрывать спойлеры', function() {toggleCfg(29);scriptStyles()}),
		$if(pfMail && hasSage, trBox(30, 'Sage вместо поля E-mail*')),
		$if(pForm, trBox(32, 'Форма ответа внизу*')),
		$if(ch._2ch, $New('tr', [
			$txt(' Количество капч* '),
			optSel('capnum_sel', [0, 1, 2], 33)
		])),
		$if(pfName, $New('tr', [
			$new('input', {'type': 'text', 'id': 'usrname_field', 'value': Cfg[35], 'size': 20}),
			chBox(34, ' Постоянное имя', function() {
				toggleCfg(34);
				saveCfg(35, $id('usrname_field').value.replace(/\|/g, ''));
				var val = ($id('usrname_box').checked) ? Cfg[35] : '';
				pfName.value = val;
				if(qForm) ($x('.//input[@name="nya1" or @name="akane" or @name="field1"]', qForm)
					|| $x('.//input[@name="name"]', qForm)).value = val;
			}, 'usrname_box')
		])),
		$if(pfPass, $New('tr', [
			$new('input', {'type': 'text', 'id': 'usrpass_field', 'value': Cfg[37], 'size': 20}),
			chBox(36, ' Постоянный пароль', function () {
				toggleCfg(36);
				saveCfg(37, $id('usrpass_field').value.replace(/\|/g, ''));
				var val = $id('usrpass_box').checked ? Cfg[37] : rand10().substring(0, 8);
				pfPass.value = val;
				del_passw.value = val;
				if(qForm) $x('.//input[@type="password"]', qForm).value = val;
			}, 'usrpass_box')
		])),
		$New('tr', [
			$txt('Не отображать: '),
			$if(pfRules, chBox(38, 'правила ', function() {toggleCfg(38); $disp(pfRules)})),
			$if(pfGoto, chBox(39, 'поле goto ', function() {toggleCfg(39);$disp(pfGoto)})),
			$if(pfPass, chBox(40, 'пароль ', function() {toggleCfg(40);$disp($up(pfPass, 2))}))
		]),
		$new('hr'),
		$New('tr', [
			$new('span', {
				'id': 'process_time',
				'title': 'v.2010-09-30, storage: ' 
					+ (sav.GM ? 'greasemonkey' : (sav.local ? 'localstorage' : 'cookies')),
				'style': 'font-style:italic; cursor:pointer'}, {
				'click': function() {$alert(timeLog)}
			}),
			$new('input', {
				'type': 'button',
				'value': 'Сброс настроек',
				'style': 'float:right'}, {
				'click': function() {setDefaultCfg(); window.location.reload()}
			})
		])
	]);
}

function hiddenPostsPreview() {
	delChilds($id('favorities_div'));
	$id('controls_div').style.display = 'none';
	var div = $id('hiddenposts_div');
	if(div.hasChildNodes()) {delChilds(div); return}
	div.innerHTML = '<table style="margin:5px 0px 5px 20px"><tbody></tbody></table>';
	var table = $x('.//tbody', div);
	var clones = [], tcnt = 0, pcnt = 0;
	forAll(function(post) {if(post.Vis == 0) {
		var pp = !post.isOp;
		var cln = $attr(($id('hiddenthr_' + post.Num) || post).cloneNode(true), {
			'id': '',
			'style': 'cursor:default'
		});
		clones.push(cln);
		cln.pst = post;
		cln.vis = 0;
		$event(pp
			? $attr($x('.//span[@id="phide_' + post.Num + '"]', cln), {'id': ''})
			: $x('.//a', cln), {
				'click': function(el) {return function() {
					el.vis = (el.vis == 0) ? 1 : 0;
					if(pp) togglePost(el, el.vis);
					else if(el.vis == 0) $disp($next(el));
				}}(cln)
		});
		$event($x('.//span[starts-with(@id,"no") or @class="reflink"]', cln) || $x('.//a', cln), {
			'mouseover': function(el) {return function() {
				if(el.vis == 0) {
					if(pp) togglePost(el, 1);
					else $next(el).style.display = 'block';
				}
			}}(cln),
			'mouseout': function(el) {return function() {
				if(el.vis == 0) {
					if(pp) togglePost(el, 0);
					else $next(el).style.display = 'none';
				}
			}}(cln)
		});
		$append(table, [
			$if(((!pp && tcnt++ == 0) || (pp && pcnt++ == 0)), $new('tr', {
				'html': '<th align="left"><b>Скрытые ' + (pp ? 'посты' : 'треды') + ':</b></th>'
			})),
			$New('tr', [
				cln,
				$if(!pp, $attr(post.cloneNode(true), {'style':
					'display:none; padding-left:15px; overflow:hidden; border:1px solid grey'
				}))
			])
		]);
		if(!pp) togglePost($next(cln), 1);
		doRefPreview(cln);
	}});
	if(!table.hasChildNodes()) {
		table.innerHTML = '<tr><th>Скрытое отсутствует...</th></tr>';
		return;
	}
	$append(table.insertRow(-1), [
		$new('input', {
			'type': 'button',
			'value': 'Раскрыть все'}, {
			'click': function() {
				if(/все/.test(this.value)) {
					this.value = 'Вернуть назад';
					for(var cln, i = 0; cln = clones[i++];)
						setPostVisib(cln.pst, 1);
				} else {
					this.value = 'Раскрыть все';
					for(var cln, i = 0; cln = clones[i++];)
						setPostVisib(cln.pst, cln.vis);
				}
			}
		}),
		$new('input', {
			'type': 'button',
			'value': 'OK'}, {
			'click': function() {
				for(var cln, i = 0; cln = clones[i++];)
					if(cln.vis != 0) setPostVisib(cln.pst, 1);
				storePostsVisib();
				delChilds(div);
			}
		})
	]);
}

function favorThrdsPreview() {
	delChilds($id('hiddenposts_div'));
	$id('controls_div').style.display = 'none';
	var div = $id('favorities_div');
	if(div.hasChildNodes()) {delChilds(div); return}
	div.innerHTML = '<table style="margin:5px 0px 5px 20px"><tbody></tbody></table>';
	var table = $x('.//tbody', div);
	var data = getStored('DESU_Favorities');
	if(!data) {table.innerHTML = '<tr><th>Избранные треды отсутствуют...</th></tr>'; return}
	else $append(table, [$new('tr', {'html': '<th align="left"><b>Избранные треды:</b></th>'})]);
	var arr = data.split('|');
	for(var i = 0; i < arr.length/4; i++) {
		var dm = arr[i*4];
		var b = arr[i*4 + 1];
		var tNum = arr[i*4 + 2];
		var title = arr[i*4 + 3];
		if((!sav.cookie && title.length >= 70) || (sav.cookie && title.length >= 25))
			title += '..';
		$append(table, [$New('tr', [
			$New('div', [
				$new('span', {
					'class': 'hide_icn'}, {
					'click': function() {removeFavorities($next($next(this)))}
				}),
				$new('span', {
					'class': 'expthr_icn'}, {
					'click': function(b, tNum) {return function() {
						loadFavorThread($up(this, 2), b, tNum);
					}}(b, tNum)
				}),
				$new('a', {
					'href': 'http://referer.us/http://' + dm + '/' + b + '/res/'
						+ tNum + (dm != 'dobrochan.ru' ? '.html' : '.xhtml'),
					'html': dm + '/' + b + '/' + tNum
				}),
				$txt(' - ' + title)
				], {
				'class': 'reply',
				'style': 'cursor:default',
				'html': '&nbsp'
			})], {
			'id': 'favnote_' + i
		})]);
	}
	doRefPreview(div);
}

function $alert(txt, id, htm) {
	var nid = 'DESU_alert' + (id ? '_' + id : '');
	if(id) var div = $id(nid);
	if(div) $next($1(div)).textContent = txt.trim();
	else {
		var div = $New('div', [
			$if(id != 'wait', $new('a', {
				'style': 'cursor:pointer; display:inline-block; vertical-align:top',
				'html': '×'}, {
				'click': function() {$close($up(this))}})),
			$if(id == 'wait', $new('span', {'class': 'wait_icn', 'html': '&nbsp;'})),
			$new('div', {'style': 'display:inline-block; vertical-align:top; padding-left:10px'})
			], {
			'class': 'reply',
			'id': nid,
			'style': 'float:right; clear:both; opacity:0; width:auto; min-width: 0; padding:0 10px 5px 5px; margin:1px; overflow:hidden; white-space:pre-wrap; outline:0; border:1px solid grey'
		});
		if(htm) $next($1(div)).innerHTML = txt;
		else $next($1(div)).textContent = txt.trim();
		$append($id('DESU_alertbox'), [div]);
		$show(div);
	}
}

/*-----------------------------Dropdown select menus-------------------------*/

function removeSelMenu(x) {
	if(!$x('ancestor-or-self::*[@id="sel_menu"]', x)) $del($id('sel_menu'));
}

function addSelMenu(id, dx, dy, arr) {
	$before(dForm, [$new('div', {
		'class': 'reply',
		'id': 'sel_menu',
		'style': 'position:absolute; left:' + (getOffset($id(id), 'offsetLeft') + dx).toString()
			+ 'px; top:' + (getOffset($id(id), 'offsetTop') + dy).toString() + 'px; z-index:250; '
			+ 'cursor:pointer; width:auto; min-width:0; border:1px solid grey; padding:0 5px 0 5px',
		'html': '<a>' + arr.join('</a><br><a>') + '</a>'}, {
		'mouseout': function(e) {removeSelMenu(e.relatedTarget)}
	})]);
	return $X('.//a', $id('sel_menu'));
}

function selectPostHider(post) {
	if(Cfg[17] == 0 || (Cfg[18] == 0 && post.isOp)) return;
	var a = addSelMenu('phide_' + post.Num, 0, 14,
		['Скрывать выделенное', 'Скрывать изображение', 'Скрыть схожий текст']);
	$event(a.snapshotItem(0), {
		'mouseover': function() {quotetxt = txtSelection().trim()},
		'click': function() {applyRegExp(quotetxt)}
	});
	$event(a.snapshotItem(1), {'click': function() {regExpImage(post)}});
	$event(a.snapshotItem(2), {'click': function() {hideBySameText(post)}});
}

function selectExpandThread(post) {
	var p = ' постов';
	$each(addSelMenu('expthrd_' + post.Num, 0, 14,
		[5 + p, 15 + p, 30 + p, 50 + p, 100 + p]),
		function(a) {
			$event(a, {'click': function() {loadThread(post, parseInt(this.textContent))}});
		}
	);
}

function selectAjaxPages() {
	var p = ' страниц';
	$each(addSelMenu('refresh_btn', 2, 21,
		[1 + p + 'а', 2 + p + 'ы', 3 + p + 'ы', 4 + p + 'ы', 5 + p]),
		function(a, i) {
			$event(a, {'click': function() {loadPages(i + 1)}});
		}
	);
}

/*-------------------------------Changes in postform-------------------------*/

function refreshCap(img) {
	if(!ch.dc) 
		$each($X('.//img', $up(img)), function(img) {
			var src = img.src;
			img.src = '';
			img.src = !(ch._0ch || ks)
				? src.replace(/dummy=\d*/, 'dummy=' + rand10())
				: src.replace(/\?[^?]+$|$/,
					(!ch._410 ? '?' : '?board=' + board + '&') + Math.random());
		});
	else {
		var e = doc.createEvent('MouseEvents');
		e.initEvent('click', true, true);
		img.dispatchEvent(e);
	}
}

function getCap(isMain, tNum) {
	return $new('img', {
		'id': (ch._2ch ? 'imgcaptcha' : 'captchaimage'),
		'alt': 'загрузка...',
		'title': 'Обновить капчу',
		'style': 'display:block; cursor:pointer',
		'src': (ch._2ch 
			? (!isMain
				? '/' + board + '/captcha.pl?key=res'
					+ (tNum || oPosts[0].Num) + '&amp;dummy=' + rand10()
				: '/' + board + '/captcha.pl?key=mainpage&amp;dummy=' + rand10())
			: ('http://' + (ch.same ? 'www.' : '') + domain + (!ch._410
				? '/captcha.php?' + Math.random()
				: '/faptcha.php?board=' + board)))}, {
		'click': function() {refreshCap(this)}
	});
}

function forceCap(e) {
	if(e.which == 0 || ch.dc) return;
	var code = e.charCode || e.keyCode;
	var ru = 'йцукенгшщзхъфывапролджэячсмитьбюё';
	var en = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,.`';
	var chr = String.fromCharCode(code).toLowerCase();
	var i = en.length;
	if(wk) {
		if(code < 0x0410 || code > 0x04FF) return;
		while(i--) if(chr == ru[i]) chr = en[i];
	}
	if(ch._0ch) {
		if(code < 0x0021 || code > 0x007A) return;
		while(i--) if(chr == en[i]) chr = ru[i];
	}
	e.preventDefault();
	InsertInto(e.target, chr);
}

function sageBtnFunc(form) {
	var mail = $prev($x('.//span[@id="sage_btn"]', form));
	var s = Cfg[31] == 1;
	$x('.//span[@id="sage_btn"]', form).innerHTML = s
		? '&nbsp;<span class="sage_icn"></span><b style="color:red">SAGE</b>'
		: '<i>(без сажи)</i>';
	if(mail.type == 'text') mail.value = s ? 'sage' : (ch._4ch ? 'noko' : '');
	else mail.checked = s ? true : false;
}

function sageBtnEvent(e) {
	toggleCfg(31);
	sageBtnFunc(pForm);
	if(qForm) sageBtnFunc(qForm);
	e.preventDefault();
	e.stopPropagation();
}

function textareaResizer(form) {
	$del($x('.//img[@id="resizer"]', form));
	var el = $x('.//textarea', form);
	$event(el, {'keypress': function(e) {
		var code = e.charCode || e.keyCode;
		if((code == 33 || code == 34) && e.which == 0) {e.target.blur(); window.focus()}
	}});
	var resmove = function(e) {
		el.style.width = e.pageX - getOffset(el, 'offsetLeft') + 'px';
		el.style.height = e.pageY - getOffset(el, 'offsetTop') + 'px';
	};
	var resstop = function() {
		$revent(doc.body, {'mousemove': resmove, 'mouseup': resstop});
		saveCfg(41, parseInt(el.style.width));
		saveCfg(42, parseInt(el.style.height));
	};
	var x = 14;
	var y = (nav.Opera) ? 9 : (nav.Chrome ? 2 : 6);
	el.style.cssText = 'width:' + Cfg[41] + 'px; height:' + Cfg[42] + 'px';
	$after(el, [$New('div', [$new('img', {
		'id': 'resizer',
		'src': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABlBMVEUAAAAAA\
			AClZ7nPAAAAAWJLR0QAiAUdSAAAAAF0Uk5TAEDm2GYAAAAWSURBVHjaY2BAAYyMDMNagBENYAgAABMoAD3fBUDW\
			AAAAAElFTkSuQmCC',
		'style': 'position:relative; left:-' + x + 'px; top:' + y + 'px; cursor:se-resize'}, {
		'mousedown': function(e) {
			e.preventDefault();
			$event(doc.body, {'mousemove': resmove, 'mouseup': resstop});
		}
	})], {'style': 'display:inline-block'})]);
}

function iframeLoad(e) {
	try {var frm = e.target.contentDocument} 
	catch(e) {
		if(!ks) return;
		var lh = location.href.replace('www.', '');
		$alert('Ошибка (www). Используйте адрес <a href="' + lh + '">' + lh + '</a>', null, true);
	}
	if(!frm || !frm.body || frm.location == 'about:blank' || !frm.body.innerHTML) return;
	var err = frm.getElementsByTagName('h2')[0] || frm.getElementsByTagName('h1')[0];
	if((!ch.dc && (err || !frm.getElementById('delform')))
		|| (ch.dc && /error/.test(frm.location.pathname))) {
		var txt = '';
		if(ch._2ch) err = frm.evaluate('.//font[@size="5"]', frm, null, 6, null);
		if(ch.dc) err = frm.evaluate('.//td[@class="post-error"]', frm, null, 6, null);
		if(ks || ch._0ch) err =
			frm.evaluate('.//h1|.//h2|.//div[contains(@style, "1.25em")]', frm, null, 6, null);
		if(!wakaba || ch._2ch) $each(err, function(el) {txt += el.innerHTML + '\n'});
		else if(err) txt = err.innerHTML.replace(/<br.*/ig, '');
		$close($id('DESU_alert_wait'));
		$alert(txt.trim() || 'Ошибка:\n' + frm.innerHTML, null, true);
	} else {
		pfTxt.value = '';
		if(pfFile) pfFile.value = '';
		if(qForm || !main) {
			if(main) loadThread(postByNum[getThread(qForm).id.match(/\d+/)], 8);
			else {$del(qForm); loadNewPosts(true)}
			qForm = undefined;
			if(pfCap) {
				pfCap.value = '';
				refreshCap($x('ancestor::tr[1]//img', pfCap));
			}
		} else window.location = frm.location;
	}
	frm.location.replace('about:blank');
}

function doChanges() {
	var adbar = $x('.//div[@class="adminbar"]|.//span[@id="navtop"]');
	var rm = ' <a href="http://archives.freedollchan.org/redirect-to/';
	$html(adbar, '[RMT:' + rm + '2-ch">2-ch</a> /' + rm + '0ch">0chan</a>] - ' + adbar.innerHTML);
	if(ch._0ch) $event(window, {'load': function() {setTimeout(function() {
		$each($X('.//div[@class="replieslist"]', dForm), function(el) {$del(el)});
	}, 10)}});
	if(ch._2ch) $each($X('.//small', dForm), function(el) {$del(el)});
	if(!main) {
		doc.title = board + ' - ' + getTitle(oPosts[0]).substring(0, 50);
		$before($x('.//div[@class="theader" or @class="replymode"]') || $prev($id('DESU_panel')), [
			$if(!(ch._0ch || ch.same), $new('span', {
				'html': '[<a href="' + location.href + '" target="_blank">В новой вкладке</a>]'})),
			$if(Posts.length > 50 && !ks, $new('span', {
				'html': ' [<a href="#">Последние 50</a>]'}, {
				'click': showLast50
			}))
		]);
		if(ch._0ch) {
			$disp($id('newposts_get'));
			$after($x(ITT), [$x('.//span[@style="float: right;"]')]);
		}
	}
	if(!pForm) return;
	if(ch._0ch || (ks && !ch.sib)) delNexts(pfSubm);
	if(ch._0ch) {
		$del($id('captcha_status'));
		$attr(pfTxt, {'id': '', 'name': ''});
		$event(pfSubm, {'click': function() {$attr(pfTxt, {'id': 'message', 'name': 'message'})}});
	}
	textFormatPanel(pForm);
	textareaResizer(pForm);
	$each($X('.//input[@type="text"]', pForm), function(el) {el.size = 35});
	if(Cfg[38] == 1) $disp(pfRules);
	if(Cfg[39] == 1 && pfGoto) $disp(pfGoto);
	if(Cfg[33] == 0 && pfCap) $disp($up(pfCap, 2));
	if(Cfg[40] == 1 && pfPass) $disp($up(pfPass, 2));
	if(Cfg[34] == 1 && pfName) setTimeout(function() {pfName.value = Cfg[35]} , 10);
	del_passw = $X('.//input[@type="password"]').snapshotItem(1);
	if(del_passw) setTimeout(function() {
		if(Cfg[36] == 1) {
			pfPass.value = Cfg[37];
			del_passw.value = Cfg[37];
		} else del_passw.value = pfPass.value;
	}, 10);
	var hr = !ch._4ch ? $prev(dForm) : $next(postarea);
	if(main) {$disp(postarea); $disp(hr)}
	if(Cfg[32] == 1 && !main)
		$after(dForm, [$x('.//div[@class="theader" or @class="replymode"]'), postarea, hr]);
	if(ch._4ch) {
		postarea.style.paddingLeft = '0px';
		$del($prev($x('.//table', pForm)));
		var x = $x('.//div[@class="bf"]');
		if(x) $del($up(x));
		x = $x('.//div[@class="logo"]');
		$del($next(x));
		$del($next(x));
		x = $next($next(postarea));
		$del($next(x));
		$del($next(x));
		if(!main) {
			x = $attr($next($x('.//table')), {'style': ''});
			$del($next(x));
			$del($next(x));
		}
	}
	if(pfCap) {
		$rattr(pfCap, 'onclick');
		$rattr(pfCap, 'onfocus');
		$event($attr(pfCap, {'autocomplete': 'off'}), {'keypress': forceCap});
		if(ch._0ch || ks) {
			var a = $x('.//img[contains(@id,"aptchaimage")]', pForm);
			if($up(a).tagName == 'A') a = $up(a);
			$up(a).replaceChild(getCap(), a);
		}
		if(wakaba) {
			var td = $x('ancestor::td[1]', pfCap);
			var img = $x('.//img', td);
			if(ch._2ch) {
				$del($prev(pfCap));
				$del($id('captchadiv'));
				$del($id('imgcaptcha'));
				for(var i = 0; i < Cfg[33]; i++)
					td.appendChild(getCap(main));
			} else {
				$attr(img, {
					'alt': 'Загрузка...',
					'title': 'Обновить капчу',
					'style': 'display:block; cursor:pointer'
				});
				$event(img, {'click': function() {refreshCap(this)}});
			}
		}
	}
	if(Cfg[30] == 1 && pfMail && hasSage) {
		$disp(pfMail);
		if(pfName && pfName.type != 'hidden') {
			delNexts(pfName);
			var mail_tr = $up(pfMail, !ch._0ch ? 2 : 3);
			$after(pfName, [pfMail]);
			$del(mail_tr);
		}
		delNexts(pfMail);
		$append($up(pfMail), [$txt(' '), $new('span', {
			'id': 'sage_btn',
			'style': 'cursor:pointer'}, {
			'click': sageBtnEvent}
		)]);
		sageBtnFunc(pForm);
	}
	if(Cfg[23] == 1 && !ch._4ch) {
		$x('.//body').appendChild($new('div', {'html': 
			'<iframe name="submitcheck" id="submitcheck" src="about:blank" '
			+ 'style="visibility:hidden; width:0px; height:0px; border:none" />'
		}));
		$attr(pForm, {'target': 'submitcheck'});
		var load = nav.Opera ? 'DOMFrameContentLoaded' : 'load';
		$event($id('submitcheck'), {load: iframeLoad});
		$event(pfSubm, {'click': function() {$alert('Проверка...', 'wait')}});
	}
}

/*-----------------------------Quick Reply under post------------------------*/

function quickReply(post) {
	var tNum = getThread(post).id.match(/\d+/);
	if(!qForm) {
		var first = true;
		qForm = $attr(pForm.cloneNode(true), {'class': 'reply'});
		qfTxt = $attr($x('.//textarea', qForm), {'value': ''});
		textareaResizer(qForm);
		textFormatPanel(qForm);
		var sage = $x('.//span[@id="sage_btn"]', qForm);
		if(sage) $event(sage, {'click': sageBtnEvent});
		if(pfCap &&(ch._0ch || ks))
			$event($x('.//img[@id="captchaimage"]', qForm), {
				'click': function() {refreshCap(this)}
			});
	}
	if($next(post) == qForm) {$disp(qForm); return}
	$after(post, [qForm]);
	qForm.style.display = 'block';
	if(main) {
		if(wakaba) {
			if(first) $before($1(qForm), [$new('input', {
				'type': 'hidden',
				'id': 'thr_id',
				'name': (!ch._4ch ? 'parent' : 'resto'),
				'value': tNum
			})]);
			else $id('thr_id').value = tNum;
		} else $x('.//input[@name="thread_id" or @name="replythread"]', qForm).value = tNum;
	}
	var cap = $x('.//input[@name="captcha"]', qForm);
	if(cap) {
		$rattr(cap, 'onclick');
		$rattr(cap, 'onfocus');
		$event(cap, {'keypress': forceCap});
	}
	if(cap && wakaba && !ch._4ch) {
		if(ch._2ch) {
			$each($X('.//img[@id="imgcaptcha"]', qForm), function(img) {$del(img)});
			for(var i = 0; i < Cfg[33]; i++)
				$up(cap).appendChild(getCap(false, tNum));
		} else {
			var img = $x('.//img', $up(cap));
			$event(img, {'click': function(e) {refreshCap(this)}});
			img.src = 
				(ch.iich ? '/cgi-bin/captcha.pl/' + board + '/' : '/' + board + '/captcha.pl')
				+ '?key=res' + tNum + '&amp;dummy=' + rand10();
		}
	}
	var ms = pfTxt.value.trim();
	InsertInto(qfTxt, 
		(first && ms != '' ? ms + '\n' : '') + '>>' + post.Num + '\n' 
		+ (quotetxt != '' ? '>' + quotetxt.replace(/\n/gm, '\n>') + '\n' : ''));
	$event($x('.//input[@type="submit"]', qForm), {'click': function() {
		if(Cfg[23] == 1 && !ch._4ch) $alert('Проверка...', 'wait');
		pfTxt.value = qfTxt.value;
		if(ch._0ch || ks) pfCap.value = ' ';
		if(ch._0ch) $attr(qfTxt, {'id': 'message', 'name': 'message'});
	}});
	if(ch._4ch && first)
		$each($X('.//a[@id="recaptcha_reload_btn"]'), function(btn) {
			$event(btn, {'click': function() {
				if(qForm) setTimeout(function() {
					var x = './/div[@id="recaptcha_image"]/img';
					$x(x, qForm).src = $x(x).src;
				}, 2000);
			}});
		});
}

/*----------------------------Text formatting buttons------------------------*/

function insertTags(el, tag1, tag2) {
	var x = $x('ancestor::form//textarea', el);
	var start = x.selectionStart, end = x.selectionEnd;
	if(tag1 == '' && tag2 == '') {
		var i = (end - start);
		while(i--) tag2 += '^H';
	}
	var text = x.value.substring(start, end);
	x.value = (text != '')
		? x.value.substr(0, start) + tag1 + text + tag2 + x.value.substr(end)
		: tag1 + x.value + tag2;
	x.setSelectionRange(start + text.length, start + text.length);
	x.focus();
}

function tfBtn(title, wktag, bbtag, val, style, src, form) {
	var btn = $new('span', {
		'title': title,
		'style': 'cursor:pointer;' + (Cfg[20] == 1 
			? 'padding:0 27px 27px 0;background:url(data:image/gif;base64,' + src + ') no-repeat' : ''),
		'html': (Cfg[20] == 2
			? ' <a style="' + style + '">' + val + '</a> ' + (val != '&gt;' ? '/' : ']')
			: (Cfg[20] == 3 ? '<input type="button" value="' + val + '" style="font-weight:bold;' + style + '">' : ''))
	});
	if(val != '&gt;') $event(btn, {
		'click': function() {
			if(ch._0ch || ch.sib || ch._2ch)
				insertTags(this, '[' + bbtag + ']', '[/' + bbtag + ']');
			else insertTags(this, wktag, wktag);
		}
	});
	else $event(btn, {
		'mouseover': function() {quotetxt = txtSelection()},
		'click': function() {
			var x = $x('.//textarea', form);
			var start = x.selectionStart, end = x.selectionEnd;
			InsertInto(x, '>' + (start == end
				? quotetxt : x.value.substring(start, end)).replace(/\n/gm, '\n>'));
		}
	});
	return btn;
}

function textFormatPanel(form) {
	$del($x('.//span[@id="txt_btns"]', form));
	if(Cfg[20] == 0) return;
	var pre = 'R0lGODlhFwAWAMQAAP//////AP8A//8AAAD//wD/AAAA/wAAAPb2+Onq7Bc/e053qitemNXZ3Wmdypm92';
	var btns = $New('span', [
		$if(Cfg[20] == 2, $txt('[')),
		tfBtn('Жирный', '**', 'b', 'B', '', pre +'2hoaP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABEALAAAAAAXABYAAAWTYBQtZGmepjg+bOu+7hIxD2LfeI4/DK3/Op4PSEQIazjIYbmEQII95E3JZD530ZzyajtwbUJHYjzekhPLc8LRE5/NZa+azXCTqdWDet1W46sQc20NhIRbhQ2HhXQOiIleiFSIdAuOioaQhQs9lZF5TI6bDJ2Ff02ODaKkqKyanK2whKqxsJsjKLi4Kgq8vb6/viIhADs='),
		tfBtn('Наклонный', '*', 'i', 'i', 'font-style:italic', pre +'2hoaP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABEALAAAAAAXABYAAAV5YBQtZGmepjg+bOu+7hIxD2LfeI4/DK3/Op4PSEQIa0TI4XcsKpk9ZBHKcCSuWKwym3X0rFztIXz1VskJJQRtBofV7G9jTp8r6/g2nn7fz80Lfmp+cws9gXt9hIYMiHiKfoyOhIuHlJeSl5SGIyienioKoqOkpaQiIQA7'),
		$if(!ch.dc && !ch._410, tfBtn('Подчеркнутый', '__', 'u', 'U', 'text-decoration:underline', pre +'6CgoGhoaP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABIALAAAAAAXABYAAAWPoCQtZGmepjg+bOu+7iIxD2LfeI4/DK3/Op4PSEQIazjIIbnMHXNKZrCHvEWtzV3Pkeh2IwdvAizuOrZlslctPjO4YvY4XHbD1/Rv3mtv+P1gEH9gf399hWARigeMhX5uC44NYIwQSpILPZGSnI6ZDJudop+hDYynqI1/pKKtrK2dmSMotLQqCri5uru6IiEAOw==')),
		tfBtn('Зачеркнутый', '', 's', 'S', 'text-decoration:line-through', pre +'2hoaE1NTf///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABIALAAAAAAXABYAAAWNoCQtZGmepjg+bOu+7iIxD2LfeI4/DK3/Op4PSEQIazrIYQn5HXXL6KGZe+KUkIQWW+05tOAlWCseO7zjBDbNPjO+aog8Kq/XtW54en5g470NgYKDWIOBeYNLhoqGbguEU4KFhgs9j4lSBxGGgZUMl5BMnJ2Wo6aDnqCno6mrp5UjKLKyKgq2t7i5uCIhADs='),
		tfBtn('Спойлер', '%%', 'spoiler', '%', '', pre +'2hoaP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABEALAAAAAAXABYAAAV7YBQtZGmepjg+bOu+7hIxD2LfeI4/DK3/Op4PSEQIa0Xg0XZoOp9Q2xIBqVqvWGnPkUhgv9euY9sFm8Vkr/mLZnDV63Bi7G404lg73WGH+p96PQt2hIWGhguCh4uHiQyDjJENjpCSi5SWjJiZjQwjKKCgKgqkpaanpiIhADs='),
		tfBtn('Код', "`", 'code', 'C', '', pre +'2hoaP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABEALAAAAAAXABYAAAWGYBQtZGmepjg+bOu+7hIxD2LfeI4/DK3/Op4PSEQIa0Xg8Qc5OCGQYA+Jazqv0V3Pkeh2rd4ENJxwbMlNsrp8DjvXZDOD6z7Aw3JHY7938v+AeYBNgIUNcguDfnxQgAs9iYpXT46QhlYHjZUMkYaee4+cn6OhnaOFjyMoq6sqCq+wsbKxIiEAOw=='),
		tfBtn('Цитировать', '', '', '&gt;', '', pre +'2hoaP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAABEALAAAAAAXABYAAAWEYBQtZGmepjg+bOu+7hIxD2LfeI4/DK3/Op4PSEQIa7jDoWg75iAQZdGpg0p/Qkdiy+VaD92to6cNh7/dMaNsPke5anabq4TAyY28ft+oQ/ZxfHt+gmoLgn0HUIgNCz2Hg4p/jI2PfIuUeY4MkJmIm52efKCinwwjKKmpKgqtrq+wryIhADs=', form),
		$new('br')
		], {
		'id': 'txt_btns',
		'html': '&nbsp;',
		'style': 'padding-bottom:2px; width:auto; font-weight:bold'
	});
	if(Cfg[45] == 0) $after($x('.//input[@type="submit"]', form), [btns]);
	else $before($x('.//textarea', form), [btns]);
}

/*-------------------------Append styles for elements------------------------*/

function scriptStyles() {
	var icn = function(nm, src) {return nm + ' {vertical-align:middle; padding-left:18px; cursor:pointer; background:url(data:image/gif;base64,' + src + ') no-repeat} '};
	var pre = 'R0lGODlhDgAPALMAAP//////AP8A//8AAAD//wD/AAAA/wAAAN3d3cDAwJmZmYCAgGBgYEtLS////wAAACH5BAEAAA4ALAAAAAAOAA8AAAR';
	var txt = 'td.reply {width:auto} .pcount, .pcountb {font-size:13px;font-weight:bold;cursor:default} .pcount {color:#4f7942} .pcountb {color:#c41e3a} .rfmap {font-size:70%; font-style:italic} .wait_icn {padding:0 16px 16px 0; background:url( data:image/gif;base64,R0lGODlhEAAQALMMAKqooJGOhp2bk7e1rZ2bkre1rJCPhqqon8PBudDOxXd1bISCef///wAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFAAAMACwAAAAAEAAQAAAET5DJyYyhmAZ7sxQEs1nMsmACGJKmSaVEOLXnK1PuBADepCiMg/DQ+/2GRI8RKOxJfpTCIJNIYArS6aRajWYZCASDa41Ow+Fx2YMWOyfpTAQAIfkEBQAADAAsAAAAABAAEAAABE6QyckEoZgKe7MEQMUxhoEd6FFdQWlOqTq15SlT9VQM3rQsjMKO5/n9hANixgjc9SQ/CgKRUSgw0ynFapVmGYkEg3v1gsPibg8tfk7CnggAIfkEBQAADAAsAAAAABAAEAAABE2QycnOoZjaA/IsRWV1goCBoMiUJTW8A0XMBPZmM4Ug3hQEjN2uZygahDyP0RBMEpmTRCKzWGCkUkq1SsFOFQrG1tr9gsPc3jnco4A9EQAh+QQFAAAMACwAAAAAEAAQAAAETpDJyUqhmFqbJ0LMIA7McWDfF5LmAVApOLUvLFMmlSTdJAiM3a73+wl5HYKSEET2lBSFIhMIYKRSimFriGIZiwWD2/WCw+Jt7xxeU9qZCAAh+QQFAAAMACwAAAAAEAAQAAAETZDJyRCimFqbZ0rVxgwF9n3hSJbeSQ2rCWIkpSjddBzMfee7nQ/XCfJ+OQYAQFksMgQBxumkEKLSCfVpMDCugqyW2w18xZmuwZycdDsRACH5BAUAAAwALAAAAAAQABAAAARNkMnJUqKYWpunUtXGIAj2feFIlt5JrWybkdSydNNQMLaND7pC79YBFnY+HENHMRgyhwPGaQhQotGm00oQMLBSLYPQ9QIASrLAq5x0OxEAIfkEBQAADAAsAAAAABAAEAAABE2QycmUopham+da1cYkCfZ94UiW3kmtbJuRlGF0E4Iwto3rut6tA9wFAjiJjkIgZAYDTLNJgUIpgqyAcTgwCuACJssAdL3gpLmbpLAzEQA7) no-repeat}' +
		icn('.hide_icn', pre + 'U0MlJq7o4X7dQ+mCILAuohOdHfgpQJguQLowSA+7tKkxt4wgEbnHpkWhCAIJxNJIYyWWTSQMmqUYGDtBobJmMxhOAJZO6LM3l0/WE3oiGo0uv0x0RADs=') +
		icn('.unhide_icn', pre + 'N0MlJq7o4X7dQ+mCILEuYMIxJfheDIMz1LTHGAEDd1uidozsaAvciMmhHF3EIgCFJPVwPeiTRpFZaI+tyWhsN1g7zAXtMooYDzG6zHREAOw==') +
		icn('.rep_icn', pre + 'O0MlJq7o4X7dQ+mCILAt4hSD5LQCghgtzsa27YIys0LV75SRGr4VgxIyxIaB4DPYQiEYQ2SBGpUFsA9rAkhZdUFejSHQ9KFHD0W27244IADs=') +
		icn('.sage_icn','R0lGODlhDgAPALMAAP//////AP8A//8AAAD//wD/AAAA/wAAAO7u7oCAgGBgYEtLS////wAAAAAAAAAAACH5BAEAAAwALAAAAAAOAA8AAARBkMlJq7o4X6aS/6B3fVonmomCrAiqLNiyeHIMXwuL3K/sz4mfUKYbCmnGxUG3OvwwS9bBlolObSfF4WpaMJI/RgQAOw==') +
		icn('.expthr_icn', pre + 'P0MlJq7o4X7dQ+gsALF+CLCSIiGeJqiKbLkzGIEiNMfp15zYGCtXANYY04bCIOA55SKYTBV0akQxnMQZoEhulbRf8aRTDIrKp4TC7325HBAA7') +
		icn('.fav_icn', pre + 'T0MlJq7o4X7dQ+skFJsiyjAqCKKOJAgALLoxpInBpMzUM4D8frcbwGQHEGi1hTCh5puLxWWswAY0GLNGgdbVYE/hr5ZY/WXTDM2ojGo6sfC53RAAAOw==');
	if((ch._2ch && getCookie('wakabastyle') != 'Futaba') || ch._0ch || ch.ne2)
		txt += '.postblock {background:#bbb} ';
	if(Cfg[27] == 1) txt += '.commentpostername, .postername, .postertrip {display:none} ';
	if(Cfg[28] == 1) txt += 'blockquote {max-height:100% !important; overflow:visible !important} ';
	if(Cfg[29] == 1) txt += '.spoiler, .hide {background:#888 !important; color:#CCC !important; opacity:1 !important} ';
	if(!$id('desustyle')) {
		$x('.//head').appendChild($new('style', {'id': 'desustyle', 'type': 'text/css', 'text': txt}));
		if(nav.Chrome) $disp(dForm);
	} else $id('desustyle').textContent = txt;
}


/*=============================================================================
							FOR POSTS AND THREADS
=============================================================================*/

function forPosts(fn) {
	for(var post, i = 0; post = Posts[i++];) fn(post);
}

function forOP(fn) {
	for(var post, i = 0; post = oPosts[i++];) fn(post);
}

function forAll(fn) {
	forOP(fn); forPosts(fn);
}

function getThread(el) {
	return $x('ancestor::div[@class="thread"]', el);
}

function getPost(el) {
	return !ch._0ch
		? $x('ancestor::table[1]', el) || $x('ancestor::div[starts-with(@class,"oppost")]', el)
		: $x('ancestor::div[@class="postnode"]', el) || $x('ancestor::table[1]', el);
}

function getTitle(post) {
	var t = $x('.//span[@class="filetitle" or @class="replytitle"]', post);
	if(t) t = t.textContent.trim();
	if(!t || t == '') t = post.Text.trim();
	return t.replace(/\s/g, ' ');
}

function getPostMsg(post) {
	return wk
		? $x('.//blockquote', post)
		: $x('.//div[@class="postmessage" or @class="message" or @class="postbody"]', post);
}

function getText(el) {
	var n = el.nodeName;
	if(n == '#text') return el.data;
	if(n == 'BR' && !ch.dc) return '\n';
	var t = [];
	if(n == 'P' || n == 'BLOCKQUOTE' || n == 'LI') t[t.length] = '\n';
	var arr = el.childNodes;
	for(var x, i = 0; x = arr[i++];)
		t[t.length] = getText(x);
	return t.join('');
}

function isSage(post) {
	if(!hasSage) return false;
	if(!ch.dc) {
		var a = $x('.//a[starts-with(@href,"mailto:")]', post);
		return a && /sage/i.test(a.href);
	} else if($x('.//img[@alt="Сажа"]', post)) return true;
	return false;
}

function isTitled(post) {
	if(!ch._0ch && $x('.//span[@class="replytitle"]', post).textContent.trim() == '') return false;
	if(ch._0ch && !$x('.//span[@class="filetitle"]', post)) return false;
	return true;
}

/*-------------------------------Post buttons--------------------------------*/

function addHidePostBtn(post) {
	return $new('span', {
		'class': 'hide_icn',
		'id': 'phide_' + post.Num}, {
		'click': function() {
			if(!post.isOp) togglePostVisib(post);
			else {hideThread(post); storeThreadVisib(post, 0)}
		},
		'mouseover': function() {selectPostHider(post)},
		'mouseout': function(e) {removeSelMenu(e.relatedTarget)}
	});
}

function addQuickRepBtn(post) {
	return $new('span', {
		'class': 'rep_icn',
		'title': 'Быстрый ответ'}, {
		'mouseover': function() {quotetxt = txtSelection()},
		'click': function() {quickReply(post)}
	});
}

function addExpandThreadBtn(post) {
	return $new('span', {
		'class': 'expthr_icn',
		'id': 'expthrd_' + post.Num}, {
		'click': function() {loadThread(post, 1)},
		'mouseover': function() {selectExpandThread(post)},
		'mouseout': function(e) {removeSelMenu(e.relatedTarget)}
	});
}

function addFavorBtn(post) {
	return $new('span', {
		'class': 'fav_icn',
		'title': 'В избранное'}, {
		'click': function() {storeFavorities(post)}
	});
}

function addSageMarker() {
	return $new('span', {
		'class': 'sage_icn',
		'title': 'SAGE'}, {
		'click': function() {toggleSage(); toggleChk($id('sage_hider'))}
	});
}

function addPostCounter(post) {
	return $new('i', {
		'class': (post.Count < 500 ? 'pcount' : 'pcountb'),
		'text': post.Count
	});
}

function addNote(post, text) {
	post.Btns.appendChild($new('a', {
		'id': 'note_' + post.Num,
		'style': 'font-size:12px; font-style:italic',
		'text': text}, {
		'click': function() {$del(this)}
	}));
}

function addPostButtons(post, isCount) {
	var x = [], i = 0;
	var div = $new('span', {'class': 'reflink'});
	if(ch.dc || ch._4ch || ks) div.innerHTML = '&nbsp;';
	if(ch.dc) $del($x('.//a[@class="reply_ icon"]', post));
	if(ch._0ch || ks) $del($x('.//span[@class="extrabtns"]', post));
	if(ch._4ch) $X('.//a[@class="quotejs"]', post).snapshotItem(1).textContent = post.Num;
	if(!post.isOp) {
		if(!main || isCount) x[i++] = addPostCounter(post);
		if(isSage(post)) x[i++] = addSageMarker();
		if(pForm) x[i++] = addQuickRepBtn(post);
	} else {
		if(isSage(post)) x[i++] = addSageMarker();
		x[i++] = addFavorBtn(post);
		if(pForm) x[i++] = addQuickRepBtn(post);
		if(main) x[i++] = addExpandThreadBtn(post);
	}
	x[i++] = addHidePostBtn(post);
	var i = x.length;
	while(i--) div.appendChild(x[i]);
	$after($x('.//span[@class="reflink"]', post) || $x('.//span[starts-with(@id,"no")]', post), [div]);
	post.Btns = div;
}

/*----------------------------------Players----------------------------------*/

function insertYouTube(link, div) {
	if($x('.//embed[@src="' + link + '"]', div)) delChilds(div);
	else $html(div, '<embed src="' + link +
		'" type="application/x-shockwave-flash" wmode="transparent" width="320" height="262"></embed>');
}

function addYouTube(post) {
	if(Cfg[24] == 0) return;
	var pattern = /^http:\/\/(www\.)?youtube\.com\/watch\?v=([^&]+).*$/;
	$each($X('.//a[contains(@href,"youtube")]', post || dForm), function(link, i) {
		if(!pattern.test(link.href)) return;
		var pst = post || getPost(link);
		var div = $x('.//div[@id="ytube_div"]', pst);
		if(!div) {
			var msg = getPostMsg(pst);
			div = $new('div', {'id': 'ytube_div'});
			$before($1(msg), [div]);
			msg.style.minWidth = '560px';
		}
		var path = 'http://www.youtube.com/v/' + link.href.match(pattern)[2] + '&hl=en_US&fs=1&';
		$after(link, [$new('span', {
			'style': 'cursor:pointer',
			'html': '<b> ' + unescape('%u25BA') + '</b>'}, {
			'click': function(path, div) {return function() {insertYouTube(path, div)}}(path, div)
		})]);
		if(!div.hasChildNodes()) insertYouTube(path, div);
	});
}

function addMP3(post) {
	if(Cfg[25] == 0) return;
	$each($X('.//a[contains(@href,".mp3") or contains(@href,".wav")]', post || dForm), function(link) {
		var pst = post || getPost(link);
		var div = $x('.//div[@id="mp3_div"]', pst);
		if(!div) {
			div = $new('div', {'id': 'mp3_div'});
			$before($1(getPostMsg(pst)), [div]);
		}
		if(!$x('.//param[contains(@value,"' + link.href + '")]', div)) div = $html(div, div.innerHTML + '<object data="http://junglebook2007.narod.ru/audio/player.swf" wmode="transparent" type="application/x-shockwave-flash" width="220" height="16"><param value="http://junglebook2007.narod.ru/audio/player.swf" name="movie"><param value="playerID=1&amp;bg=0x808080&amp;leftbg=0xB3B3B3&amp;lefticon=0x000000&amp;rightbg=0x808080&amp;rightbghover=0x999999&amp;rightcon=0x000000&amp;righticonhover=0xffffff&amp;text=0xffffff&amp;slider=0x222222&amp;track=0xf5f5dc&amp;border=0x666666&amp;loader=0x7fc7ff&amp;loop=yes&amp;autostart=no&amp;soundFile=' + link.href + '&amp;" name="FlashVars"><param value="high" name="quality"><param value="true" name="menu"><param value="transparent" name="wmode"></object><br>  ');
	});
}

/*--------------------------------Expand images------------------------------*/

function expandImg(a, post) {
	var img = $x('.//img[@class="thumb"]', a);
	var pre = $x('.//img[@id="pre_img"]', a);
	var full = $x('.//img[@id="full_img"]', a);
	$disp(img);
	if(pre) {$disp(pre); return}
	if(full) {$disp(full); return}
	var maxw = doc.body.clientWidth - getOffset(a, 'offsetLeft') - 20;
	var sz = getImgSize(post).split(/[x|×]/);
	var r = sz[0]/sz[1];
	var w = sz[0] < maxw ? sz[0] : maxw;
	var h = w/r;
	$append(a, [
		$if(Cfg[21] == 2, $attr(img.cloneNode(false), {
			'id': 'pre_img',
			'width': w,
			'height': h,
			'style': 'display:block'
		})),
		$new('img', {
			'class': 'thumb',
			'id': 'full_img',
			'alt': 'Загрузка...',
			'src': a.href,
			'width': w,
			'height': h,
			'style': 'display:' + (Cfg[21] == 2 ? 'none' : 'block')}, {
			'load': function() {
				$del($x('.//img[@id="pre_img"]', $up(this)));
				if(img.style.display == 'none') this.style.display = 'block';
			}
		})
	]);
}

function expandHandleImg(post) {
	var img = post.Img;
	if(img) {
		var a = $up(img, (ks || ch._0ch ? 2 : 1));
		$rattr(a, 'onclick');
		$rattr(img, 'onclick');
		$event(a, {'click': function(e) {
			if(Cfg[21] != 0) {e.preventDefault(); expandImg(this, post)}
		}});
	}
}

function allImgExpander() {
	if(Cfg[21] == 0 || main || !(wakaba || ch.dc)) return;
	if($X('.//img[@class="thumb"]', dForm).snapshotLength <= 1) return;
	var txt = '[<a>Раскрыть изображения</a>]';
	oPosts[0].appendChild($new('div', {
		'id': 'expimgs_btn',
		'style': 'cursor:pointer',
		'html': txt}, {
		'click': function() {
			forPosts(function(post) {if(post.Img && post.Vis != 0) expandImg($up(post.Img), post)});
			var btn = $id('expimgs_btn');
			btn.innerHTML = /Раскрыть/.test(btn.innerHTML) ? '[<a>Свернуть изображения</a>]' : txt;
		}}));
}

/*--------------------------Add map of answers to post-----------------------*/

function getRefMap(pNum, rNum, arr, dir) {
	if(!arr[rNum]) arr[rNum] = [];
	if(!(pNum in arr[rNum])) {
		if(dir) arr[rNum].push(pNum);
		else arr[rNum].unshift(pNum);
	}
}

function ajaxRefmap(x, pNum) {
	if(x) for(var i = 0; rLen = x.length, i < rLen; i++)
		getRefMap(pNum, x[i].match(/\d+/g), refArr, true);
}

function showRefMap(post, rNum, isUpd, arr, tNum, brd) {
	var ref = arr[rNum].toString().replace(/(\d+)/g, 
		'<a href="' + (tNum ? '/' + brd + '/res/' + tNum + '.html' : '')
		+ '#$1" onclick="highlight($1)">&gt;&gt;$1</a>'
	);
	var map = isUpd ? $id('rfmap_' + rNum) : undefined;
	if(!map) {
		if(!post.innerHTML) return;
		map = $new('div', {
			'class': 'rfmap',
			'id': 'rfmap_' + rNum,
			'html': '<br>&nbsp;Ответы: ' + ref
		});
		doRefPreview(map);
		var msg = post.Msg || getPostMsg(post);
		if(msg) $up(msg).appendChild(map);
	} else doRefPreview($html(map, map.innerHTML + ', ' + ref));
}

function doRefMap(post) {
	if(Cfg[22] != 2) return;
	var arr = [];
	$each($X('.//a[starts-with(text(),">>")]', (post ? post.Msg : dForm)), function(link) {
		if(/\//.test(link.textContent)) return;
		var rNum = (link.hash || link.pathname.substring(link.pathname.lastIndexOf('/'))).match(/\d+/);
		var pst = getPost(link);
		if(postByNum[rNum] && pst) getRefMap(pst.id.match(/\d+/), rNum, arr);
	});
	for(var rNum in arr) showRefMap(postByNum[rNum], rNum, Boolean(post), arr);
}

/*---------------------------Posts preview by reflinks-----------------------*/

function delPostPreview(e) {
	var el = $x('ancestor-or-self::*[starts-with(@id,"pstprew")]', e.relatedTarget);
	if(!el) $each($X('.//div[starts-with(@id,"pstprew")]'), function(clone) {$del(clone)});
	else while(el.nextSibling) $del(el.nextSibling);
}

function showPostPreview(e) {
	setTimeout(function() {
		$del($x('.//div[starts-with(@id,"preview") or starts-with(@id,"pstprev")]'));
	}, 5);
	var tNum = this.pathname.substring(this.pathname.lastIndexOf('/')).match(/\d+/);
	var pNum = this.hash.match(/\d+/) || tNum;
	var b = this.pathname.match(/[^\/]+/);
	var elm = doc.documentElement;
	var x = e.clientX + (elm.scrollLeft || doc.body.scrollLeft) - elm.clientLeft + 2;
	var y = e.clientY + (elm.scrollTop || doc.body.scrollTop) - elm.clientTop;
	var cln = $new('div', {
		'class': 'reply',
		'id': 'pstprew_' + pNum,
		'style': 'position:absolute; z-index:300; width:auto; min-width:0; border:1px solid grey; '
			+ (x < doc.body.clientWidth/2
				? 'left:' + x + 'px;'
				: 'right:' + parseInt(doc.body.clientWidth - x + 2) + 'px;') +
			' top:' + y + 'px;'}, {
		'mouseout': delPostPreview});
	var aj = ajaxPosts[tNum];
	var functor = function(cln, html) {
		cln.innerHTML = html;
		cln.Img = $x('.//img[@class="thumb"]', cln);
		doRefPreview(cln);
		expandHandleImg(cln);
		var aj = ajaxPosts[tNum] && ajaxPosts[tNum][pNum];
		if(Cfg[22] == 2 && !$x('.//div[@class="rfmap"]', cln) && aj && refArr[pNum])
			showRefMap(cln, pNum, false, refArr, tNum, b);
	};
	if(b == board) var post = postByNum[pNum];
	cln.innerHTML = '<span class="wait_icn">&nbsp;</span><span>&nbsp;Загрузка...</span>';
	if(post) {
		functor(cln, ($x('.//td[@class="reply"]', post) || post).innerHTML);
		if(post.Vis == 0) togglePost(cln);
	} else if(aj && aj[pNum]) functor(cln, aj[pNum]);
	else AJAX(true, b, tNum, function(err) {
		functor(cln, err || ajaxPosts[tNum][pNum] || 'Пост не найден');
	});
	$del($id(cln.id));
	dForm.appendChild(cln);
}

function doRefPreview(el) {
	if(Cfg[22] == 0) return;
	$each($X('.//a[starts-with(text(),">>")]', el || dForm), function(link) {
		if(!/>>\d+/.test(link.textContent)) return;
		if(ch.dc) $rattr(link, 'onmouseover');
		$event(link, {'mouseover': showPostPreview, 'mouseout': delPostPreview});
	});
}


/*=============================================================================
								AJAX FUNCTIONS
=============================================================================*/

function getpNum(x) {
	return (x.match(/<input[^>]+checkbox[^>]+>/i) || x.match(/<a name="\d+">/))[0].match(/(?:")(\d+)(?:")/)[1];
}

function fix4chan(x) {
	return !ch._4ch ? x : x.split('<!-- Start')[0].replace(/<img/ig, '<img class="thumb"').replace(/(^|>|\s)(http:\/\/.*?)($|<|\s)/ig, '$1<a href="$2">$2</a>$3');
}

function parseHTMLdata(x) {
	var thrds = fix4chan(x.substring(x.search(/<form[^>]+del/) + x.match(/<form[^>]+del[^>]+>/).toString().length, x.lastIndexOf(x.match(/<br clear[="]+left/i)))).split(/<br clear[="]+left["\s<\/p>]+<h[r\s\/]+>/i);
	for(var i = 0, tLen = thrds.length; i < tLen; i++) {
		var tNum = getpNum(thrds[i]);
		if(!tNum) continue;
		var posts = thrds[i].split(/<table[^>]*>/);
		ajaxThrds[i] = tNum;
		ajaxPosts[tNum] = {keys: []};
		for(var j = 0, pLen = posts.length; j < pLen; j++) {
			var x = posts[j];
			var pNum = getpNum(x);
			ajaxPosts[tNum].keys.push(pNum);
			ajaxPosts[tNum][pNum] = x.substring((!/<\/td/.test(x) && /filesize">/.test(x)) ? x.indexOf('filesize">') - 13 : (/<label/.test(x) ? x.indexOf('<label') : x.indexOf('<input')), /<\/td/.test(x) ? x.lastIndexOf('</td') : (/omittedposts">/.test(x) ? x.lastIndexOf('</span') + 7 : (/<\/div/.test(x) && !ks ? x.lastIndexOf('</div') + 6 : x.lastIndexOf('</blockquote') + 13))).replace(/(href="#)(\d+")/g, 'href="' + tNum + '#$2');
			x = ajaxPosts[tNum][pNum];
			ajaxRefmap(x.substr(x.indexOf('<blockquote>') + 12).match(/&gt;&gt;\d+/g), pNum)
		}
	}
}

function parseJSONdata(x) {
	var thrds = jsonParse(x.substring(x.indexOf('threads') - 2, x.lastIndexOf('events') - 3)).threads;
	for(var i = 0, tLen = thrds.length; i < tLen; i++) {
		var tNum = thrds[i].display_id;
		var posts = thrds[i].posts;
		ajaxThrds[i] = tNum;
		ajaxPosts[tNum] = {keys: []};
		for(var j = 0, pLen = posts.length; j < pLen; j++) {
			var x = posts[j];
			var pNum = x.display_id;
			ajaxPosts[tNum].keys.push(pNum);
			var farr = [];
			for(var f = 0, fLen = x.files.length; f < fLen; f++) {
				var fl = x.files[f];
				var m = fl.metadata;
				var a = '<a href="/' + fl.src + '" target="_blank">';
				farr[farr.length] = '<div class="file"><div class="fileinfo">Файл: ' + a + fl.src.substr(fl.thumb.lastIndexOf('/') + 1) + '</a><br><em>' + fl.src.substr(fl.src.indexOf('.') + 1) + ', ' + (fl.size/1024).toFixed(2) + ' KB, ' + (!/MP3|OggVorbis/.test(m.type) ? m.width + '×' + m.height : Math.floor(m.length/60).toString() + ':' + Math.floor(m.length - Math.floor(m.length/60)*60).toString() + ' m @ ' + Math.floor(m.bitrate/1000) + 'kbps<br>' + m.artist + ' — ' + m.album + ' / ' + m.title) + '</em><br></div>' + a + '<img src="/' + fl.thumb + '" class="thumb" alt="/' + fl.src + '"></a></div>';
			}
			ajaxPosts[tNum][pNum] = '<label><a class="delete icon"><img src="/images/blank.png"></a>' + (x.sage ? '<img src="/images/sage-carbon.png" alt="Сажа" title="Сажа">' : '') + (x.subject ? '<span class="replytitle">' + x.subject + '</span>' : '') + '<span class="postername">' + x.name + '</span> ' + x.date + ' </label><span class="reflink"><a href="/' + board + '/res/' + tNum + '.xhtml#i' + pNum + '">No.' + pNum + '</a></span>' + (j == 0 ? '<span class="cpanel">[<a href="/' + board + '/res/' + tNum + '.xhtml">Открыть тред</a>]</span>' : '') + '<br>' + (x.files.length > 0 ? farr.join('') + (x.files.length > 1 ? '<br style="clear: both">' : '') : '') + '<div class="postbody"><div class="message">' + (x.message || '').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/(&gt;&gt;)(\d+)/g, '<a href="/' + board + '/res/' + tNum + '.xhtml#i$2">&gt;&gt;$2</a>').replace(/(http:\/\/.*?)(?:\s|&gt;|$)/ig, '<a href="$1">$1</a>').replace(/(\*\*)([^\r\n]+)(\*\*)/g, '<b>$2</b>').replace(/(\*)([^\r\n]+)(\*)/g, '<i>$2</i>').replace(/(%%)([^\r\n]+)(%%)/g, '<span class="spoiler">$2</span>').replace(/(?:^|\s)([^\s]+)(\^W|\^H)+/g, '<del>$1</del>').replace(/(?:^|[\r\n]+)(&gt;.*?)(?:[\r\n]+|$)/gm, '<blockquote depth="0">$1</blockquote>').replace(/([\r\n]+)/g, '<br>$1') + '</div></div>' + (x.op == true ? '<div class="abbrev">' + 'Всего ' + thrds[i].posts_count + ' постов, из них ' + thrds[i].files_count + ' с файлами</div>' : '');
			ajaxRefmap((x.message || '').match(/>>\d+/g), pNum);
		}
	}
}

function AJAX(isThrd, b, id, fn) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if(xhr.readyState != 4) return;
		if(xhr.status == 200) {
			if(ch.dc) parseJSONdata(xhr.responseText);
			else parseHTMLdata(xhr.responseText);
			fn();
		} else fn('HTTP ' + xhr.status + ' ' + xhr.statusText);
	};
	xhr.open('GET', (isThrd
		? (ch.dc 
			? '/api/thread/new/' + b + '/' + id + '.json?last_post=0'
			: '/' + b + '/res/' + id + '.html')
		: ('/' + b + '/' + (ch.dc
			? ((id != '' ? id : 'index') + '.json?last_post=0')
			: (id != '' ? id + '.html' : '')))
	), true);
	xhr.send(false);
}

function newPost(thr, tNum, i, isCount, del) {
	var pNum = ajaxPosts[tNum].keys[i];
	var html = ajaxPosts[tNum][pNum];
	var post = thr.appendChild($new(i > 0 ? 'table' : 'div', {
		'class': (i > 0 ? 'replypost' : 'oppost'),
		'id': 'post_' + pNum,
		'html': (i > 0 ? '<tbody><tr><td class="doubledash">&gt;&gt;</td><td class="reply" id="reply'
			+ pNum + '">' + html + '</td></tr></tbody>' : html)
	}));
	if(i == 0) oPosts[oPosts.length] = post;
	else Posts[Posts.length] = post;
	postByNum[pNum] = post;
	post.Num = pNum;
	post.Count = i + 1 + (del ? del : 0);
	if(!(sav.cookie && main)) post.Vis = getVisib(pNum);
	post.Msg = getPostMsg(post);
	post.Text = getText(post.Msg).trim();
	post.Img = $x('.//img[@class="thumb"]', post);
	post.isOp = i == 0;
	addPostButtons(post, isCount);
	doPostFilters(post);
	if(post.Vis == 0) setPostVisib(post, 0);
	if(Cfg[15] == 1) mergeHidden(post);
	doRefMap(post);
	if(Cfg[21] != 0) expandHandleImg(post);
	doRefPreview(post.Msg);
	addYouTube(post);
	addMP3(post);
	return post;
}

function expandPost(post) {
	if(post.Vis == 0 || !$x('.//div[@class="abbrev"]|.//span[@class="abbr"]', post)) return;
	var tNum = getThread(post).id.match(/\d+/);
	AJAX(true, board, tNum, function() {
		var txt = ajaxPosts[tNum][post.Num];
		post.Msg = $html(post.Msg,
			txt.substring(txt.indexOf('<blockq') + 12, txt.lastIndexOf('</blockq')));
		post.Text = getText(post.Msg);
		doRefPreview(post.Msg);
		addYouTube(post);
		addMP3(post);
	});
}

function expandThread(thr, tNum, last) {
	var len = ajaxPosts[tNum].keys.length;
	if(last != 1) last = len - last;
	if(last <= 0) last = 1;
	for(var i = last; i < len; i++)
		newPost(thr, tNum, i, true);
	if(!sav.cookie) storeHiddenPosts();
	$close($id('DESU_alert_wait'));
}

function loadThread(post, last) {
	$alert('Загрузка...', 'wait');
	var thr = getThread(post);
	var tNum = post.Num;
	if(Cfg[26] == 1 && wk) expandPost(post);
	AJAX(true, board, tNum, function() {
		$del($x('.//span[@class="omittedposts" or @class="abbr"]|.//div[@class="abbrev"]', thr));
		$del($id('rfmap_' + tNum));
		delNexts(post);
		expandThread(thr, tNum, last);
	});
}

function loadFavorThread(parent, b, tNum) {
	var thr = $x(ITT, parent);
	if(thr) $del(thr);
	else {
		$alert('Загрузка...', 'wait');
		AJAX(true, b, tNum, function(err) {
			var thr = parent.appendChild($new('div', {
				'class': 'thread',
				'id': tNum,
				'style': 'padding-left:15px; border:1px solid grey'
			}));
			if(!ajaxPosts[tNum]) {$alert(err); return}
			newPost(thr, tNum, 0, true);
			expandThread(thr, tNum, 5);
		});
	}
}

function initNewPosts() {
	if(main) return;
	var C = Cfg[43];
	var t = (C == 0 ? 0.5 : (C == 1 ? 1 : (C == 2 ? 1.5
		: (C == 3 ? 2 : (C == 4 ? 5 : (C == 5 ? 15 : 30))))))*60000;
	if(Cfg[19] == 1) {
		$after($x(ITT), [$new('span', {
			'id': 'newpst_btn',
			'style': 'cursor:pointer',
			'html': '[<i><a>Получить новые посты</a></i>]'}, {
			'click': function() {loadNewPosts(true)}
		})]);
		if(Cfg[44] == 1) {
			$alert('ITT новых постов: 0', 'newpst');
			ajaxInterval = setInterval(function() {
				AJAX(true, board, oPosts[0].Num, function(err) {infoNewPosts(err)});
			}, t);
		}
	}
	if(Cfg[19] == 2) ajaxInterval = setInterval(function() {loadNewPosts()}, t);
}

function infoNewPosts(err, nul) {
	if(Cfg[44] == 0) return;
	if(err) {
		$alert('Тред №' + oPosts[0].Num + ' недоступен:\n' + err);
		clearInterval(ajaxInterval);
	} else if(Cfg[19] == 1)
		$alert('ITT новых постов: ' + (nul ? '0'
			: parseInt(ajaxPosts[oPosts[0].Num].keys.length - Posts.length - 1)), 'newpst');
}

function loadNewPosts(inf) {
	if(inf) $alert('Загрузка...', 'wait');
	var tNum = oPosts[0].Num;
	AJAX(true, board, tNum, function(err) {
		infoNewPosts(err, true);
		var del = 0;
		for(var i = 0, len = Posts.length; i < len; i++)
			if(!ajaxPosts[tNum][Posts[i].Num]) {
				$attr($x('.//i[@class="pcount"]' ,Posts[i]), {
					'style': 'color:#727579',
					'text': 'удалён'
				});
				del++;
			}
		for(var i = Posts.length - del + 1, len = ajaxPosts[tNum].keys.length; i < len; i++)
			newPost($x(ITT), tNum, i, true, del);
		storeHiddenPosts();
		$close($id('DESU_alert_wait'));
	});
}

function loadPages(len) {
	for(var p = 0; p < len; p++) {
		if(p == 0) $alert('Загрузка...', 'wait');
		AJAX(false, board, p == 0 ? '' : p, function(p, len) {return function() {
			if(p == 0) {
				delChilds(dForm);
				Posts = [];
				oPosts = [];
			}
			for(var i = 0, tLen = ajaxThrds.length; i < tLen; i++) {
				var tNum = ajaxThrds[i];
				var thr = $new('div', {'class': 'thread', 'id': tNum});
				$append(dForm, [thr, $new('br', {'clear': 'left'}), $new('hr')]);
				for(var j = 0, pLen = ajaxPosts[tNum].keys.length; j < pLen; j++) {
					var post = newPost(thr, tNum, j, false);
					if(Cfg[26] == 1 && wk) expandPost(post);
				}
			}
			if(!sav.cookie) storeHiddenPosts();
			readThreadsVisib();
			if(p == len - 1) $close($id('DESU_alert_wait'));
		}}(p, len));
	}
}


/*=============================================================================
								HIDERS / FILTERS
=============================================================================*/

function hideThread(post, note) {
	if(post.Vis == 0) return;
	togglePost(post, 0);
	var x = $new('div', {
		'class': 'reply',
		'id': 'hiddenthr_' + post.Num,
		'style': 'display:inline; cursor:default',
		'html': 'Тред <a style="cursor:pointer">№' + post.Num + '</a> скрыт <i>('
			+ (!note ? getTitle(post).substring(0, 50) : 'autohide: ' + note) + ')' + '</i>'
	});
	$event($x('.//a', x), {
		'click': function() {togglePost(post, 1); unhideThread(post)},
		'mouseover': function() {togglePost(post, 1)},
		'mouseout': function() {togglePost(post, 1)}
	});
	$before($up(post), [x]);
	if(Cfg[15] == 2) {$disp(x); $disp($next($next(x))); $disp($next($next($next(x))))}
}

function unhideThread(post) {
	if(post.Vis == 1) return;
	togglePost(post, 1);
	$del($id('hiddenthr_' + post.Num));
	storeThreadVisib(post, 1);
}

function prevHidden(e) {togglePost(getPost(this), 1)}
function unprevHidden(e) {togglePost(getPost(this), 0)}

function applyPostVisib(post, vis) {
	if(post.isOp) return;
	if(!sav.cookie) {
		Visib[board + post.Num] = vis;
		Expires[board + post.Num] = (new Date()).getTime() + STORAGE_LIFE;
	} else Visib[post.Count] = vis;
	post.Vis = vis;
	if(Cfg[15] == 2) post.style.display = (vis == 0) ? 'none' : '';
}

function setPostVisib(post, vis) {
	if(post.isOp) {
		if(vis == 0) hideThread(post);
		else unhideThread(post);
		return;
	}
	$x('.//span', post.Btns).className = (vis == 0) ? 'unhide_icn' : 'hide_icn';
	togglePost(post, vis);
	applyPostVisib(post, vis);
	if(Cfg[16] == 0) return;
	var reflink = $prev(post.Btns);
	if(vis == 0) $event(reflink, {'mouseover': prevHidden, 'mouseout': unprevHidden});
	else $revent(reflink, {'mouseover': prevHidden, 'mouseout': unprevHidden});
}

function togglePostVisib(post) {
	post.Vis = (post.Vis == 1) ? 0 : 1;
	setPostVisib(post, post.Vis);
	storePostsVisib();
}

function hidePost(post, note) {
	if(!post.isOp) {
		if(post.Vis != 0) addNote(post, ' autohide: ' + note + ' ');
		applyPostVisib(post, 0);
	} else if(Cfg[18] == 1) {
		hideThread(post, note);
		storeThreadVisib(post, 0);
	}
}

function unhidePost(post) {
	if(!post.isOp) {
		if(detectWipe(post) != null) return;
		setPostVisib(post, 1);
		$del($id('note_' + post.Num));
		hideByWipe(post);
	} else if(Cfg[18] == 1) unhideThread(post);
}

function storeHiddenPosts() {
	forPosts(function(post) {if(post.Vis == 0) setPostVisib(post, 0)});
	storePostsVisib();
}

function togglePost(post, vis) {
	if(wk) $del($x('.//img[@id="full_img"]', post));
	if(post.isOp) $disp($up(post));
	$each($X(
		'.//br|.//small|.//div[starts-with(@id,"rfmap")]'
		+ (!ch.dc 
			? '|.//blockquote|.//a[@target="_blank"]|.//span[@class="filesize"]|.//div[@class="nothumb"]' 
			: '|.//div[@class="postbody" or @class="file" or @class="fileinfo"]') 
		+ (wk ? '|.//span[@class="thumbnailmsg"]' : '')
		+ (post.isOp ? '|.//span[@class="omittedposts"]|.//div[@class="abbrev"]' : '')
	, post), function(el) {el.style.display = (vis == 0) ? 'none' : ''});
}

function mergeHidden(post) {
	if(post.Vis != 0) return;
	var div = $prev(post);
	if(!/merged/.test(div.id)) {
		div = $new('div', {'id': 'merged_' + post.Num, 'style': 'display:none'});
		$before(post, [$new('span', {
			'style': 'display:block; cursor:pointer'}, {
			'click': function() {
				var hDiv = $id('merged_' + post.Num);
				$prev(hDiv).innerHTML = 
					(hDiv.style.display == 'none' ? unescape('%u25BC') : unescape('%u25B2'))
					+ '[<i><a>Скрыто:</a> ' + hDiv.childNodes.length + '</i>]';
				$disp(hDiv);
			}}
		), div]);
	}
	div.appendChild(post);
	var next = $next(post);
	if(!next || getVisib(next.id.match(/\d+/)) == 1)
		$prev(div).innerHTML =
			unescape('%u25B2') + '[<i><a>Скрыто:</a> ' + div.childNodes.length + '</i>]';
}

function processHidden(newCfg, oldCfg) {
	if(newCfg == 2 || oldCfg == 2) {
		forPosts(function(post) {if(post.Vis == 0) $disp(post)});
		if(Cfg[18] == 1)
			$each($X('.//div[starts-with(@id,"hiddenthr_")]'), function(x) {
				$disp(x);
				$disp($next($next(x))); $disp($next($next($next(x))));
			});
	}
	if(oldCfg == 1)
		$each($X('.//div[starts-with(@id,"merged_")]'), function(div) {
			var px = div.childNodes;
			var i = px.length;
			while(i--) $after(div, [px[i]]);
			$del($prev(div));
			$del(div);
		});
	if(newCfg == 1) forAll(mergeHidden);
	saveCfg(15, newCfg);
}

function showLast50() {
	var div = $id('last50');
	if(!div) {
		div = $new('div', {'id': 'last50', 'style': 'display:none'});
		$before(Posts[0], [div]);
		for(var i = 0; i < Posts.length - 50; i++)
			div.appendChild(Posts[i]);
	} else $disp(div);
}

/*-----------------------------------Filters---------------------------------*/

function doPostFilters(post) {
	if(post.Vis == 0) return;
	var C = Cfg;
	if(C[0] == 1) hideByWipe(post);
	if(C[8] == 1 && !ch.iich) hideBySage(post);
	if(C[9] == 1 && pfSubj && !post.isOp) hideByTitle(post);
	if(C[10] == 1) hideByNoText(post);
	if(C[11] == 1) hideByNoImage(post);
	if(C[12] == 1) hideByMaxtext(post);
	if(C[14] == 1) hideByRegexp(post);
}

function hideBySage(post) {
	if(isSage(post)) hidePost(post, 'sage')
}
function toggleSage() {
	toggleCfg(8);
	if(Cfg[8] == 1) forAll(hideBySage);
	else forAll(function(post) {if(isSage(post)) unhidePost(post)});
	storeHiddenPosts();
}

function hideByNoText(post) {
	if(post.Text == '') hidePost(post, 'no text')
}
function toggleNotext() {
	toggleCfg(10);
	if(Cfg[10] == 1) forAll(hideByNoText);
	else forAll(function(post) {if(post.Text == '') unhidePost(post)});
	storeHiddenPosts();
}

function hideByNoImage(post) {
	if(!post.Img) hidePost(post, 'no image')
}
function toggleNoimage() {
	toggleCfg(11);
	if(Cfg[11] == 1) forAll(hideByNoImage);
	else forAll(function(post) {if(!post.Img) unhidePost(post)});
	storeHiddenPosts();
}

function hideByTitle(post) {
	if(isTitled(post)) hidePost(post, 'theme field');
}
function toggleTitle() {
	toggleCfg(9);
	if(Cfg[9] == 1) forPosts(hideByTitle);
	else forPosts(function(post) {if(isTitled(post)) unhidePost(post)});
	storeHiddenPosts();
}

function hideByMaxtext(post) {
	var len = post.Text.replace(/\n/g, '').length;
	if(len >= parseInt(Cfg[13]))
		hidePost(post, 'text n=' + len + ' > max');
}
function toggleMaxtext() {
	var fld = $id('maxtext_field');
	if(isNaN(fld.value)) {
		$id('maxtext_hider').checked = false;
		saveCfg(12, 0);
		$alert('введите число знаков');
		return;
	}
	toggleCfg(12);
	saveCfg(13, fld.value);
	if(Cfg[12] == 1) forAll(hideByMaxtext);
	else forAll(function(post) {
		if(post.Text.replace(/\n/g, '').length >= parseInt(Cfg[13]))
		unhidePost(post);
	});
	storeHiddenPosts();
}

/*--------------------------Hide posts by expressions------------------------*/

function hideByRegexp(post) {
	var exp = doRegexp(post);
	if(exp) hidePost(post, 'match ' + exp.substring(0, 20) + '..');
}

function applyRegExp(txt) {
	var fld = $id('regexp_field');
	var val = fld.value.trim();
	if(txt) {
		if(txt.trim() == '') return;
		toggleRegexp();
		var nval = '\n' + val;
		var ntxt = '\n' + txt;
		val = (nval.indexOf(ntxt) > -1 ? nval.split(ntxt).join('') : val + ntxt).trim();
	}
	fld.value = val;
	forAll(function(post) {if(doRegexp(post)) unhidePost(post)})
	setStored(ID('RegExpr'), val);
	$id('regexp_hider').checked = val != '';
	if(val != '') {
		saveCfg(14, 1);
		forAll(hideByRegexp);
		storeHiddenPosts();
	} else saveCfg(14, 0);
}

function toggleRegexp() {
	var val = $id('regexp_field').value.trim();
	setStored(ID('RegExpr'), val);
	if(val != '') {
		toggleCfg(14);
		if(Cfg[14] == 1) forAll(hideByRegexp);
		else forAll(function(post) {if(doRegexp(post)) unhidePost(post)})
		storeHiddenPosts();
	} else {
		$id('regexp_hider').checked = false;
		saveCfg(14, 0);
	}
}

function doRegexp(post) {
	var expr = getStored(ID('RegExpr')).split('\n');
	var pname = $x('.//span[@class="commentpostername" or @class="postername"]', post);
	var ptrip = $x('.//span[@class="postertrip"]', post);
	var ptitle = $x('.//span[@class="replytitle" or @class="filetitle"]', post);
	var i = expr.length;
	while(i--) {
		var x = expr[i].trim();
		if(/\$rep /.test(x)) {
			var re = x.split(' ')[1];
			var l = re.lastIndexOf('/');
			var wrd = x.substr(x.indexOf(re) + re.length + 1);
			re = new RegExp(re.substr(1, l - 1), re.substr(l + 1));
			post.Msg = $html(post.Msg, post.Msg.innerHTML.replace(re, wrd));
			doRefPreview(post.Msg);
		}
		if(/\$img /.test(x)) {
			if(!post.Img) continue;
			var img = doImgRegExp(post, x.split(' ')[1]);
			if(img != null) return img; else continue;
		}
		if(/\$name /.test(x)) {
			x = x.split(' ')[1];
			var nm = x.split(/!+/)[0];
			var tr = x.split(/!+/)[1];
			if(pname && nm != '' && pname.textContent.indexOf(nm) > -1 ||
				ptrip && tr != '' && ptrip.textContent.indexOf(tr) > -1) return x;
		}
		if(/\$exp /.test(x)) {
			x = x.split(' ')[1];
			var l = x.lastIndexOf('/');
			var re = new RegExp(x.substr(1, l - 1), x.substr(l + 1));
			if(post.Text.match(re)) return x;
			if(ptitle && re.test(ptitle.textContent)) return x;
		}
		if(x == '$alltrip' && ptrip) return x;
		x = x.toLowerCase();
		if(ptitle && ptitle.textContent.toLowerCase().indexOf(x) > -1) return x;
		if(post.Text.toLowerCase().indexOf(x) > -1) return x;
	}
}

function regExpImage(post) {
	if(!post.Img) {
		toggleNoimage();
		toggleChk($id('noimage_hider'));
	} else applyRegExp('$img =' + getImgWeight(post) + '@' + getImgSize(post));
}

function doImgRegExp(post, expr) {
	if(expr == '') return;
	var s = expr.split('@');
	var stat = s[0].substring(0, 1);
	var expK = s[0].substring(1);
	if(expK != '') {
		var imgK = getImgWeight(post);
		if((stat == '<' && imgK < expK) ||
			(stat == '>' && imgK > expK) ||
			(stat == '=' && imgK == expK))
			{if(!s[1]) return('image ' + expr)}
		else return;
	}
	if(s[1]) {
		var x = s[1].split(/[x|×]/);
		var expW = x[0], expH = x[1];
		var sz = getImgSize(post).split(/[x|×]/);
		var imgW = sz[0], imgH = sz[1];
		if((stat == '<' && imgW < expW && imgH < expH) ||
			(stat == '>' && imgW > expW && imgH > expH) ||
			(stat == '=' && (imgW == expW && imgH == expH)))
			return 'image ' + expr;
	}
}

function getImgWeight(post) {
	var inf = $x('.//em|.//span[@class="filesize"]', post).textContent.match(/\d+[\.\d\s|m|k|к]*[b|б]/i)[0];
	var w = parseFloat(inf.match(/[\d|\.]+/));
	if(/MB/.test(inf)) w = w*1000;
	if(/\d[\s]*B/.test(inf)) w = (w/1000).toFixed(2);
	return w;
}

function getImgSize(post) {
	return $x('.//em|.//span[@class="filesize"]', post).textContent.match(/\d+[x|×]\d+/)[0];
}

/*-------------------------Hide posts with similar text----------------------*/

function getWrds(post) {
	return post.Text.replace(/\s+/g, ' ').replace(/[\?\.\\\/\+\*\$\^\(\)\|\{\}\[\]!@#%_=:;<,-]/g, '').substring(0, 1000).split(' ');
}

function hideBySameText(post) {
	if(post.Text == '') {
		toggleNotext();
		toggleChk($id('notext_hider'));
		return;
	}
	var vis = post.Vis;
	forAll(function(target) {findSameText(target, post, vis, getWrds(post))});
	storeHiddenPosts();
}

function findSameText(post, origPost, origVis, origWords) {
	var words = getWrds(post);
	var origLen = origWords.length;
	if(words.length > origLen*2.5 || words.length < origLen*0.5) return;
	var matchCount = 0;
	var i = origWords.length;
	while(i--) {
		if(origWords.length > 6 && origWords[i].length < 3) {origLen--; continue}
		var j = words.length;
		while(j--) if(words[j] == origWords[i])
			if(origWords[i].substring(0, 2) == '>>' && words[j].substring(0, 2) == '>>')
				matchCount++;
	}
	if(!(matchCount >= origLen*0.5 && words.length < origLen*2.5)) return;
	$del($id('note_' + post.Num));
	if(origVis != 0) hidePost(post, ' same text as >>' + origPost.Num);
	else unhidePost(post);
}


/*=============================================================================
								WIPE DETECTORS
=============================================================================*/

function detectWipe(post) {
	var detectors = [
		detectWipe_sameLines,
		detectWipe_sameWords,
		detectWipe_specSymbols,
		detectWipe_longColumn,
		detectWipe_longWords,
		detectWipe_numbers,
		detectWipe_caseWords
	];
	for(var i = 0; i < detectors.length; i++) {
		var detect = detectors[i](post.Text);
		if(detect != null) return detect;
	}
}

function hideByWipe(post) {
	if(post.Vis == 0 || post.Vis == 1) return;
	var note = detectWipe(post);
	if(note != null) hidePost(post, note);
	else applyPostVisib(post, 1);
}

function detectWipe_sameLines(txt) {
	if(Cfg[1] == 0) return;
	var lines = txt.replace(/> /g, '').split('\n');
	var len = lines.length;
	if(len < 5) return;
	var arr = [], n = 0;
	for(var i = 0; i < len; i++)
		if(lines[i].length > 0) {n++; incc(arr, lines[i])}
	for(var x in arr)
		if(arr[x] > n/4 && arr[x] >= 5)
			return 'same lines: "' + x.substr(0, 20) + '" x' + parseInt(arr[x] + 1);
}

function detectWipe_sameWords(txt) {
	if(Cfg[2] == 0) return;
	txt = txt.replace(/[\s\.\?\!,>]+/g, ' ').toUpperCase();
	var words = txt.split(' ');
	var len = words.length;
	if(len <= 13) return;
	var arr = [], n = 0;
	for(var i = 0; i < len; i++)
		if(words[i].length > 1) {n++; incc(arr, words[i])}
	if(n <= 10) return;
	var keys = 0, pop = '', mpop = -1;
	for(var x in arr) {
		keys++;
		if(arr[x] > mpop) {mpop = arr[x]; pop = x}
		if(n > 25 && arr[x] > n/3.5)
			return 'same words: "' + x.substr(0, 20) + '" x' + arr[x];
	}
	pop = pop.substr(0, 20);
	if((n > 80 && keys <= 20) || n/keys > 7)
		return 'same words: "' + pop + '" x' + mpop;
}

function detectWipe_specSymbols(txt) {
	if(Cfg[3] == 0) return;
	txt = txt.replace(/\s+/g, '');
	var all = txt; 
	txt = txt.replace(/[0-9a-zа-я\.\?!,]/ig, '');
	var proc = txt.length/all.length;
	if(all.length > 30 && proc > 0.4)
		return 'specsymbols: ' + parseInt(proc*100) + '%';
}

function detectWipe_longColumn(txt) {
	if(Cfg[4] == 0) return;
	var n = 0;
	var rows = txt.split('\n');
	var len = rows.length;
	for(var i = 0; i < len; i++) {
		if(rows[i].length < 9) n++;
		else return;
	}
	if(len > 45) return 'long text x' + len;
	if(n > 5) return 'columns x' + n;
}

function detectWipe_longWords(txt) {
	if(Cfg[5] == 0) return;
	txt = txt.replace(/http:\/\/.*?[\s|$]/g, '').replace(/[\s\.\?!,>:;-]+/g, ' ');
	var words = txt.split(' ');
	var n = 0, all = '', lng = '';
	for(var i = 0, len = words.length; i < len; i++)
		if(words[i].length > 1) {
			n++;
			all += words[i];
			lng = words[i].length > lng.length ? words[i] : lng;
		}
	if((n == 1 && lng.length > 70) || (n > 1 && all.length/n > 12))
		return 'long words: "' + lng.substr(0, 20) + '.."';
}

function detectWipe_numbers(txt) {
	if(Cfg[6] == 0) return;
	txt = txt.replace(/\s+/g, ' ').replace(/>>\d+|http:\/\/.*?[\s|$]/g, '');
	var len = txt.length;
	var proc = (len - txt.replace(/[0-9]/g, '').length)/len;
	if(len > 30 && proc > 0.4) return 'numbers: ' + parseInt(proc*100) + '%';
}

function detectWipe_caseWords(txt) {
	if(Cfg[7] == 0) return;
	txt = txt.replace(/[\s+\.\?!,-]+/g, ' ');
	var words = txt.split(' ');
	var len = words.length;
	if(len <= 4) return;
	var n = 0, all = 0, caps = 0;
	for(var i = 0; i < len; i++) {
		if(words[i].length < 5) continue;
		all++;
		var word = words[i];
		var up = word.toUpperCase();
		var lw = word.toLowerCase();
		var upc = 0, lwc = 0;
		var cap = word.match(/[a-zа-я]/ig);
		if(cap) {
			cap = cap.toString().trim();
			if(cap != '' && cap.toUpperCase() == cap) caps++;
		}
		for(var j = 0; j < word.length; j++) {
			if(up.charAt(j) == lw.charAt(j)) continue;
			if(word.charAt(j) == up.charAt(j)) upc++;
			else if(word.charAt(j) == lw.charAt(j)) lwc++;
		}
		var min = upc < lwc ? upc : lwc;
		if(min >= 2 && lwc + upc >= 5) n++;
	}
	if(n/all >= 0.3 && all > 8) return 'cAsE words: ' + parseInt(n/len*100) + '%';
	if(caps/all >= 0.3 && all > 5) return 'CAPSLOCK';
}


/*=============================================================================
								INITIALIZATION
=============================================================================*/

function initBoard() {
	if(/submitcheck/.test(window.name)) return false;
	var ua = navigator.userAgent;
	nav = {
		Firefox: /firefox|minefield/i.test(ua),
		Opera: /opera/i.test(ua),
		Chrome: /chrome/i.test(ua)
	};
	var ls = !nav.Firefox && typeof localStorage === 'object' && localStorage != null;
	sav = {
		GM: nav.Firefox,
		local: ls,
		cookie: !ls && !nav.Firefox
	};
	var dm = location.hostname.match(/(?:(?:[^.]+\.)(?=org\.))?[^.]+\.[^.]+$/)
	ch = {
		_0ch: dm == '0chan.ru',
		_2ch: dm == '2-ch.ru',
		iich: dm == 'iichan.ru',
		dc: dm == 'dobrochan.ru',
		unyl: dm == 'wakachan.org',
		nowr: dm == 'nowere.net',
		_410: dm == '410chan.ru',
		sib: dm == 'sibirchan.ru',
		same: dm == 'samechan.ru',
		horo: dm == 'horochan.ru',
		ne2: dm == 'ne2.ch',
		_4ch: dm == '4chan.org'
	};
	domain = dm;
	wk = !ch.dc && !ch._0ch;
	ks = ch._410 || ch.sib || ch.same || ch.horo;
	wakaba = wk && !ks;
	main = !/\/res\//.test(location.pathname);
	board = location.pathname.substr(1).split('/')[0];
	hasSage = !(ch.iich || ch.sib);
	dForm = $x('.//form[@id="delform" or @name="delform" or contains(@action, "delete")]');
	if(!dForm) return false;
	ITT = './/div[@class="thread"]';
	pForm = $id('postform') || $n('post');
	qForm = pfName = pfMail = pfSubj = pfPass = pfGoto = pfRules = undefined;
	if(!pForm) return true;
	postarea = $x('.//div[@class="postarea"]');
	pfSubm = $x('.//input[@type="submit"]', pForm);
	pfCap = $n('captcha') || $n('faptcha');
	pfTxt = $x('.//textarea', pForm);
	pfFile = $x('.//input[@type="file"]', pForm);
	pfRules = $x('.//*[@class="rules"]');
	pfGoto = $id('trgetback');
	if(!pfGoto) var pfg = $x('.//input[@type="radio" or @name="gotothread"]');
	if(pfg) pfGoto = $up(pfg, 3);
	if(!ch.unyl) pfPass = $x('.//input[@type="password"]', pForm);
	if(ch._2ch)
		pfName = $n('akane'),
		pfMail = $n('nabiki'),
		pfSubj = $n('kasumi');
	if(ch._0ch || ks)
		pfName = $n('name'),
		pfMail = $n('em'),
		pfSubj = $n('subject');
	if(ch.iich)
		pfName = $n('nya1'),
		pfMail = $n('nya2'),
		pfSubj = $n('nya3');
	if(ch.dc)
		pfName = $n('name'),
		pfMail = $n('sage'),
		pfSubj = $n('subject');
	if(ch.unyl || ch.nowr || ch.ne2)
		pfName = $n('field1'),
		pfMail = $n('dont_bump') || $n('field2'),
		pfSubj = $n('field3');
	if(ch._4ch)
		pfName = $n('name'),
		pfMail = $n('email'),
		pfSubj = $n('sub');
	return true;
}

function initDelform() {
	if(nav.Chrome) $disp(dForm);
	var thrdivs = $X('./div[starts-with(@id, "thread")]', dForm);
	if(thrdivs.snapshotLength == 0) {
		var thrds = dForm.innerHTML.split(/<br clear="left"[<\/p>\s]*<hr>/i);
		var i = thrds.length - 1;
		while(i--) {
			var posts = thrds[i].split(/<table[^>]*>/i);
			var j = posts.length;
			while(j-- > 1)
				posts[j] = ['<table class="replypost" id="post_', getpNum(posts[j]) + '">', posts[j]].join('');
			var tNum = getpNum(posts[0]);
			posts[0] = ['<div class="oppost" id="post_', tNum, '">', posts[0], '</div>'].join('');
			thrds[i] = ['<div class="thread" id="thread_', tNum, '">', posts.join(''), '</div>'].join('');
		}
		var html = thrds.join('<br clear="left"><hr>');
		if(!nav.Chrome) $disp(dForm);
		dForm = $html(dForm, fix4chan(html));
		if(!nav.Chrome) $disp(dForm);
	} else
		$each(thrdivs, function(thr) {
			$attr(thr, {'id': $prev($x('.//label', thr)).name, 'class': 'thread'});
		})
	if(!$x('.//div[starts-with(@class,"oppost")]') && !ch._0ch) {
		$each($X('.//td[@class="reply"]', dForm), function(reply) {
			$attr($up(reply, 3), {'class': 'replypost', 'id': 'post_' + reply.id.match(/\d+/)});
		});
		$each($X('.//div[@class="thread" or starts-with(@id, "thread")]', dForm), function(thr) {
			var op = $new('div', {'class': 'oppost', 'id': 'post_' + thr.id.match(/\d+/)});
			var nodes = thr.childNodes;
			var arr = [], x = 0;
			for(var el, j = 1; el = nodes[j++];) {
				if(el.tagName == 'TABLE' || $x('self::div[starts-with(@id,"replies")]', el)) break;
				arr[x++] = el;
			}
			for(var el, j = 0; el = arr[j++];)
				op.appendChild(el);
			$before($1(thr), [op]);
		});
	}
	if(ch._0ch) {
		$each($X('.//div[@class="postnode"]'), function(post) {
			var reply = $x('.//td[@class="reply"]', post);
			post.id = reply
				? 'post_' + reply.id.match(/\d+/)
				: 'oppost_' + $up(post).id.match(/\d+/);
		});
		var px = './/div[starts-with(@id,"post")]';
		var opx = './/div[starts-with(@id,"oppost")]';
	} else {
		var px = './/table[starts-with(@class,"replypost")]';
		var opx = './/div[starts-with(@class,"oppost")]';
	}
	$each($X(px, dForm), function(post, i) {
		Posts[i] = post;
		post.isOp = false;
		post.Count = i + 2;
	});
	$each($X(opx, dForm), function(post, i) {
		oPosts[i] = post;
		post.isOp = true;
		post.Count = 1;
	});
	forAll(function(post) {
		post.Msg = getPostMsg(post);
		post.Num = post.id.match(/\d+/);
		post.Text = getText(post.Msg).trim();
		post.Img = $x('.//img[@class="thumb"]', post);
		postByNum[post.Num] = post;
	});
}


/*=============================================================================
									MAIN
=============================================================================*/

function doScript() {
	var initTime = (new Date()).getTime();
	oldTime = initTime; timeLog = '';
	if(!initBoard()) return;		Log('initBoard');
	initDelform();					Log('initDelform');
	initCfg();						Log('initCfg');
	readPostsVisib();				Log('readPostsVisib');
	readThreadsVisib();				Log('readThreadsVisib');
	addControls();					Log('addControls');
	doChanges();					Log('doChanges');
	forAll(addPostButtons);			Log('addPostButtons');
	doRefPreview();					Log('doRefPreview');
	doRefMap();						Log('doRefMap');
	forAll(doPostFilters);			Log('doPostFilters');
	storeHiddenPosts();				Log('storeHiddenPosts');
	initNewPosts();					Log('initNewPosts');
	if(Cfg[15] == 1) {
		forPosts(mergeHidden);		Log('mergeHidden')}
	allImgExpander();
	if(Cfg[21] != 0)
		forAll(expandHandleImg);	Log('expandImg');
	if(Cfg[26] == 1 && main && wk) {
		forAll(expandPost);			Log('expandPost')}
	addMP3();						Log('addMP3');
	addYouTube();					Log('addYouTube');
	scriptStyles();					Log('scriptStyles');
	var endTime = oldTime - initTime;
	timeLog += '\n\nTotal: ' + endTime + 'ms';
	$id('process_time').textContent = 'Время обработки: ' + endTime + 'ms';
}

if(window.opera) $event(doc, {'DOMContentLoaded': doScript});
else doScript();
})();