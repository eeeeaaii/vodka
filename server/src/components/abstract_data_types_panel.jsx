const AbstractDataTypesPanel = () => {
  return (
    <div className="infopanel">
      <p className="infotitle">Abstract Data Types?</p>

      <p className="infosubheader">Instantiation</p>
      <p className="infolinemargin"><span className="infohotkey">^</span>inserts an instantiator. But what is it instantiating?</p>
      <p className="infolinemargin">
        A thing that can be instantiated is called a model.
        To create a model, bind an org to a symbol with <span className="infohotkey">bind
        </span>. Tag the children of the model with tags that describe what
        each child is.
        Then you will be able to create an instance of that model. Type <span className="infohotkey">^thesymbolname</span>to do this.
      </p>
      <p className="infospacer"></p>
      <p className="infolinemargin">
        What is an instance?
      </p>
      <p className="infolinemargin">
        An instance is a copy of the model,
        but any lambdas in it will have been converted to closures.
        Every instance is a different object.
      </p>
      <p className="infospacer"></p>
      <p className="infolinemargin">
        But why do lambdas get turned into closures when you instantiate?
      </p>
      <p className="infolinemargin">
        At instantiation, these closures are given an extra binding in their environment. This is the symbol <span className="infohotkey">@self</span>bound back to the instance org.
      </p>
      <p className="infospacer"></p>
      <p className="infolinemargin">
        But why am I tagging the children of the model?
      </p>
      <p className="infolinemargin">
        If any org (not just an instance) is bound to a name, then it can be used as a receiver. Receiver syntax
        allows you to refer to children of that org using dots. If the org is bound
        to <span className="infohotkey">foo</span>and it has a child tagged with <span className="infohotkey">bar</span>you can refer to the child
        using <span className="infohotkey">foo.bar</span>.
        This can, of course, be extended past the first level child. If <span className="infohotkey">foo.bar</span>is also an org
        with tagged children, then <span className="infohotkey">foo.bar</span>can also be a receiver, and <span className="infohotkey">foo.bar.baz</span>refers
        to a child of it tagged with <span className="infohotkey">baz</span>.
      </p>
      <p className="infospacer"></p>
      <p className="infolinemargin">
        But what does receiver syntax have to do with instances?
      </p>
      <p className="infolinemargin">
        Tags in the model become tags in the instance.
        Therefore, if an instance bound to <span className="infohotkey">foo</span>
        has a child closure tagged with <span className="infohotkey">bar</span>, you can type <span className="infohotkey">~foo.bar</span> to call that function.
        Similarly the symbol <span className="infohotkey">@foo.baz</span>
        would refer to a child of that instance tagged <span className="infohotkey">baz</span>.
      </p>
      <p className="infospacer"></p>
      <p className="infolinemargin">
        But what about the arguments that you pass to  <span className="infohotkey">^</span> when instantiating?
      </p>
      <p className="infolinemargin">
        If the model has a lambda child tagged <span className="infohotkey">:init</span>, that function will run on instantiation. The arguments
        will go to this lambda.
      </p>
      <p className="infolinemargin">

        In addition to <span className="infohotkey">:init</span>, there are other special tags that can be applied to children of
        the model.
        If the model has a lambda child tagged <span className="infohotkey">:draw</span>, that returns HTML, an instance of that model will
        be rendered with that HTML in normal (non-exploded) mode.
        If the model has a doc child tagged <span className="infohotkey">:docs</span>, those docs appear in the tooltip when you type the model name
        into the instantiator.
      </p>
      <p className="infospacer"></p>
      <p className="infospacer"></p>
      <p className="infosubheader">Contracts</p>
      <p className="infolinemargin">
        But how are types enforced?
      </p>
      <p className="infolinemargin">
        First, let us ask: what are types in programming languages for? They exist so that you can feel confident
        that certain things are true.
        Vodka does this with things called contracts. A contract is an object that encapsulates some set of assumptions
        about a nex. For example, a contract might say that anything
        tagged with <span className="infohotkey">int</span>
        must be an integer.
        To use a contract, you must sign it with the <span className="infohotkey">sign for</span>builtin.
      </p>
      <p className="infospacer"></p>
      <p className="infolinemargin">
        But who is the signatory?
      </p>
      <p className="infolinemargin">
        A tag signs a contract. Once a tag is under contract, any nex tagged with that tag name must
        adhere to the contract. This is enforced when creating nexes in the editor,
        when instantiating instances, and when calling <span className="infohotkey">add-tag-to</span>.
        Tagged nexes that existed before the contract was signed are not affected, and these
        can be duplicated or copied and pasted without violating the contract.
      </p>
      <p className="infospacer"></p>
      <p className="infolinemargin">
        What kinds of contracts exist?
      </p>
      <p className="infoline">
        <span className="infohotkey">type-contract</span>
        the nex must be a given type
      </p>
      <p className="infoline">
        <span className="infohotkey">identity-contract</span>
        only this exact nex can bear this tag
      </p>
      <p className="infoline">
        <span className="infohotkey">tag-contract</span>
        the tag under contract can only be applied
        to nexes that additionally have another specific tag
      </p>
      <p className="infospacer"></p>
      <p className="infolinemargin">
        What kinds of contracts are planned?
      </p>
      <p className="infoline">
        <span className="infohotkey">and-contract</span>
        the nex must satisfy some set of other contracts
      </p>
      <p className="infoline">
        <span className="infohotkey">has-child-contract</span>
        the nex must be an org or other container type
        and it must have a child with a specific tag
      </p>
      <p className="infospacer"></p>
      <p className="infolinemargin">
        How would I express an abstract data type using these contracts?
      </p>
      <p className="infolinemargin">
        Compose them. For example, let's say you want
        a 2d mathematical vector type. Your contracts:
      </p>
      <p className="infoline">
        <span className="infohotkey">type-contract</span>
        anything tagged <span className="infohotkey">float</span>must be a float.
      </p>
      <p className="infoline">
        <span className="infohotkey">tag-contract</span>
        anything tagged <span className="infohotkey">x-dimension</span>must have the tag <span className="infohotkey">float</span>.
      </p>
      <p className="infoline">
        <span className="infohotkey">tag-contract</span>
        anything tagged <span className="infohotkey">y-dimension</span>must have the tag <span className="infohotkey">float</span>.
      </p>
      <p className="infoline">
        <span className="infohotkey">and-contract</span>
        any org tagged <span className="infohotkey">2d-vector</span>must have:
        <ul>
          <li>
            <span className="infohotkey">has-child-contract</span>it must have a child tagged <span className="infohotkey">y-dimension</span>
          </li>
          <li>
            <span className="infohotkey">has-child-contract</span>it must have
            a child tagged <span className="infohotkey">x-dimension</span>
          </li>
        </ul>
      </p>
    </div>
  );
};

export default AbstractDataTypesPanel;
