window.Buffer = require('buffer').Buffer;
window.path = require('path');
window.Discord = require('discord.js');
window.mime = require('mime-types');

if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(search, this_len) {
		if (this_len === undefined || this_len > this.length) {
			this_len = this.length;
		}
		return this.substring(this_len - search.length, this_len) === search;
	};
}

var matchURL = /(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/g;

var loginBar = document.getElementById('login_bar');
var messages = document.getElementById('messages');
var channelMenu = document.getElementById('channel_menu');
var selectServer = document.getElementById('select_server');
var selectChannel = document.getElementById('select_channel');
var okBtn = document.getElementById('ok_btn');
var enterMsg = document.getElementById('enter_msg');
var uploadBtn = document.getElementById('upload_btn');
var sendBtn = document.getElementById('send_btn');

var discordInstance;

function updateLoginBar() {
	if (localStorage.getItem('token') === null) {
		loginBar.innerHTML = '<button type="button" onclick="promptLogin();">Login</button>';
	} else {
		loginBar.innerHTML = '';
		
		var menuIcon = document.createElement('img');
		menuIcon.id = 'menu_icon';
		menuIcon.src = 'mobile_menu_icon.svg';
		menuIcon.onclick = function () {
			openChannelMenu();
		};
		loginBar.appendChild(menuIcon);
		
		loginBar.appendChild(document.createTextNode('Logged in as '+discordInstance.user.username+' '));
		
		var logoutBtn = document.createElement('button');
		logoutBtn.type = 'button';
		logoutBtn.textContent = "Logout";
		logoutBtn.onclick = function () {
			discordInstance.destroy();
		};
		loginBar.appendChild(logoutBtn);
	}
}

window.promptLogin = function promptLogin() {
	var token = prompt("Enter code");
	if (token === null) return;
	localStorage.setItem('token', token);
	tryLogin();
}

function tryLogin() {
	var token = localStorage.getItem('token');
	if (token === null) {
		updateLoginBar();
		return;
	}
	
	discordInstance = new Discord.Client();
	discordInstance.on('ready', function (readyEv) {
		updateLoginBar();
		
		startup(readyEv);
	});
	discordInstance.on('disconnect', function (ev, code) {
		localStorage.removeItem('token');
		localStorage.removeItem('server_id');
		localStorage.removeItem('channel_id');
		updateLoginBar();
		updateLatestMessages();
		if (code === 0) {
			tryLogin();
		}
	});
	discordInstance.login(token)
}

function startup(readyEv) {
	if (!discordInstance.channels.has(localStorage.getItem('channel_id'))) {
		localStorage.removeItem('channel_id');
	}
	if (localStorage.getItem('server_id') === null || !discordInstance.guilds.has(localStorage.getItem('server_id'))) {
		localStorage.removeItem('server_id');
	}
	
	selectServer.onchange = function () {
		localStorage.setItem('server_id', this.value);
		localStorage.removeItem('channel_id', this.value);
		updateSelectChannel();
		updateLatestMessages();
	};
	selectChannel.onchange = function () {
		localStorage.setItem('channel_id', this.value);
		updateLatestMessages();
	};
	okBtn.onclick = function() {
		closeChannelMenu();
	};
	
	var lastInputTime = -Infinity;
	
	enterMsg.oninput = function () {
		if (discordInstance && localStorage.getItem('token') !== null && localStorage.getItem('channel_id') !== null
			&& ((new Date()).getTime() - lastInputTime) >= 1000) {
			var channel = discordInstance.channels.get(localStorage.getItem('channel_id'));
			channel.startTyping();
			setTimeout(function() { channel.stopTyping(); }, 1000);
			lastInputTime = (new Date()).getTime();
		}
	};
	enterMsg.onkeypress = function (e) {
		if (e.keyCode == 13) {
			sendBtn.click();
			return false;
		}
	};
	
	sendBtn.onclick = function () {
		if (discordInstance && localStorage.getItem('token') !== null && localStorage.getItem('channel_id') !== null) {
			discordInstance.channels
				.get(localStorage.getItem('channel_id'))
				.send(enterMsg.value);
			enterMsg.value = '';
		}
	};
	
	uploadBtn.onclick = function () {
		//alert('To nullify');
		//try {
		if (discordInstance && localStorage.getItem('token') !== null && localStorage.getItem('channel_id') !== null) {
			/*
			InstagramAssetsPicker.getMedia(
				function (result) {
					//alert('Un');
					resolveLocalFileSystemURL('file://'+result.filePath, function (fileEntry) {
						//alert('Deux');
						fileEntry.file(function (file) {
							//alert('Trois');
							var reader = new FileReader();
							reader.onloadend = function (e) {
								//alert('Quatre');
								//try {
								var buf = Buffer.from(reader.result);
								//alert('Buffer created: length = ' + buf.length);
								var promise = discordInstance.channels.get(localStorage.getItem('channel_id')).send({
									files: [{
										attachment: buf,
										name: path.basename(result.filePath)
									}]
								}).catch(function(err) { alert("Error: "+err.message); });
								//} catch(err) { alert(err.message); }
							};
							reader.readAsArrayBuffer(file);
						}, function(err) {  });
					}, function(err) {  });
				}
			);
			*/
			
			/*
			var buf = Buffer.from('Teehee');
			console.log(buf);
			var promise = discordInstance.channels
				.get(localStorage.getItem('channel_id')).send(new Discord.Attachment(buf, 'teehee_round_2.txt'))
					.catch(function(err) { alert("Error: "+err.message); });
			*/
		}
		//} catch(err) { alert(err.message); }
	};
	
	updateLatestMessages()
	.then(function () {
		requestAnimationFrame(function () {
			messages.scrollTop = messages.scrollHeight;
		});
	});
	
	discordInstance.on('message', function (message) {
		appendMessage(message);
		if (message.author.id !== discordInstance.user.id) {
			/*
			Notification.requestPermission(function (permission) {
				if (permission === 'granted') {
					var notification = new Notification(message.author.username, {
						body: message.content
					});
				}
			});
			*/
		}
	});
}

setInterval(function () {
	if (messages.scrollTop < 20 && messages.children.length) {
		if (localStorage.getItem('channel_id') !== null) {
			discordInstance.channels.get(localStorage.getItem('channel_id')).fetchMessages({before: messages.children[0].dataset.id})
			.then(function (msgColl) {
				for (var msg of msgColl.values()) {
					prependMessage(msg);
				}
			});
		}
	}
}, 1000);

function updateSelectServer() {
	selectServer.innerHTML = '';
	selectServer.appendChild(document.createElement('option'));
	selectServer.children[0].selected = 'selected';
	selectServer.children[0].disabled = 'disabled';
	for (var guild of discordInstance.guilds.values()) {
		var serverOption = document.createElement('option');
		serverOption.value = guild.id;
		serverOption.textContent = guild.name;
		if (guild.id === localStorage.getItem('server_id')) {
			serverOption.selected = 'selected';
			selectServer.children[0].removeAttribute('selected');
		}
		selectServer.appendChild(serverOption);
	}
}

function updateSelectChannel() {
	selectChannel.innerHTML = '';
	selectChannel.appendChild(document.createElement('option'));
	selectChannel.children[0].selected = 'selected';
	selectChannel.children[0].disabled = 'disabled';
	if (localStorage.getItem('server_id') !== null && discordInstance.guilds.has(localStorage.getItem('server_id'))) {
		for (var channel of discordInstance.guilds.get(localStorage.getItem('server_id')).channels.values()) {
			if (['text', 'dm', 'group'].indexOf(channel.type) === -1) continue;
			
			var channelOption = document.createElement('option');
			channelOption.value = channel.id;
			channelOption.textContent = channel.name;
			if (channel.id === localStorage.getItem('channel_id')) {
				channelOption.selected = 'selected';
				selectChannel.children[0].removeAttribute('selected');
			}
			selectChannel.appendChild(channelOption);
		}
	}
}

function openChannelMenu() {
	updateSelectServer();
	
	updateSelectChannel();
	
	channelMenu.style.display = '';
}

function closeChannelMenu() {
	channelMenu.style.display = 'none';
}

function createMessageElem(message) {
	var msgContent = document.createElement('div');
	msgContent.classList.add('message_content');
	
	msgContent.dataset.id = message.id;
	
	msgContent.textContent = " " + message.content;
	
	var authorSpan = document.createElement('span');
	authorSpan.textContent = message.author.username;
	authorSpan.classList.add('author');
	
	msgContent.insertBefore(authorSpan, msgContent.childNodes[0] || null);
	
	matchURL.lastIndex = 0;
	msgContent.innerHTML = msgContent.innerHTML.replace(matchURL, '<a href="$&">$&</a>')
	
	for (var attachment of message.attachments.values()) {
		msgContent.appendChild(document.createElement('br'));
		
		var attachmentElem;
		var contentType = mime.lookup(attachment.filename);
		if (contentType.startsWith('image')) {
			attachmentElem = document.createElement('img');
			attachmentElem.src = attachment.url;
		} else if (contentType.startsWith('video')) {
			attachmentElem = document.createElement('video');
			attachmentElem.src = attachment.url;
			attachmentElem.controls = 'controls';
		} else if (contentType.startsWith('audio')) {
			attachmentElem = document.createElement('audio');
			attachmentElem.src = attachment.url;
			attachmentElem.controls = 'controls';
		} else {
			attachmentElem = document.createElement('a');
			attachmentElem.href = attachment.url;
			attachmentElem.textContent = attachment.filename;
		}
		if (attachmentElem) {
			attachmentElem.classList.add('msg_media');
			msgContent.appendChild(attachmentElem);
		}
	}
	return msgContent;
}

function prependMessage(message) {
	var msgContent = createMessageElem(message);
	messages.insertBefore(msgContent, messages.children[0] || null);
}

function appendMessage(message) {
	var msgContent = createMessageElem(message);
	messages.appendChild(msgContent);
	
	if (message.author.id === discordInstance.user.id) {
		requestAnimationFrame(function () { messages.scrollTop = messages.scrollHeight; });
	}
}

function updateLatestMessages() {
	messages.innerHTML = '';
	messages.style.display = 'none';
	var pr = Promise.resolve(null);
	if (localStorage.getItem('channel_id') !== null) {
		pr = discordInstance.channels.get(localStorage.getItem('channel_id')).fetchMessages()
		.then(function (msgColl) {
			for (var msg of msgColl.values()) {
				prependMessage(msg);
			}
		});
	}
	messages.style.display = '';
	return pr;
}

tryLogin();