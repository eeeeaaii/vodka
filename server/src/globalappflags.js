

var appFlags = {};

function setAppFlags() {
	var params = new URLSearchParams(window.location.search);
	params.forEach(function(value, key) {
		appFlags[key] = value;
	})
}

function getGlobalAppFlag(flagname) {
	return appFlags[flagname];
}

export { setAppFlags, getGlobalAppFlag }