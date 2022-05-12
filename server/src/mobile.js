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



var prev = null


function doFakeEvent(key, shift, ctrl, alt, cmd, meta) {
	mobileClearInput();
	let e = {};
	e.key = key;
	e.altKey = alt;
	e.ctrlKey = ctrl;
	e.shiftKey = shift;
	e.metaKey = meta;
	doKeydownEvent(e);
}

var mobileControlPanelVisible = false;
var hideTimeout = null;

function setHideTimeout() {
	if (hideTimeout) {
		clearTimeout(hideTimeout);
	}
	hideTimeout = setTimeout(function() {
		document.getElementById("mobilecontrolpanel").style.opacity = 0.0;
		mobileControlPanelVisible = false;
	}, 30000);
}

function showOrDoFakeEvent(key, shift, ctrl, alt, cmd, meta) {
	if (!mobileControlPanelVisible) {
		mobileControlPanelVisible = true;
		document.getElementById("mobilecontrolpanel").style.opacity = 1;
		setHideTimeout();
		return;
	}
	setHideTimeout();
	doFakeEvent(key, shift, ctrl, alt, cmd, meta);
}


function mobileClearInput() {
	document.getElementById('mobile_input').value = '';
}

function doMobileKeyDown(e) {
	if (e.key == 'Enter') {
		mobileClearInput();
	}
}


function setupMobile() {
	var mobileInput = document.getElementById("mobile_input");
	mobileInput.onchange = function(e) {
		// lol this is basically when enter
		prev = "";
		doFakeEvent("Enter", false, false, false, false, false);
		setTimeout(function() {
			mobileInput.value = prev;
		}, 1);
	}
	mobileInput.oninput = function(e) {
		if (prev === null) {
			// well I guess we added stuff
			prev = mobileInput.value;
			doFakeEvent(prev, false, false, false, false, false);
		} else {
			// either it's shorter or longer!
			let newone = mobileInput.value;
			if (newone.length > prev.length) {
				let k = newone.charAt(newone.length - 1);
				prev = newone;
				doFakeEvent(k, false, false, false, false, false);
			} else {
				prev = newone;
				// gotta be shorter?
				doFakeEvent("Backspace", false, false, false, false, false);
			}
		}
		setTimeout(function() {
			mobileInput.value = prev;
		}, 1);
		return true;
	}

	systemState.setIsMobile(true);
	document.getElementById("mobilecontrolpanel").style.display = 'flex';
	document.getElementById("codepane").classList.add('mobile');

	document.getElementById("mobile_out").onclick = function() {
		showOrDoFakeEvent("Tab", true, false, false, false, false);
	}
	document.getElementById("mobile_in").onclick = function() {
		showOrDoFakeEvent("Tab", false, false, false, false, false);
	}
	document.getElementById("mobile_prev").onclick = function() {
		showOrDoFakeEvent("ArrowLeft", false, false, false, false, false);
	}
	document.getElementById("mobile_next").onclick = function() {
		showOrDoFakeEvent("ArrowRight", false, false, false, false, false);
	}

	document.getElementById("mobile_del").onclick = function() {
		showOrDoFakeEvent("Backspace", false, false, false, false, false);
	}
	document.getElementById("mobile_sde").onclick = function() {
		showOrDoFakeEvent("Backspace", true, false, false, false, false);
	}
	document.getElementById("mobile_esc").onclick = function() {
		showOrDoFakeEvent("Escape", false, false, false, false, false);
	}
	document.getElementById("mobile_til").onclick = function() {
		showOrDoFakeEvent("~", true, false, false, false, false);
	}
	document.getElementById("mobile_exc").onclick = function() {
		showOrDoFakeEvent("!", true, false, false, false, false);
	}
	document.getElementById("mobile_ats").onclick = function() {
		showOrDoFakeEvent("@", true, false, false, false, false);
	}
	document.getElementById("mobile_num").onclick = function() {
		showOrDoFakeEvent("#", true, false, false, false, false);
	}
	document.getElementById("mobile_dol").onclick = function() {
		showOrDoFakeEvent("$", true, false, false, false, false);
	}
	document.getElementById("mobile_per").onclick = function() {
		showOrDoFakeEvent("%", true, false, false, false, false);
	}
	document.getElementById("mobile_car").onclick = function() {
		showOrDoFakeEvent("^", true, false, false, false, false);
	}
	document.getElementById("mobile_amp").onclick = function() {
		showOrDoFakeEvent("&", true, false, false, false, false);
	}
	document.getElementById("mobile_ast").onclick = function() {
		showOrDoFakeEvent("*", true, false, false, false, false);
	}
	document.getElementById("mobile_par").onclick = function() {
		showOrDoFakeEvent("(", true, false, false, false, false);
	}
	document.getElementById("mobile_bce").onclick = function() {
		showOrDoFakeEvent("{", true, false, false, false, false);
	}
	document.getElementById("mobile_brk").onclick = function() {
		showOrDoFakeEvent("[", true, false, false, false, false);
	}
	document.getElementById("mobile_flp").onclick = function() {
		showOrDoFakeEvent(" ", true, false, false, false, false);
	}

	document.getElementById("mobile_edit").onclick = function() {
		showOrDoFakeEvent("Enter", false, true, false, false, false);
	}
	document.getElementById("mobile_sted").onclick = function() {
		showOrDoFakeEvent("Enter", false, false, false, false, false);
	}

	document.getElementById("mobile_cut").onclick = function() {
		showOrDoFakeEvent("x", false, false, false, false, true);
	}
	document.getElementById("mobile_copy").onclick = function() {
		showOrDoFakeEvent("c", false, false, false, false, true);
	}
	document.getElementById("mobile_paste").onclick = function() {
		showOrDoFakeEvent("v", false, false, false, false, true);
	}

	document.getElementById("mobile_eval").onclick = function() {
		showOrDoFakeEvent("Enter", false, false, false, false, false);
	}
	document.getElementById("mobile_quiet").onclick = function() {
		showOrDoFakeEvent("Enter", true, false, false, false, false);
	}
}


export { setupMobile, doMobileKeyDown }