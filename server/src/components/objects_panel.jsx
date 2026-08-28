const ObjectsPanel = () => {
  return (
    <div className="infopanel">
      <p className="infotitle">Abstract Data Types?</p>

      <p className="infosubheader">Instantiation</p>
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
        to <span className="infohotkey">foo</span>and it has a child tagged with <span className="infohotkey">bar</span>you can refer to the child
        using <span className="infohotkey">foo.bar</span>.
      </p>
      <p className="infolinemargin">
        This can, of course, be extended past the first level child. If <span className="infohotkey">foo.bar</span>is an org
        with tagged children, then <span className="infohotkey">foo.bar</span>can be a receiver, and <span className="infohotkey">foo.bar.baz</span>refers
        to its children.
      </p>
      <p className="infolinemargin">
        If an org has a lambda child tagged <span className="infohotkey">:init</span>, that will run on instantiation. The arguments
        you pass to <span className="infohotkey">^</span>will go to this lambda.
      </p>
      <p className="infolinemargin">
        If an org has a lambda child tagged <span className="infohotkey">:draw</span>, that returns HTML, that HTML will be drawn instead
        of the org when in normal (non-exploded) mode.
      </p>
      <p className="infolinemargin">
        If an org has a doc child tagged <span className="infohotkey">:docs</span>, those docs appear in the tooltip when you type its bound name
        into the instantiator.
      </p>
      <p className="infolinemargin">
        Remember how I said that lambdas get turned into closures when you instantiate? When this happens,
        they are given an extra binding in their environment. This is the symbol <span className="infohotkey">@self</span>bound back to the instance org.
      </p>
      <p className="infosubheader">Contracts</p>
      <p className="infolinemargin">
        What are types in programming languages for? They exist so that you can feel confident
        that certain things are true.
      </p>
      <p className="infolinemargin">
        Vodka does this with contracts. A contract is an object that encapsulates some set of assumptions
        about a nex. For example, it must be an integer.
      </p>
      <p className="infolinemargin">
        To use a contract, you must sign it with the <span className="infohotkey">sign for</span>builtin. But who is the signatory?
      </p>
      <p className="infolinemargin">
        A tag signs a contract. Once a tag is under contract, any nex tagged with that tag name must
        adhere to the contract. This is enforced when creating nexes in the editor,
        when instantiating instances, and when calling <span className="infohotkey">add-tag-to</span>.
        Tagged nexes that existed before the contract was signed are not affected, and these
        can be duplicated or copied and pasted without violating the contract.
      </p>
    </div>
  );
};

export default ObjectsPanel;
