module homunculus from 'homunculus';
import join from './join';
import ignore from './ignore';
import getVar from './getVar';
import clone from './clone';

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

class Fn {
  constructor(node, ignores, index) {
    this.node = node;
    this.ignores = ignores;
    this.index = index;
    this.params = [];
    this.flag = false;
    this.res = '';
    this.preCompiler(node, ignores, index);
  }
  preCompiler(node, ignores, index) {
    var self = this;
    var ps = node.leaf(1).leaves();
    ps.slice(1, ps.length - 1).forEach(function(leaf, i) {
      if(i % 2 == 0) {
        self.params.push(leaf.token().content());
      }
    });
  }
  compile(cParams, varHash, globalVar) {
    var self = this;
    var newVarHash = clone(varHash);
    var leaves = cParams.leaves();
    leaves.slice(1, leaves.length - 1).forEach(function(leaf, i) {
      if(i % 2 == 0) {
        var idx = Math.floor(i / 2);
        var k = join(leaf, self.ignores);
        if(idx < self.params.length) {
          var v = self.params[idx];
          v = v.replace(/^\${?/, '').replace(/}$/, '');
          newVarHash[v] = k;
        }
      }
    });
    self.recursion(self.node, newVarHash, globalVar);
    return self.res.replace(/^{/, '').replace(/}$/, '');
  }
  recursion(node, newVarHash, globalVar) {
    var self = this;
    var isToken = node.name() == Node.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(isToken) {
      if(!isVirtual) {
        if(self.flag) {
          var token = node.token();
          self.res += getVar(token, newVarHash, globalVar);
        }
        while(self.ignores[++self.index]) {
          var s = self.ignores[self.index].content();
          if(self.flag && s != '\n') {
            self.res += s;
          }
        }
      }
    }
    else {
      if(node.name() == Node.BLOCK) {
        self.flag = true;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf, newVarHash, globalVar);
      });
    }
  }
}

export default Fn;