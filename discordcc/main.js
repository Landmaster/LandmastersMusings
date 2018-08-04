var regex = /access_token=([^&]*)/;
var arr;

if (!window.location.hash || (arr = regex.exec(window.location.hash)) === null) {
	location.href = 'https://discordapp.com/api/oauth2/authorize?response_type=token&client_id=475296178737774604&scope=identify&redirect_uri=' + location.href;
}

console.log(arr[1]);
