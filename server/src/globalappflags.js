

const appFlags = {};
const experiments = {};

// some hard coded things here
experiments.V2_INSERTION = false;


function setAppFlags() {
	var params = new URLSearchParams(window.location.search);
	params.forEach(function(value, key) {
		appFlags[key] = value;
		if (key == 'V2_INSERTION' && !!value) {
			experiments.V2_INSERTION = !!value;
		}
	})
}

function getGlobalAppFlagIsSet(flagname) {
	return !!appFlags[flagname];
}

function getGlobalAppFlagValue(flagname) {
	return appFlags[flagname];
}



export { experiments, setAppFlags, getGlobalAppFlagIsSet, getGlobalAppFlagValue }