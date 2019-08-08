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
