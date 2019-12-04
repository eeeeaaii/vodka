// Copyright 2003-2005, 2008, Jason Scherer
// Copyright 2019 Google, Inc.
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


#include "windows_graphics_context.h"

#include "simple_defines.h"
#include "bitmap.h"
#include "for_debugging.h"

WindowsGraphicsContext::WindowsGraphicsContext()
{
	System::Drawing::Color black;
	System::Drawing::Color bluegrey;
	System::Drawing::Color greengrey;
	System::Drawing::Color redgrey;
	black = black.FromArgb(0, 0, 0);
	bluegrey = bluegrey.FromArgb(110, 110, 190);
	greengrey = greengrey.FromArgb(110, 190, 110);
	redgrey = redgrey.FromArgb(190, 110, 110);
	blackpen = new System::Drawing::Pen(black);
	bluegreypen = new System::Drawing::Pen(bluegrey);
	greengreypen = new System::Drawing::Pen(greengrey);
	redgreypen = new System::Drawing::Pen(redgrey);
	fontfamily = new System::Drawing::FontFamily(System::Drawing::Text::GenericFontFamilies::Monospace);
	basefont = new System::Drawing::Font(fontfamily, 10);
	selectedtextfillbrush = new System::Drawing::SolidBrush(black);
	unselectedtextfillbrush = new System::Drawing::SolidBrush(bluegrey);
}

WindowsGraphicsContext::~WindowsGraphicsContext()
{
}

void WindowsGraphicsContext::pushOrigin(whelk::Point neworigin)
{
	// check to make sure we don't exceed capacity of stack
	dbg.trace("pushOrigin\n");
	originstack.push(neworigin);
}

whelk::Point WindowsGraphicsContext::popOrigin()
{
	// check to make sure we don't pop too many times
	// (and index into a negative array index, in other
	// words, into garbage memory.
	dbg.trace("popOrigin: stack top now:\n");
	whelk::Point p = originstack.top();
	originstack.pop();
	return p;
}

void WindowsGraphicsContext::drawSelectedRect(int x, int y, int w, int h)
{
	graphics->DrawRectangle(blackpen, x, y, w, h);
}

void WindowsGraphicsContext::drawUnselectedRect(int x, int y, int w, int h, Direction type)
{
	if (type == HDIR) {
		graphics->DrawRectangle(bluegreypen, x, y, w, h);
	} else if (type == VDIR) {
		graphics->DrawRectangle(greengreypen, x, y, w, h);
	} else if (type == ZDIR) {
		graphics->DrawRectangle(redgreypen, x, y, w, h);
	} else assert(false);
}

void WindowsGraphicsContext::drawBitmap(whelk::Bitmap *b, int _x, int _y, bool selected)
{
	gcroot<System::Drawing::Bitmap*> bmp = new System::Drawing::Bitmap(b->getWidth(), b->getHeight());
	System::Drawing::Color bmpcolor;
	for (int x = 0 ; x < b->getWidth() ; x++) {
		for (int y = 0 ; y < b->getHeight() ; y++) {
			int c = b->getColorAt(x, y);
			int r = whelk::Bitmap::getc_R(c);
			int g = whelk::Bitmap::getc_G(c);
			int b = whelk::Bitmap::getc_B(c);
			if (selected) {
				r = 256 - r;
				g = 256 - g;
				b = 256 - b;
			}
			bmpcolor = bmpcolor.FromArgb(r, g, b);
			bmp->SetPixel(x, y, bmpcolor);
		}
	}
	graphics->DrawImage(bmp, _x, _y);
}

void WindowsGraphicsContext::drawText(string text, int x, int y, int selected)
{
	gcroot<System::String*> str;
	str = new System::String(text.c_str());
	System::Drawing::PointF pointf;
	pointf.set_X((float)x);
	pointf.set_Y((float)y);
	if (selected) {
		graphics->DrawString(str, basefont, selectedtextfillbrush, pointf);
	} else {
		graphics->DrawString(str, basefont, unselectedtextfillbrush, pointf);
	}
}

int WindowsGraphicsContext::getTextHeight(string text)
{
	gcroot<System::String*> str;
	System::Drawing::SizeF sizef;
	str = new System::String(text.c_str());
	sizef = graphics->MeasureString(str, basefont);
	return (int)floor(sizef.get_Height());
}

int WindowsGraphicsContext::getTextWidth(string text)
{
	gcroot<System::String*> str;
	System::Drawing::SizeF sizef;
	str = new System::String(text.c_str());
	sizef = graphics->MeasureString(str, basefont);
	return (int)floor(sizef.get_Width());
}

