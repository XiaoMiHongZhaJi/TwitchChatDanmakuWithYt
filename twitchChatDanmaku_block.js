let $logDiv = null;
let $ytChatDiv = null;
let $overlay = null;
let layers = 0;
let isVideoChat = false;
let fontList = null;
let isTwitch = false;

let settings = {};
console.log("TwitchChatDanmakuWithYt 已加载");

function sendMessage(type, data) {
	chrome.runtime.sendMessage({ type, data });
}

function findLogDiv() {
	return new Promise((resolve, reject) => {
		let timer = setInterval(() => {
			let _$logDiv = $('div[role=log]');
			// let _$logDiv = $('div[role=log]');
			if (_$logDiv && _$logDiv[0]) {
				$logDiv = $(_$logDiv[0]);
				clearInterval(timer);
				isVideoChat = false;
				resolve($logDiv);
			} else {
				_$logDiv = $('.video-chat ul');
				if (_$logDiv && _$logDiv[0]) {
					$logDiv = $(_$logDiv[0]);
					clearInterval(timer);
					isVideoChat = true;
					resolve($logDiv);
				}
			}
		}, 500);
	});
}

function createOverlay() {
	return new Promise((resolve) => {
		if ($('#danmaku_overlay') && $('#danmaku_overlay').length > 0) {
			$overlay = $('#danmaku_overlay');
			resolve();
			return;
		}

		let timer = setInterval(() => {
			let streamPlayer =
				document.querySelector('.passthrough-events') ||
				document.querySelector('.video-player__container') ||
				document.querySelector('.highwind-video-player__overlay') ||
				document.querySelector('[class*=video-player]');

			if (streamPlayer) {
				streamPlayer.insertAdjacentHTML('beforeend', '<div id="danmaku_overlay"></div>');
				$overlay = $('#danmaku_overlay');
				clearInterval(timer);
				resolve();
			}
		}, 500);
	});
}

function digestChatDom(dom) {
	if (!dom) return null;
	let username = $(dom).find('span[data-a-target=chat-message-username]').html();
	let message = $(dom).find("span[data-a-target=chat-message-text]").html();
	if (!username) return;
	// if (isVideoChat) {
	// 	dom = $(dom).find('.tw-flex-grow-1')[0];
	// }
	let content = '';
	let foundUsername = false;
	if (isVideoChat) {
		let ele;
		if (settings.show_username) {
			ele = $(dom).find('.video-chat__message-menu')[0].previousSibling;
		} else {
			ele = $(dom).find('.text-fragment')[0];
			// ele = ele.children[ele.children.length - 1];
		}
		if (ele && ele.outerHTML)
			content += ele.outerHTML;
	} else {
		let d = dom.querySelector('[class*=username-container]') || dom.querySelector('.text-fragment');
		if (d) {
			dom = d.parentElement;
		}
		for (let i = 0; i < dom.children.length; i++) {
			let ele = dom.children[i];
			if (!settings.show_username) {
				if (!foundUsername) {
					if ($(ele).attr('class') && $(ele).attr('class').indexOf('username') >= 0) {
						foundUsername = true;
					}
					continue;
				}
				if ($(ele).attr('aria-hidden')) {
					continue;
				}
			}
			if (ele && ele.outerHTML)
				content += ele.outerHTML;
		}
	}

	let entry = {
		username: username,
		content: content,
		message: message
	};
	return entry;
}

let danmakuList = [];
let danmakuTimeOut = false;
function addNewDanmakuDelay(danmaku){
	danmakuList.push(danmaku);
	if(!danmakuTimeOut){
		danmakuTimeOut = true;
		setTimeout(() => {
			const tmp = danmakuList;
			danmakuList = [];
			danmakuTimeOut = false;
			for(let i = 0; i < tmp.length; i++){
				addNewDanmaku(tmp[i]);
			}
			layers = 0;
		}, settings.duration / 3 * 1000)
	}
}

function addNewDanmaku(entry) {
	if (!settings.enabled || !entry) return;
	const density = [0.25, 0.5, 0.75, 1][settings.danmaku_density] || 1;
	let maxLayer = Math.floor(($overlay.height() * density) / (parseInt(settings.font_size) + 4)) - 1;
	if (layers > maxLayer) {
		danmakuList.push(entry);
	}else {
		const danmaku = new Danmaku(entry, layers, settings);
		danmaku.attachTo($overlay);
	}
	layers ++;
}

let replaced = false;
function replaceToggleVisibility() {
	if (replaced) return;
	let toggle = document.querySelector('.right-column__toggle-visibility');
	if (!toggle) return;
	replaced = true;

	let injected = false;
	toggle.addEventListener('click', (e) => {
		const rightColumn = document.querySelector('.right-column');
		const header = document.querySelector('.channel-header .tw-full-height.tw-pd-l-05');
		const theatre = document.querySelector('.persistent-player--theatre');
		const whispers = document.querySelector('.whispers--right-column-expanded');

		if (!injected && rightColumn.classList.contains('right-column--collapsed')) {
			injected = true;
			return;
		}
		injected = true;
		if (rightColumn) {
			if (rightColumn.classList.contains('right-column--collapsed')) {
				rightColumn.setAttribute('data-a-target', 'right-column-chat-bar');
				rightColumn.classList.remove('right-column--collapsed');
				if (rightColumn.classList.contains('right-column--theatre')) {
					rightColumn.classList.add('tw-full-height');
					if (theatre) {
						theatre.style.width = 'calc(100% - 34rem)';
					}
				}

				rightColumn.children[0].classList.add('tw-block');
				rightColumn.children[0].classList.remove('tw-hide');

				rightColumn
					.querySelector('[data-a-target=right-column__toggle-collapse-btn] .tw-icon__svg')
					.querySelector('path')
					.setAttribute('d', 'M4 16V4H2v12h2zM13 15l-1.5-1.5L14 11H6V9h8l-2.5-2.5L13 5l5 5-5 5z');

				if (header) {
					header.classList.remove('tw-sm-pd-r-4');
					header.classList.add('tw-sm-pd-r-1');
				}

				if (whispers) {
					whispers.classList.add('whispers--right-column-expanded-beside');
				}
			} else {
				rightColumn.setAttribute('data-a-target', 'right-column-chat-bar-collapsed');
				rightColumn.classList.add('right-column--collapsed');
				if (rightColumn.classList.contains('right-column--theatre')) {
					rightColumn.classList.remove('tw-full-height');
					if (theatre) {
						theatre.style.width = '100vw';
					}
				}

				rightColumn.children[0].classList.remove('tw-block');
				rightColumn.children[0].classList.add('tw-hide');

				rightColumn
					.querySelector('[data-a-target=right-column__toggle-collapse-btn] .tw-icon__svg')
					.querySelector('path')
					.setAttribute('d', 'M16 16V4h2v12h-2zM6 9l2.501-2.5-1.5-1.5-5 5 5 5 1.5-1.5-2.5-2.5h8V9H6z');
				if (header) {
					header.classList.remove('tw-sm-pd-r-1');
					header.classList.add('tw-sm-pd-r-4');
				}

				if (whispers) {
					whispers.classList.remove('whispers--right-column-expanded-beside');
				}
			}
		}
		e.stopPropagation();
	});
}

let gotSettings = false;
let gotFonts = false;
async function start() {
	$logDiv.unbind('DOMNodeInserted').bind('DOMNodeInserted', (event) => {
		const newChatDOM = event.target;

		if (!newChatDOM.className) return;

		setTimeout(() => {
			const chatEntry = digestChatDom(newChatDOM);
			addNewDanmakuDelay(chatEntry);
		}, 0);
	});

	console.log(
		'%c[Twitch Chat Danmaku] If you like this extension, please consider to support the dev by sending a donation via https://www.paypal.me/wheatup. Thanks! Pepega',
		'color: #fff; font-weight: bold; background-color: #295; border-radius: 3px; padding: 2px 5px;'
	);

	while (!gotSettings || !gotFonts || !replaced) {
		if (!gotSettings) {
			sendMessage('GET_SETTINGS');
		}

		if (!gotFonts) {
			sendMessage('GET_FONTS');
		}

		if (!replaced) {
			replaceToggleVisibility();
		}

		await sleep(5000);
	}
}

async function init() {
	const url = window.location.href;
	if(!url){
		return;
	}
	if(url.indexOf("twitch") > -1){
		//twitch
		isTwitch = true;
		await findLogDiv();
		await createOverlay();
		await start();
	}else if(url.indexOf("youtube") > -1){
		//youtube
		await findYtChat();
		ytChatStart();
	}
}

function addNewYtDanmaku(data){
	if(!data || !data.username){
		return;
	}
	let content = '';
	if(data.userphoto){
		content += data.userphoto;
	}
	if(data.color){
		content += '<span style="color: ' + data.color + ';">'
	}else{
		content += '<span style="color: white;">'
	}
	if (settings.show_username && data.username) {
		content += data.username;
		if(data.content){
			content += '：'
		}
	}
	content += data.content;
	content += '</span>';
	addNewDanmakuDelay({
		content
	});
}

function ytChatStart(){
	// 一秒钟最多只能有5条弹幕，应对YouTube弹幕偶尔重载时满屏弹幕的情况
	let count = 0;
	setInterval(() => {count = 0}, 1000);
	$ytChatDiv.unbind('DOMNodeInserted').bind('DOMNodeInserted', (event) => {
		const newChatDOM = event.target;
		const className = newChatDOM.className;
		if (!className || !className.indexOf || className.indexOf("yt-live-chat-item-list-renderer") == -1){
			return;
		}
		setTimeout(() => {
			const chatEntry = digestYtChatDom(newChatDOM);
			if(chatEntry && chatEntry.username){
				if(count > 5){
					// 一秒钟最多只能有5条弹幕
					console.warn("超过5条，自动丢弃");
					return;
				}
				count ++;
				sendMessage("YT_CHAT", chatEntry);
			}
		},0)
	});
}

let lastUsername;
function digestYtChatDom(dom){
	const newChat = $(dom);
	const userphoto = newChat.find("#author-photo").html();
	const content = newChat.find("#message").html();
	let username = newChat.find("#author-name").html();
	if(username && username.indexOf("<") > -1){
		username = username.substring(0, username.indexOf("<")).trim();
	}
	if(!username || lastUsername == username){
		return ;
	}
	lastUsername = username;
	if(newChat.find("#author-name svg, #chat-badges svg")[0]){
		//svg
		newChat.find("#author-name svg, #chat-badges svg").each((i, e) => {
			$(e).css({
				"width": "24px",
				"height": "24px",
				"display": "inline",
				"margin-bottom": "-6px"
			})
			username += $("<div></div>").append($(e)).html().replace(/ {2,}/g, "");
		})
	}
	let color;
	if(newChat.find("#card")[0] && newChat.find("#purchase-amount")[0]){
		//sc
		const amount = newChat.find("#purchase-amount").html().trim();
		username = "(SC " + amount + ") " + username;
		color = newChat.css("--yt-live-chat-paid-message-primary-color");
	}

	return {
		userphoto,
		username,
		content,
		color
	}
}

function findYtChat() {
	return new Promise((resolve) => {
		let timer = setInterval(() => {
			let _$ytChatDiv;
			if($("#chatframe")[0]){
				//iframe
				_$ytChatDiv = $("#chatframe").contents().find("#item-list")
			}else{
				_$ytChatDiv = $("#item-list");
			}
			if (_$ytChatDiv && _$ytChatDiv[0]) {
				$ytChatDiv = $(_$ytChatDiv[0]);
				clearInterval(timer);
				resolve($ytChatDiv);
			}
		}, 500);
	});
}

$(document).ready(init);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	switch (request.type) {
		case 'GOT_SETTINGS':
			Object.assign(settings, request.data);
			$overlay.css('display', settings.enabled ? 'block' : 'none');
			gotSettings = true;
			break;
		case 'UPDATE_SETTINGS':
			Object.assign(settings, request.data);
			$overlay.css('display', settings.enabled ? 'block' : 'none');
			break;
		case 'URL_CHANGE':
			init().then();
			break;
		case 'GOT_FONTS':
			fontList = request.data;
			gotFonts = true;
			break;
		case 'GOT_YT_CHAT':
			if(isTwitch){
				addNewYtDanmaku(request.data);
			}
	}
});

function sleep(ms){
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	});
}