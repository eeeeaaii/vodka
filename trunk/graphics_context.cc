#include "carin.h"
#include "graphics_context.h"

#include "simple_defines.h"
#include "bitmap.h"
#include "for_debugging.h"

GraphicsContext::GraphicsContext()
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

GraphicsContext::~GraphicsContext()
{
}

void GraphicsContext::pushOrigin(carin::Point neworigin)
{
	// check to make sure we don't exceed capacity of stack
	dbg.trace("pushOrigin\n");
	originstack.push(neworigin);
}

carin::Point GraphicsContext::popOrigin()
{
	// check to make sure we don't pop too many times
	// (and index into a negative array index, in other
	// words, into garbage memory.
	dbg.trace("popOrigin: stack top now:\n");
	carin::Point p = originstack.top();
	originstack.pop();
	return p;
}

void GraphicsContext::drawSelectedRect(int x, int y, int w, int h)
{
	graphics->DrawRectangle(blackpen, x, y, w, h);
}

void GraphicsContext::drawUnselectedRect(int x, int y, int w, int h, Direction type)
{
	if (type == HDIR) {
		graphics->DrawRectangle(bluegreypen, x, y, w, h);
	} else if (type == VDIR) {
		graphics->DrawRectangle(greengreypen, x, y, w, h);
	} else if (type == ZDIR) {
		graphics->DrawRectangle(redgreypen, x, y, w, h);
	} else assert(false);
}

void GraphicsContext::drawBitmap(carin::Bitmap *b, int _x, int _y, bool selected)
{
	gcroot<System::Drawing::Bitmap*> bmp = new System::Drawing::Bitmap(b->getWidth(), b->getHeight());
	System::Drawing::Color bmpcolor;
	for (int x = 0 ; x < b->getWidth() ; x++) {
		for (int y = 0 ; y < b->getHeight() ; y++) {
			int c = b->getColorAt(x, y);
			int r = carin::Bitmap::getc_R(c);
			int g = carin::Bitmap::getc_G(c);
			int b = carin::Bitmap::getc_B(c);
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

void GraphicsContext::drawText(string text, int x, int y, int selected)
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

int GraphicsContext::getTextHeight(string text)
{
	gcroot<System::String*> str;
	System::Drawing::SizeF sizef;
	str = new System::String(text.c_str());
	sizef = graphics->MeasureString(str, basefont);
	return (int)floor(sizef.get_Height());
}

int GraphicsContext::getTextWidth(string text)
{
	gcroot<System::String*> str;
	System::Drawing::SizeF sizef;
	str = new System::String(text.c_str());
	sizef = graphics->MeasureString(str, basefont);
	return (int)floor(sizef.get_Width());
}

