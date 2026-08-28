const ObjectsPanel = () => {
    return (
        <div className="infopanel">
        <p className="infotitle">Objects</p>

        <p className="infolinemargin">There is no class construct. A type is an org bound to a name. Its children are the members, and a member's tag is its name.</p>
        <p className="infolinemargin"><span className="infohotkey">^</span>inserts an instantiator. Its data is the type name; its children are the arguments.</p>
        <p className="infolinemargin">Put dots in a symbol to reach members: the part before the first dot is looked up, and each name after it selects the child carrying that tag. A method call is a command whose name is a dotted path. Inside a method, <span className="infohotkey">self</span> is the object.</p>

        <p className="infospacer"></p>
        <p className="infosubheader">Member names that mean something:</p>
        <p className="infoline"><span className="infohotkey">:init</span>run on instantiation, receives the arguments</p>
        <p className="infoline"><span className="infohotkey">:draw</span>returns HTML, drawn in place of the object</p>
        <p className="infoline"><span className="infohotkey">:docs</span>documentation</p>
        <p className="infolineitalic"><span className="infohotkey">:shouldDraw</span>is unfinished. Without one, an object with a draw function redraws every pass.</p>

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
