

var appFlags = {};

function setAppFlags() {
	var params = new URLSearchParams(window.location.search);
	params.forEach(function(value, key) {
		appFlags[key] = value;
	})
}

function getGlobalAppFlagIsSet(flagname) {
	return !!appFlags[flagname];
}

function getGlobalAppFlagValue(flagname) {
	return appFlags[flagname];
}

export { setAppFlags, getGlobalAppFlagIsSet, getGlobalAppFlagValue }