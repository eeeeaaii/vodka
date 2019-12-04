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

#include "null.h"
#include "storage_allocator.h"
#include "graphics_context.h"

using namespace whelk;

Null::Null(void)
{
	type = XT_NULL;
	mytext = "?";
}

Null::~Null(void)
{
}

Delta Null::draw(GraphicsContext *grcon)
{
	Point p;
	int dx = 0, dy = 0;

	p = grcon->popOrigin();
	grcon->drawText("?", p.x, p.y, selected);
	dx += getWidth(grcon);
	dy += getHeight(grcon);
	Delta d(dx, dy);
	return d;

}

sPointer<Expression> Null::newobj() {
	return GSA.createExp(new Null());
}


int Null::getHeight(GraphicsContext *grcon)
{
	return grcon->getTextHeight("?");
}
int Null::getWidth(GraphicsContext *grcon)
{
	return grcon->getTextWidth("?");
}
