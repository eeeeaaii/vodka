// Copyright 2003-2005, 2008, 2019 Jason Scherer
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

#pragma once

namespace whelk 
{
	/*
	 * The Bitmap class contains a two-dimensional array of
	 * integers representing RGBA colors.
	 *
	 * buffer[0][0] is top left pixel
	 * buffer[0][1] is the pixel to the right of top left
	 * buffer[1][0] is the pixel below the top left pixel
	 *
	 * In other words, buffer is an array of w arrays
	 * which each have h members.
	 */
	class Bitmap
	{
	private:
		int w;
		int h;
		int **buffer;

	public:
		Bitmap(void);
		virtual ~Bitmap(void);
		Bitmap(const Bitmap& rhs);
		Bitmap& operator=(const Bitmap& rhs);

		void 	fill(int color);
		int 	getColorAt(int x, int y);
		int** 	getBuffer();
		int 	getHeight();
		int 	getWidth();
		void 	init(int w, int h);

		static int getc_R(int x);
		static int getc_G(int x);
		static int getc_B(int x);
		static int getc_A(int x);
		static int c_RGBA(int r, int g, int b, int a);
	};
};
