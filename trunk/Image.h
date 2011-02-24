#pragma once
#include "Expression.h"

namespace carin {
	class Bitmap;

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
		virtual sPtr newobj();
		virtual sPtr copystate(sPtr n);
	};
}

