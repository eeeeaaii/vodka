// "header" file

class super
{
	protected:
		int joe;
};

class sub : public super
{
	int myfunc(super* x);
};

void f(super *s);

// "implementation" file

int sub::myfunc(super* x)
{
	int y = 3 + x->joe;
	return y;

}

void f(super *s)
{
}


void main()
{
	super* _sup = new super();
	sub* _sub = new sub();
	f(_sup);
	f(_sub);
	super* _sup2 = _sub;
	f(_sup2);

	_sub->myfunc(_sub);
	_sub->myfunc(_sup);

}
