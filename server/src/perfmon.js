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



class PerformanceMonitor {
	constructor() {
		this.methods = {};
		this.callstack = [];
		for (let i = 0; i < 4000; i++) {
			this.callstack[i] = "";
		}
		this.lastStartOrEnd = 0;
		this.inMethod = '____fakemethod';
		this.registerMethod(this.inMethod);
		this.calls = 0;
		this.returns = 0;
		this.active = false;
		this.stackLevel = 0;
	}

	getCallStackString() {
		let s = "";
		for (let i = 0; i < this.callstack.length; i++) {
			s += this.callstack[i];
		}
		return s;
	}

	activate() {
		this.active = true;
	}

	registerMethod(methodName) {
		this.methods[methodName] = this.newMethodRecord(methodName);
	}

	newMethodRecord(name) {
		return {
			name: name,
			calls: 0,
			privateTime: 0,
			callsFrom: {}
		};
	}

	logMethodCallStart(methodName) {
		if (!this.active) {
			return;
		}
		if (!methodName) {
			methodName = "{anonymous}"
		}
		if (!this.methods[methodName]) {
			this.registerMethod(methodName);
		}
		// this.callstack[this.stackLevel++] = ':' + methodName;
		let now = window.performance.now();
		let previousMethod = this.methods[this.inMethod];
		previousMethod.privateTime += now - this.lastStartOrEnd;
		this.inMethod = methodName;
		this.methods[methodName].calls++;
		// let callFrom = this.getCallStackString();
		// if (!this.methods[methodName].callsFrom[callFrom]) {
		// 	this.methods[methodName].callsFrom[callFrom] = 0;
		// } else {
		// 	this.methods[methodName].callsFrom[callFrom]++;
		// }
		this.lastStartOrEnd = now;
		this.calls++;

	}

	logMethodCallEnd(methodName) {
		if (!this.active) {
			return;
		}
		if (!methodName) {
			methodName = "{anonymous}"
		}
		// this.callstack[this.stacklevel--] = "";
		let now = window.performance.now();
		this.methods[methodName].privateTime += now - this.lastStartOrEnd;
		this.lastStartOrEnd = now;
		this.returns++;
	}

	outputSortedByName(a) {
		console.log('SORTED BY NAME');
		a.sort(function(i1, i2) {
			return i1.name.localeCompare(i2.name);
		});
		for (let i = 0; i < a.length; i++) {
			let m = a[i];
			let avg = m.privateTime / m.calls;
			console.log(`[${m.name}] ---- name:${m.name}  calls:${m.calls}  ptime:${m.privateTime}  average:${avg}`);
		}
	}

	outputCallsFrom(a) {
		console.log('CALLS FROM');
		a.sort(function(i1, i2) {
			return i1.name.localeCompare(i2.name);
		});
		for (let i = 0; i < a.length; i++) {
			let m = a[i];
			console.log(`[${m.name}]`);
			for (let c in m.callsFrom) {
				let z = m.callsFrom[c];
				console.log(`    ${z} --- ${c}`);
			}
		}
	}

	outputSortedByPrivateTime(a) {
		console.log('SORTED BY PTIME');
		a.sort(function(i1, i2) {
			return i1.privateTime - i2.privateTime;
		});
		for (let i = 0; i < a.length; i++) {
			let m = a[i];
			let avg = m.privateTime / m.calls;
			console.log(`[${m.privateTime}] ---- name:${m.name}  calls:${m.calls}  ptime:${m.privateTime}  average:${avg}`);
		}
	}

	outputSortedByCalls(a) {
		console.log('SORTED BY CALLS');
		a.sort(function(i1, i2) {
			return i1.calls - i2.calls;
		});
		for (let i = 0; i < a.length; i++) {
			let m = a[i];
			let avg = m.privateTime / m.calls;
			console.log(`[${m.calls}] ---- name:${m.name}  calls:${m.calls}  ptime:${m.privateTime}  average:${avg}`);
		}
	}

	outputSortedByAvg(a) {
		console.log('SORTED BY AVG');
		a.sort(function(i1, i2) {
			return (i1.privateTime / i1.calls) - (i2.privateTime / i2.calls);
		});
		for (let i = 0; i < a.length; i++) {
			let m = a[i];
			let avg = m.privateTime / m.calls;
			console.log(`[${avg}] ---- name:${m.name}  calls:${m.calls}  ptime:${m.privateTime}  average:${avg}`);
		}
	}

	dump() {
		if (this.calls != this.returns) {
			console.log('WARNING: calls do not equal returns.');
		}
		let a = [];
		for (let name in this.methods) {
			if (this.methods[name].calls > 0) {
				a.push(this.methods[name]);
			}
		}
		this.outputSortedByName(a);
		this.outputSortedByPrivateTime(a);
		this.outputSortedByCalls(a);
		this.outputSortedByAvg(a);
		// this causes OOM I guess :/
//		this.outputCallsFrom(a);
	}
}

export { PerformanceMonitor }

