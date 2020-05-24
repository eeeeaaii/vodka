{
  

  function concatParserString(arr) {
    return arr.join('');
  }

  function makeInteger(negation, digits) {
    let n = Number(concatParserString(digits));
    if (negation) {
      n = -n;
    }
    return new Integer(n);
  }

  function makeSymbol(letters) {
    return new ESymbol(concatParserString(letters));
  }

  function makeString(contents) {
    return new EString(concatParserString(contents));
  }

  function makeFloat(contents) {
    return new Float(contents);
  }

  function makeNil() {
    return new Nil();
  }

  function makeOrgList(children) {
    let r = new Org();
    for (let i = 0; i < children.length ; i++) {
      r.appendChild(children[i]);
    }
    return r;
  }

  function makeExpList(children) {
    let r = new Expectation();
    for (let i = 0; i < children.length ; i++) {
      r.appendChild(children[i]);
    }
    return r;
  }

  function makeLambdaList(children) {
    let r = new Lambda();
    for (let i = 0; i < children.length ; i++) {
      r.appendChild(children[i]);
    }
    return r;
  }

  function makeCommandList(children) {
    let r = new Command();
    for (let i = 0; i < children.length ; i++) {
      r.appendChild(children[i]);
    }
    return r;
  }

  function makeNamedCommandList(name, children) {
    name = concatParserString(name);
    let r = new Command(Command.convertV2StringToMath(name));
    for (let i = 0; i < children.length ; i++) {
      r.appendChild(children[i]);
    }
    return r;
  }

  function makeNamedCommandListWithPrivate(name, privatedata, children) {
    name = concatParserString(name);
    let r = new Command(Command.convertV2StringToMath(name));
    for (let i = 0; i < children.length ; i++) {
      r.appendChild(children[i]);
    }
    r.setPrivateData(privateData);
    return r;
  }
}


start
  = parser_version_identifier _ NEX:nex _ { return NEX; }
  ;

parser_version_identifier
  = 'v2:'
  ;

nex
 = atom
 / list
 ;

list
 = org_list
 / exp_list
 / lambda_list
 / cmd_list
 ;

org_list
 = '(' CHILDREN:(nex_with_space *) _  ')' { return makeOrgList(CHILDREN); }
 ;

exp_list
 = '*(' CHILDREN:(nex_with_space *) _  ')' { return makeExpList(CHILDREN); }
 ;

lambda_list
 = '&(' CHILDREN:(nex_with_space *) _  ')' { return makeLambdaList(CHILDREN); }
 ;

cmd_list
 = '~(' CHILDREN:(nex_with_space *) _  ')' { return makeCommandList(CHILDREN); }
 / '~(' NAME:cmd_name CHILDREN:(nex_with_space *) _  ')' { return makeNamedCommandList(NAME, CHILDREN); }
 / '~(' NAME:cmd_name PRIVATE:private_data_section CHILDREN:(nex_with_space *) _  ')' { return makeNamedCommandListWithPrivate(NAME, PRIVATE, CHILDREN); }
 ;

cmd_name
 = [a-zA-Z0-9:-]*
 ;

nex_with_space
 = _ NEX:nex { return NEX; }

atom
  = boolean_expression
  / symbol_expression
  / integer_expression
  / string_expression
  / float_expression
  / nil_expression
  ;

boolean_expression
  = '!yes' { return new Bool(true); }
  / '!no'  { return new Bool(false); }
  ;

symbol_expression
  = '@' SYMBOL:[a-zA-Z0-9_:-]+ { return makeSymbol(SYMBOL); }
  ;

integer_expression
  = '#' NEGATION:'-'? DIGITS:[0-9]+ { return makeInteger(NEGATION, DIGITS); }
  ;

string_expression
  = '$' '"' STRING_CONTENTS:[^"]* '"' { return makeString(STRING_CONTENTS); }
  / '$' STRING_CONTENTS:private_data_section { return makeString(STRING_CONTENTS); }
  ;

float_expression
  = '%' FLOAT:float_digits { return makeFloat(FLOAT); }
  ;

nil_expression
  = '^' { return makeNil() }
  ;

float_digits
  = INT_PART:integer_part DEC_PART:( '.' DEC_DIGITS:decimal_part {return DEC_DIGITS; } ) ?
      { return  DEC_PART ? (INT_PART + '.' + DEC_PART) : INT_PART} 
  ;

integer_part
  = DIGITS:( [0-9] + ) { return DIGITS.join(''); }
  / '-' DIGITS:( [0-9] + ) { return '-' + DIGITS.join(''); }
  ;

decimal_part
  = DIGITS:( [0-9] + ) { return DIGITS.join(''); }
  ;

private_data_section
  = start_private_data DATA:private_data_items end_private_data { return DATA; }
  ;

start_private_data
  = '|SP|'
  ;

end_private_data
  = '|EP|'
  ;

private_data_items
  = ( private_data_item * )
  ;

private_data_item
  = CHAR:[^|] { return CHAR; }
  / '||' { return '|'; }
  ;

_
 = [ \r\n\t]*
 ;

