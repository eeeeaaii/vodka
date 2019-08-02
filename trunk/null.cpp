#include "Carin.h"
#include "Null.h"

#include "StorageManager.h"
#include "GraphicsContext.h"


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
int Null::getHeight(GraphicsContext *grcon)
{
	return grcon->getTextHeight("?");
}
int Null::getWidth(GraphicsContext *grcon)
{
	return grcon->getTextWidth("?");
}
