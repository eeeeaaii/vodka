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

#include "image.h"
#include "bitmap.h"
#include "storage_allocator.h"
#include "graphics_context.h"

using namespace whelk;

Image::Image()
{
	value = 0;
	type = XT_IMAGE;
	mytext = "{image}";
}

Image::Image(Bitmap *b)
{
	value = b;
	type = XT_IMAGE;
	mytext = "{image}";
}

Image::~Image()
{
}

int Image::determineType()
{
	return XT_IMAGE;
}

Bitmap *Image::getImageRep()
{
	return value;
}

void Image::setImageRep(Bitmap *b)
{
	value = b;
}
Delta Image::draw(GraphicsContext *grcon)
{
	Delta d;
	Point p;
	p = grcon->popOrigin();
	grcon->drawBitmap(value, p.x, p.y, selected);
	d.dx = value->getWidth();
	d.dy = value->getHeight();
	return d;
}

void Image::setBitmap(Bitmap *b)
{
	assert(!value);
	value = b;
}

Bitmap *Image::getBitmapCopy()
{
	return new Bitmap(*value);
}

int Image::getWidth(GraphicsContext *grcon)
{
	return value->getWidth();
}

int Image::getHeight(GraphicsContext *grcon)
{
	return value->getHeight();
}

int Image::getColorAt(int x, int y)
{
	return value->getColorAt(x, y);
}

sPointer<Expression> Image::newobj()
{
   return GSA.createExp(new Image()); 
}

sPointer<Expression> Image::copystate(sPointer<Expression> n) {
	((Image*)n)->setBitmap(getBitmapCopy());
	return Expression::copystate(n);
}

