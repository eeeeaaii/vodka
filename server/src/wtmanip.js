import { eventQueueDispatcher } from './eventqueuedispatcher.js'

class ManipulatorDragHandler {

	setup(domobject, listener) {
		let t = this;
		this.domobject = domobject;
		this.listener = listener;

		domobject.onmousedown = (e) => {
			t.startDrag(e);
		}
	}

	startDrag(e) {
		this.body = document.getElementsByTagName('body')[0];
		let t = this;
		this.body.onmousemove = (ev) => {
			t.drag(ev);
		}
		this.body.onmouseup = (ev) => {
			t.stopDrag(ev);
		}
		this.starty = e.clientY;
		this.startx = e.clientX;

		if (this.listener.onStartDrag) this.listener.onStartDrag({
			starty: this.starty,
			startx: this.startx
		});
		eventQueueDispatcher.enqueueTopLevelRender();			
	}

	drag(e) {
		e.stopPropagation();
		e.preventDefault();
		let y = e.clientY;
		let x = e.clientX;
		let deltaY = y - this.starty;
		let deltaX = x - this.startx;

		if (this.listener.onDrag) this.listener.onDrag({
			deltaY: deltaY,
			deltaX: deltaX
		})
		eventQueueDispatcher.enqueueTopLevelRender();			
	}

	stopDrag(e) {
		body.onmousemove = null;
		body.onmouseup = null;

		e.stopPropagation();
		e.preventDefault();
		let y = e.clientY;
		let x = e.clientX;
		let deltaY = y - this.starty;
		let deltaX = x - this.startx;
		if (this.listener.onStopDrag) this.listener.onDrag({
			deltaY: deltaY,
			deltaX: deltaX
		})
		eventQueueDispatcher.enqueueTopLevelRender();			
	}
}

let currentDragHandler = null;

function setupCloseButton() {
	let wtm = document.getElementById('wtmclosebutton');	
	wtm.onclick = (e) => {
		hideManipulator();
	}
}

function setupHorizZoom(wt) {
	let wtm = document.getElementById('wtmhorizzoom');
	currentDragHandler = new ManipulatorDragHandler();
	currentDragHandler.setup(wtm, wt.getHorizZoomListener());
}

function setupHorizScroll(wt) {
	let wtm = document.getElementById('wtmhorizscroll');
	currentDragHandler = new ManipulatorDragHandler();
	currentDragHandler.setup(wtm, wt.getHorizScrollListener());
}

function showManipulator(wt) {
	let wtm = document.getElementById('wavetablemanipulator');
	setupCloseButton();
	setupHorizZoom(wt);
	setupHorizScroll(wt);
	wtm.style.display = 'flex';

}

function hideManipulator() {
	let wtm = document.getElementById('wavetablemanipulator');
	wtm.style.display = 'none';	
}


export { showManipulator, hideManipulator, ManipulatorDragHandler
 }