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
