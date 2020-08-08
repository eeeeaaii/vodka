{
  

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
 = '(' CHILDREN:(nex_with_space *) _  ')' { return PF.makeOrgList(CHILDREN); }
 ;

exp_list
 = '*(' CHILDREN:(nex_with_space *) _  ')' { return PF.makeExpList(CHILDREN); }
 ;

lambda_list
 = '&(' CHILDREN:(nex_with_space *) _  ')' { return PF.makeLambdaList(CHILDREN); }
 ;

cmd_list
 = '~(' CHILDREN:(nex_with_space *) _  ')' { return PF.makeCommandList(CHILDREN); }
 / '~(' NAME:cmd_name CHILDREN:(nex_with_space *) _  ')' { return PF.makeNamedCommandList(NAME, CHILDREN); }
 / '~(' NAME:cmd_name PRIVATE:private_data_section CHILDREN:(nex_with_space *) _  ')' { return PF.makeNamedCommandListWithPrivate(NAME, PRIVATE, CHILDREN); }
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
  = '!yes' { return PF.makeBool(true); }
  / '!no'  { return PF.makeBool(false); }
  ;

symbol_expression
  = '@' SYMBOL:[a-zA-Z0-9_:-]+ { return PF.makeSymbol(SYMBOL); }
  ;

integer_expression
  = '#' NEGATION:'-'? DIGITS:[0-9]+ { return PF.makeInteger(NEGATION, DIGITS); }
  ;

string_expression
  = '$' '"' STRING_CONTENTS:[^"]* '"' { return PF.makeString(STRING_CONTENTS); }
  / '$' STRING_CONTENTS:private_data_section { return PF.makeString(STRING_CONTENTS); }
  ;

float_expression
  = '%' FLOAT:float_digits { return PF.makeFloat(FLOAT); }
  ;

nil_expression
  = '^' { return PF.makeNil() }
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

