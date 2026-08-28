const ObjectsPanel = () => {
  return (
    <div className="infopanel">
      <p className="infotitle">Abstract Data Types</p>

      <p className="infolinemargin"><span className="infohotkey">^</span>inserts an instantiator. But what is it instantiating?</p>
      <p className="infolinemargin">
        To create a thing that can be instantiated, name an org by binding it to a symbol with <span className="infohotkey">bind</span>.
        Then you will be able to instantiate something using that name.
      </p>
      <p className="infolinemargin">
        What is an instance? It is a copy of the original org, but any lambdas in it will have been converted to closures.
        Every instance is a different object.
      </p>
      <p className="infolinemargin">
        You might want to tag the children of the org you are instantiating. Why?
      </p>
      <p className="infolinemargin">
        If an org is bound to a name, then it can be used as a receiver. Receiver syntax
        allows you to refer to children of that org using dots. If the org is bound
        to `foo` and it has a child tagged with `bar` you can refer to the child
        using `foo.bar`.
      </p>
      <p className="infolinemargin">
        This can, of course, be extended past the first level child. If `foo.bar` is an org
        with tagged children, then `foo.bar` can be a receiver, and `foo.bar.baz` refers
        to its children.
      </p>
      <p className="infolinemargin">

      </p>

      <p className="infospacer"></p>
      <p className="infosubheader">Member names that mean something:</p>
      <p className="infoline"><span className="infohotkey">:init</span>run on instantiation, receives the arguments</p>
      <p className="infoline"><span className="infohotkey">:draw</span>returns HTML, drawn in place of the object</p>
      <p className="infoline"><span className="infohotkey">:docs</span>documentation</p>

      <p className="infospacer"></p>
      <p className="infosubheader">Instantiating:</p>
      <p className="infoline">Copies the members, turns lambdas into closures with <span className="infohotkey">self</span> bound, then calls <span className="infohotkey">:init</span>.</p>
      <p className="infoline">Members that aren't lambdas are copied, so each object gets its own.</p>
      <p className="infoline">Instantiating something that isn't an org hands it back unchanged.</p>
      <p className="infoline">There is no inheritance.</p>

      <p className="infospacer"></p>
      <p className="infosubheader">Contracts:</p>
      <p className="infolinemargin">Members are named by tags, so the type system is a tag system, and contracts are how it gets constrained.</p>
      <p className="infolinemargin">A contract is an object. <span className="infohotkey">certify satisfies</span>attaches one to a tag name, and from then on nothing can carry that tag unless it satisfies the contract — whether tagged with <span className="infohotkey">`</span>or with <span className="infohotkey">add-tag</span>.</p>
      <p className="infoline"><span className="infohotkey">has-tag-contract</span>satisfied by anything carrying a given tag</p>
      <p className="infoline"><span className="infohotkey">type-contract</span>satisfied by anything of the same type as a given object</p>
      <p className="infoline"><span className="infohotkey">identity-contract</span>satisfied only by one specific object</p>
      <p className="infolinemargin">Because member names are tags, a contract on a member name constrains that member in every object that has one. This is the closest thing to declaring a type.</p>

      <p className="infospacer"></p>
      <p className="infolineitalic">The vector package uses all of this.</p>
    </div>
  );
};

export default ObjectsPanel;
