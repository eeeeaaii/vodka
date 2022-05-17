// This file is part of Vodka.

// Vodka is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Vodka is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Vodka.  If not, see <https://www.gnu.org/licenses/>.


{
  const RIGHT_BRACE = String.fromCharCode(125);
  const BACKTICK = String.fromCharCode(96);
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
 / instance_list
 / instantiator_list
 ;

instance_list
 = INST_NAME:nonmutable_instance_name PRIVATE:private_data_section '(' TAGLIST:taglist? CHILDREN:(nex_with_space *) _ ')' { return PF.makeInstanceList(INST_NAME, CHILDREN, PRIVATE, TAGLIST, 'h', true /* nonmutable */); }
 / INST_NAME:nonmutable_instance_name PRIVATE:private_data_section '(_' TAGLIST:taglist? CHILDREN:(nex_with_space *) _ '_)' { return PF.makeInstanceList(INST_NAME, CHILDREN, PRIVATE, TAGLIST, 'h', true /* nonmutable */); }
 / INST_NAME:nonmutable_instance_name PRIVATE:private_data_section '(|' TAGLIST:taglist? CHILDREN:(nex_with_space *) _ '|)' { return PF.makeInstanceList(INST_NAME, CHILDREN, PRIVATE, TAGLIST, 'v', true /* nonmutable */); }
 / INST_NAME:nonmutable_instance_name PRIVATE:private_data_section '(,' TAGLIST:taglist? CHILDREN:(nex_with_space *) _ ',)' { return PF.makeInstanceList(INST_NAME, CHILDREN, PRIVATE, TAGLIST, 'z', true /* nonmutable */); }
 / INST_NAME:instance_name PRIVATE:private_data_section '(' TAGLIST:taglist? CHILDREN:(nex_with_space *) _ ')' { return PF.makeInstanceList(INST_NAME, CHILDREN, PRIVATE, TAGLIST, 'h'); }
 / INST_NAME:instance_name PRIVATE:private_data_section '(_' TAGLIST:taglist? CHILDREN:(nex_with_space *) _ '_)' { return PF.makeInstanceList(INST_NAME, CHILDREN, PRIVATE, TAGLIST, 'h'); }
 / INST_NAME:instance_name PRIVATE:private_data_section '(|' TAGLIST:taglist? CHILDREN:(nex_with_space *) _ '|)' { return PF.makeInstanceList(INST_NAME, CHILDREN, PRIVATE, TAGLIST, 'v'); }
 / INST_NAME:instance_name PRIVATE:private_data_section '(,' TAGLIST:taglist? CHILDREN:(nex_with_space *) _ ',)' { return PF.makeInstanceList(INST_NAME, CHILDREN, PRIVATE, TAGLIST, 'z'); }
 ;

org_list
 = ';' PRIVATE:private_data_section '(' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ')' { return PF.makeOrgList(CHILDREN, PRIVATE, TAGLIST, 'h', true /* nonmutable */); }
 / ';' PRIVATE:private_data_section '(_' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '_)' { return PF.makeOrgList(CHILDREN, PRIVATE, TAGLIST, 'h', true /* nonmutable */); }
 / ';' PRIVATE:private_data_section '(|' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '|)' { return PF.makeOrgList(CHILDREN, PRIVATE, TAGLIST, 'v', true /* nonmutable */); }
 / ';' PRIVATE:private_data_section '(,' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ',)' { return PF.makeOrgList(CHILDREN, PRIVATE, TAGLIST, 'z', true /* nonmutable */); }
 / PRIVATE:private_data_section '(' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ')' { return PF.makeOrgList(CHILDREN, PRIVATE, TAGLIST, 'h'); }
 / PRIVATE:private_data_section '(_' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '_)' { return PF.makeOrgList(CHILDREN, PRIVATE, TAGLIST, 'h'); }
 / PRIVATE:private_data_section '(|' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '|)' { return PF.makeOrgList(CHILDREN, PRIVATE, TAGLIST, 'v'); }
 / PRIVATE:private_data_section '(,' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ',)' { return PF.makeOrgList(CHILDREN, PRIVATE, TAGLIST, 'z'); }
 ;

exp_list
 = '*;' PRIVATE:private_data_section '(' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ')' { return PF.makeDeferredCommandList(CHILDREN, PRIVATE, TAGLIST, 'h', true /* nonmutable */); }
 / '*;' PRIVATE:private_data_section '(_' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '_)' { return PF.makeDeferredCommandList(CHILDREN, PRIVATE, TAGLIST, 'h', true /* nonmutable */); }
 / '*;' PRIVATE:private_data_section '(|' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '|)' { return PF.makeDeferredCommandList(CHILDREN, PRIVATE, TAGLIST, 'v', true /* nonmutable */); }
 / '*;' PRIVATE:private_data_section '(,' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ',)' { return PF.makeDeferredCommandList(CHILDREN, PRIVATE, TAGLIST, 'z', true /* nonmutable */); }
 / '*' PRIVATE:private_data_section '(' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ')' { return PF.makeDeferredCommandList(CHILDREN, PRIVATE, TAGLIST, 'h'); }
 / '*' PRIVATE:private_data_section '(_' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '_)' { return PF.makeDeferredCommandList(CHILDREN, PRIVATE, TAGLIST, 'h'); }
 / '*' PRIVATE:private_data_section '(|' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '|)' { return PF.makeDeferredCommandList(CHILDREN, PRIVATE, TAGLIST, 'v'); }
 / '*' PRIVATE:private_data_section '(,' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ',)' { return PF.makeDeferredCommandList(CHILDREN, PRIVATE, TAGLIST, 'z'); }
 ;

lambda_list
 = '&;' PRIVATE:private_data_section '(' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ')' { return PF.makeLambdaList(CHILDREN, PRIVATE, TAGLIST, 'h', true /* nonmutable */); }
 / '&;' PRIVATE:private_data_section '(_' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '_)' { return PF.makeLambdaList(CHILDREN, PRIVATE, TAGLIST, 'h', true /* nonmutable */); }
 / '&;' PRIVATE:private_data_section '(|' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '|)' { return PF.makeLambdaList(CHILDREN, PRIVATE, TAGLIST, 'v', true /* nonmutable */); }
 / '&;' PRIVATE:private_data_section '(,' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ',)' { return PF.makeLambdaList(CHILDREN, PRIVATE, TAGLIST, 'z', true /* nonmutable */); }
 / '&' PRIVATE:private_data_section '(' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ')' { return PF.makeLambdaList(CHILDREN, PRIVATE, TAGLIST, 'h'); }
 / '&' PRIVATE:private_data_section '(_' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '_)' { return PF.makeLambdaList(CHILDREN, PRIVATE, TAGLIST, 'h'); }
 / '&' PRIVATE:private_data_section '(|' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '|)' { return PF.makeLambdaList(CHILDREN, PRIVATE, TAGLIST, 'v'); }
 / '&' PRIVATE:private_data_section '(,' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ',)' { return PF.makeLambdaList(CHILDREN, PRIVATE, TAGLIST, 'z'); }
 ;

cmd_list
 = '~;' PRIVATE:private_data_section '(' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ')' { return PF.makeCommandList(null, CHILDREN, PRIVATE, TAGLIST, 'h', true /* nonmutable */); }
 / '~;' PRIVATE:private_data_section '(_' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '_)' { return PF.makeCommandList(null, CHILDREN, PRIVATE, TAGLIST, 'h', true /* nonmutable */); }
 / '~;' PRIVATE:private_data_section '(|' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '|)' { return PF.makeCommandList(null, CHILDREN, PRIVATE, TAGLIST, 'v', true /* nonmutable */); }
 / '~;' PRIVATE:private_data_section '(,' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ',)' { return PF.makeCommandList(null, CHILDREN, PRIVATE, TAGLIST, 'z', true /* nonmutable */); }
 / '~;' PRIVATE:private_data_section '(' TAGLIST:taglist? NAME:cmd_name ( ws + ) CHILDREN:(nex_with_space *) _  ')' { return PF.makeCommandList(NAME, CHILDREN, PRIVATE, TAGLIST, 'h', true /* nonmutable */); }
 / '~;' PRIVATE:private_data_section '(_' TAGLIST:taglist? NAME:cmd_name ( ws + ) CHILDREN:(nex_with_space *) _  '_)' { return PF.makeCommandList(NAME, CHILDREN, PRIVATE, TAGLIST, 'h', true /* nonmutable */); }
 / '~;' PRIVATE:private_data_section '(|' TAGLIST:taglist? NAME:cmd_name ( ws + ) CHILDREN:(nex_with_space *) _  '|)' { return PF.makeCommandList(NAME, CHILDREN, PRIVATE, TAGLIST, 'v', true /* nonmutable */); }
 / '~;' PRIVATE:private_data_section '(,' TAGLIST:taglist? NAME:cmd_name ( ws + ) CHILDREN:(nex_with_space *) _  ',)' { return PF.makeCommandList(NAME, CHILDREN, PRIVATE, TAGLIST, 'z', true /* nonmutable */); }
 / '~' PRIVATE:private_data_section '(' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ')' { return PF.makeCommandList(null, CHILDREN, PRIVATE, TAGLIST, 'h'); }
 / '~' PRIVATE:private_data_section '(_' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '_)' { return PF.makeCommandList(null, CHILDREN, PRIVATE, TAGLIST, 'h'); }
 / '~' PRIVATE:private_data_section '(|' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '|)' { return PF.makeCommandList(null, CHILDREN, PRIVATE, TAGLIST, 'v'); }
 / '~' PRIVATE:private_data_section '(,' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ',)' { return PF.makeCommandList(null, CHILDREN, PRIVATE, TAGLIST, 'z'); }
 / '~' PRIVATE:private_data_section '(' TAGLIST:taglist? NAME:cmd_name ( ws + ) CHILDREN:(nex_with_space *) _  ')' { return PF.makeCommandList(NAME, CHILDREN, PRIVATE, TAGLIST, 'h'); }
 / '~' PRIVATE:private_data_section '(_' TAGLIST:taglist? NAME:cmd_name ( ws + ) CHILDREN:(nex_with_space *) _  '_)' { return PF.makeCommandList(NAME, CHILDREN, PRIVATE, TAGLIST, 'h'); }
 / '~' PRIVATE:private_data_section '(|' TAGLIST:taglist? NAME:cmd_name ( ws + ) CHILDREN:(nex_with_space *) _  '|)' { return PF.makeCommandList(NAME, CHILDREN, PRIVATE, TAGLIST, 'v'); }
 / '~' PRIVATE:private_data_section '(,' TAGLIST:taglist? NAME:cmd_name ( ws + ) CHILDREN:(nex_with_space *) _  ',)' { return PF.makeCommandList(NAME, CHILDREN, PRIVATE, TAGLIST, 'z'); }
 ;

instantiator_list
 = '^;' PRIVATE:private_data_section '(' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ')' { return PF.makeInstantiatorList(CHILDREN, PRIVATE, TAGLIST, 'h', true /* nonmutable */); }
 / '^;' PRIVATE:private_data_section '(_' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '_)' { return PF.makeInstantiatorList(CHILDREN, PRIVATE, TAGLIST, 'h', true /* nonmutable */); }
 / '^;' PRIVATE:private_data_section '(|' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '|)' { return PF.makeInstantiatorList(CHILDREN, PRIVATE, TAGLIST, 'v', true /* nonmutable */); }
 / '^;' PRIVATE:private_data_section '(,' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ',)' { return PF.makeInstantiatorList(CHILDREN, PRIVATE, TAGLIST, 'z', true /* nonmutable */); }
 / '^' PRIVATE:private_data_section '(' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ')' { return PF.makeInstantiatorList(CHILDREN, PRIVATE, TAGLIST, 'h'); }
 / '^' PRIVATE:private_data_section '(_' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '_)' { return PF.makeInstantiatorList(CHILDREN, PRIVATE, TAGLIST, 'h'); }
 / '^' PRIVATE:private_data_section '(|' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  '|)' { return PF.makeInstantiatorList(CHILDREN, PRIVATE, TAGLIST, 'v'); }
 / '^' PRIVATE:private_data_section '(,' TAGLIST:taglist? CHILDREN:(nex_with_space *) _  ',)' { return PF.makeInstantiatorList(CHILDREN, PRIVATE, TAGLIST, 'z'); }
 ;

cmd_name
 = SYM:(':' [+=*/<>] [+=*/<>]) { return SYM; }
 / SYM:(':' [+=*/<>]) { return SYM; }
 / NAME:([a-zA-Z0-9:.-]*) { return NAME; }
 ;

instantiator_org_name
 = NAME:([a-zA-Z0-9-]*) { return NAME; }
 ;

children_in_parens
 = '(' CHILDREN:(nex_with_space *) _  ')' { return CHILDREN; }
 ;

nex_with_space
 = _ NEX:nex { return NEX; }

atom
  = boolean_expression
  / symbol_expression
  / integer_expression
  / string_expression
  / error_expression
  / float_expression
  / instance_atom
  ;

instance_atom
 = INST_NAME:nonmutable_instance_name PRIVATE:private_data_section TAGLIST:taglist? ! '(' { return PF.makeInstanceAtom(INST_NAME, PRIVATE, TAGLIST, true /* nonmutable */); }
 / INST_NAME:instance_name PRIVATE:private_data_section TAGLIST:taglist? ! '(' { return PF.makeInstanceAtom(INST_NAME, PRIVATE, TAGLIST); }
 ;

instance_name
 = '[' INST_NAME_DATA:instance_name_data ']' { return INST_NAME_DATA; }
 ;

nonmutable_instance_name
 = '[;' INST_NAME_DATA:instance_name_data ']' { return INST_NAME_DATA; }
 ;

instance_name_data
 = [a-zA-Z0-9]*
 ;

boolean_expression
  = '!;' TAGLIST:taglist? 'yes' { return PF.makeBool(true, TAGLIST, true /* nonmutable */); }
  / '!;' TAGLIST:taglist? 'no'  { return PF.makeBool(false, TAGLIST, true /* nonmutable */); }
  / '!' TAGLIST:taglist? 'yes' { return PF.makeBool(true, TAGLIST); }
  / '!' TAGLIST:taglist? 'no'  { return PF.makeBool(false, TAGLIST); }
  ;

symbol_expression
  = '@;' TAGLIST:taglist? SYMBOL:(symbol_char)+  { return PF.makeSymbol(SYMBOL, TAGLIST, true /* nonmutable */); }
  / '@' TAGLIST:taglist? SYMBOL:(symbol_char)+  { return PF.makeSymbol(SYMBOL, TAGLIST); }
  ;

symbol_char
  = SYMBOL_CHAR:[a-zA-Z0-9:.-] { return SYMBOL_CHAR; }
  / '_' ! ')'                { return '_'; }
  ;

integer_expression
  = '#;' TAGLIST:taglist? NEGATION:'-'? DIGITS:[0-9]+ { return PF.makeInteger(NEGATION, DIGITS, TAGLIST, true /* nonmutable */); }
  / '#' TAGLIST:taglist? NEGATION:'-'? DIGITS:[0-9]+ { return PF.makeInteger(NEGATION, DIGITS, TAGLIST); }
  ;

string_expression
  = '$;' TAGLIST:taglist?  DATA:private_data_section { return PF.makeString(DATA, TAGLIST, true /* nonmutable */); }
  / '$' TAGLIST:taglist?  DATA:private_data_section { return PF.makeString(DATA, TAGLIST); }
  ;

error_expression
  = '?' TAGLIST:taglist?   DATA:private_data_section { return PF.makeError(DATA, TAGLIST, true /* nonmutable */); }
  ;

float_expression
  = '%;' TAGLIST:taglist?  FLOAT:float_digits { return PF.makeFloat(FLOAT, TAGLIST, true /* nonmutable */); }
  / '%' TAGLIST:taglist?  FLOAT:float_digits { return PF.makeFloat(FLOAT, TAGLIST); }
  ;

float_digits
  = INT_PART:integer_part DEC_PART:( '.' DEC_DIGITS:decimal_part {return DEC_DIGITS; } ) ?
      { return  DEC_PART ? (INT_PART + '.' + DEC_PART) : INT_PART} 
  / '.' DEC_DIGITS:decimal_part { return '0.' + DEC_DIGITS; }
  ;

integer_part
  = DIGITS:( [0-9] + ) { return DIGITS.join(''); }
  / '-' DIGITS:( [0-9] + ) { return '-' + DIGITS.join(''); }
  ;

decimal_part
  = DIGITS:( [0-9] + ) { return DIGITS.join(''); }
  ;

taglist
  = '<' TAGS:(tagwithspace *) _ '>' { return TAGS; }
  ;

tagwithspace
  = _ TAG:tag { return TAG; }
  ;

tag
  = '`' TAG_DATA:[^`]* '`' { return TAG_DATA; }
  ;

private_data_section
  = '"' DATA:[^"]* '"' { return DATA; }
  / '{' DATA:escaped_private_data '}' { return DATA; }
  / '' { return null; }
  ;

escaped_private_data
  = ( private_data_item * )
  ;

private_data_item
  = CHAR:[^|}] { return CHAR; }
  / '|}' { return RIGHT_BRACE; }
  / '||' { return '|'; }
  ;

_
 = ws*
 ;

ws
 = [ \r\n\t]
