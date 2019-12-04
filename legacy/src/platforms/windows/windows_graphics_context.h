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
#include <vcclr.h>
#include "simple_defines.h"

namespace whelk {
	class Bitmap;

	class WindowsGraphicsContext : public GraphicsContext
	{
	private:
		gcroot<System::Drawing::Pen*> blackpen;   // can use str as if it were String*
		gcroot<System::Drawing::Pen*> bluegreypen;
		gcroot<System::Drawing::Pen*> greengreypen;
		gcroot<System::Drawing::Pen*> redgreypen;
		gcroot<System::Drawing::FontFamily*> fontfamily;
		gcroot<System::Drawing::Font*> basefont;
		gcroot<System::Drawing::SolidBrush*> selectedtextfillbrush;
		gcroot<System::Drawing::SolidBrush*> unselectedtextfillbrush;

	public:
		gcroot<System::Drawing::Graphics*> graphics;   // can use str as if it were String*
		WindowsGraphicsContext();
		virtual ~WindowsGraphicsContext();

		void pushOrigin(whelk::Point neworigin);
		whelk::Point popOrigin();

		void drawBitmap(whelk::Bitmap *b, int x, int y, bool selected);
		void drawSelectedRect(int x, int y, int w, int h);
		void drawUnselectedRect(int x, int y, int w, int h, Direction type);
		void drawText(string text, int x, int y, int selected);
		int getTextWidth(string text);
		int getTextHeight(string text);
	};
};

