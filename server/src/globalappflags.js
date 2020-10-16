/*
This file is part of Vodka.

Vodka is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Vodka is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Vodka.  If not, see <https://www.gnu.org/licenses/>.
*/



const appFlags = {};
const experiments = {
	'COMMAND_EDITOR': true,
	'SYMBOL_EDITOR': true,
	'V2_INSERTION': true,
	'V2_INSERTION_TAB_HACK': false,
	'V2_INSERTION_LENIENT_DOC_FORMAT': true,
	'NO_COPY_CSS': false,
	'DEFAULT_TO_PARAMETRIC_FONTS': false,
};

const flags = {
	'DEBUG_EXPECTATIONS': false
};

// some hard coded things here

function isBoolean(key) {
	switch(key) {
		case 'COMMAND_EDITOR':
		case 'SYMBOL_EDITOR':
		case 'V2_INSERTION':
		case 'V2_INSERTION_TAB_HACK':
		case 'V2_INSERTION_LENIENT_DOC_FORMAT':
		case 'NO_COPY_CSS':
		case 'DEBUG_EXPECTATIONS':
		case 'DEFAULT_TO_PARAMETRIC_FONTS':
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
		if (typeof experiments[key] !== 'undefined') {
			experiments[key] = value;
		}
		if (typeof flags[key] !== 'undefined') {
			flags[key] = value;
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

// deprecated
function getGlobalAppFlagIsSet(flagname) {
	return !!appFlags[flagname];
}

function getGlobalAppFlagValue(flagname) {
	return appFlags[flagname];
}



export { experiments, flags, setAppFlags, getGlobalAppFlagIsSet, getGlobalAppFlagValue }