

const appFlags = {};
const experiments = {};

// some hard coded things here
experiments.V2_INSERTION = true;
experiments.V2_INSERTION_TAB_HACK = experiments.V2_INSERTION;
experiments.V2_INSERTION_LENIENT_DOC_FORMAT = experiments.V2_INSERTION;

function isBoolean(key) {
	switch(key) {
		case 'V2_INSERTION':
		case 'V2_INSERTION_TAB_HACK':
		case 'V2_INSERTION_LENIENT_DOC_FORMAT':
			return true;
		default:
			return false;
	}
}

function setAppFlags() {
	var params = new URLSearchParams(window.location.search);
	params.forEach(function(value, key) {
		if (isBoolean(key)) {
			value = parseBooleanValue(value);
		}
		appFlags[key] = value;
		if (key == 'V2_INSERTION') {
			experiments.V2_INSERTION = value;
		} else if (key == 'V2_INSERTION_TAB_HACK') {
			experiments.V2_INSERTION_TAB_HACK = value;
		} else if (key == 'V2_INSERTION_LENIENT_DOC_FORMAT') {
			experiments.V2_INSERTION_LENIENT_DOC_FORMAT = value;
		}
	})
}

function parseBooleanValue(v) {
	if (v == 'false' || v == '0') {
		return false;
	} else {
		return !!v;
	}
}

function getGlobalAppFlagIsSet(flagname) {
	return !!appFlags[flagname];
}

function getGlobalAppFlagValue(flagname) {
	return appFlags[flagname];
}



export { experiments, setAppFlags, getGlobalAppFlagIsSet, getGlobalAppFlagValue }