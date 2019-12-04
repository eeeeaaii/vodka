#pragma once

namespace whelk {

	struct Delta {
		int dx;
		int dy;
		Delta() {
			dx = 0;
			dy = 0;
		}
		Delta(int x, int y) {
			dx = x;
			dy = y;
		}
	};

	struct Point {
		int x;
		int y;
		Point() {
			x = 0;
			y = 0;
		}
		Point(int _x, int _y) {
			x = _x;
			y = _y;
		}
	};
}
