#pragma once
#include "expression.h"
#include "bitmap.h"
#include "graphics_context.h"

namespace whelk {
	class Image 
		: public Expression
	{
	private:
		Bitmap *value;
	public:
		Image();
		Image(Bitmap *b);
		~Image();
		Bitmap* getImageRep();
		void setImageRep(Bitmap*);
		virtual int determineType();
		virtual Delta draw(GraphicsContext *gc);
		void setBitmap(Bitmap *b);
		Bitmap *getBitmapCopy();
		int getWidth(GraphicsContext *grcon = 0);
		int getHeight(GraphicsContext *grcon = 0);
		int getColorAt(int x, int y);
		virtual sPointer<Expression> newobj();
		virtual sPointer<Expression> copystate(sPointer<Expression> n);
	};
}

