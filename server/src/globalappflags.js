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
	'V2_INSERTION_TAB_HACK': true,
	'V2_INSERTION_LENIENT_DOC_FORMAT': true
};

// some hard coded things here

function isBoolean(key) {
	switch(key) {
		case 'COMMAND_EDITOR':
		case 'SYMBOL_EDITOR':
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
		if (experiments[key]) {
			experiments[key] = value;
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