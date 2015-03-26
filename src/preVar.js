module homunculus from 'homunculus';
import ignore from './ignore';
import calculate from './calculate';
import exprstmt from './exprstmt';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

var index;

function recursion(node, ignores, varHash, globalVar, file, focus) {
  if(!node.isToken()) {
    if(node.name() == Node.VARDECL
      && ['$', '@'].indexOf(node.first().token().content().charAt(0)) > -1) {
      var i = index;
      while(ignores[++i]) {}
      while(ignores[++i]) {}
      var leaves = node.leaves();
      var k = leaves[0].token().content().slice(1);
      var v = leaves[2];
      switch(v.name()) {
        case Node.UNBOX:
          varHash[k] = {
            value: v.last().token().val(),
            unit: ''
          };
          break;
        case Node.ARRLTR:
        case Node.DIR:
        case Node.BASENAME:
        case Node.EXTNAME:
        case Node.WIDTH:
        case Node.HEIGHT:
          varHash[k] = {
            value: exprstmt(v, null, null, varHash, globalVar, file),
            unit: ''
          };
          break;
        default:
          varHash[k] = calculate(v, ignores, i, varHash, globalVar);
      }
      index = ignore(node, ignores, index).index;
      index = ignore(node.next(), ignores, index).index;
    }
    else {
      node.leaves().forEach(function(leaf) {
        //if和for和fn的在执行到时方运算
        if(focus || [Node.IFSTMT, Node.FORSTMT, Node.FN].indexOf(leaf.name()) == -1) {
          recursion(leaf, ignores, varHash, globalVar, file, focus);
        }
      });
    }
  }
  else if(!node.token().isVirtual()) {
    while(ignores[++index]) {}
  }
}

export default function(node, ignores, i, varHash, globalVar, file, focus) {
  index = i;
  recursion(node, ignores, varHash, globalVar, file, focus);
}