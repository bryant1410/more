module homunculus from 'homunculus';
module images from 'images';
module glob from 'glob';

module fs from 'fs';
module path from 'path';

import join from './join';
import ignore from './ignore';

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

function exprstmt(node, varHash, globalVar, file) {
  switch(node.name()) {
    case Node.DIR:
      return dir(node, varHash, globalVar, file);
    case Node.BASENAME:
      return basename(node, varHash, globalVar, file);
    case Node.EXTNAME:
      return extname(node, varHash, globalVar, file);
    case Node.WIDTH:
      return width(node, varHash, globalVar, file);
    case Node.HEIGHT:
      return height(node, varHash, globalVar, file);
    default:
      return eqstmt(node, varHash, globalVar);
  }
}

function dir(node, varHash, globalVar, file) {
  var cparam = node.last();
  var s = '';
  var onlyBase = false;
  if(cparam.size() > 2) {
    var p = cparam.leaf(1).first();
    if(p.isToken()) {
      var token = p.token();
      switch(token.type()) {
        case Token.STRING:
          s = token.val();
          break;
        case Token.VARS:
          s = token.content();
          var k = s.replace(/^[$@]\{?/, '').replace(/}$/, '');
          s = (varHash[k] || globalVar[k] || {}).value;
          break;
      }
    }
    onlyBase = !!cparam.leaf(3);
  }
  s = path.resolve(file, s);
  var res;
  if(fs.existsSync(s)) {
    var state = fs.lstatSync(s);
    if(state.isFile()) {
      s = path.dirname(s);
    }
    else if(!state.isDirectory()) {
      throw new Error('no such file or directory: ' + s + '\nline ' + node.first().token().line() + ', col ' + node.first().token().col());
    }
    var arr = fs.readdirSync(s);
    var res = [];
    arr.forEach(function(item) {
      var s2 = path.join(s, item);
      state = fs.lstatSync(s2);
      if(state.isFile()) {
        onlyBase ? res.push(path.relative(file, s2)) : res.push(s2);
      }
    });
  }
  else {
    res = glob.sync(s);
    if(onlyBase) {
      res = res.map(function(s) {
        return path.relative(file, s);
      });
    }
  }
  return res;
}

function basename(node, varHash, globalVar, file) {
  var cparam = node.last();
  var s = '';
  if(cparam.size() == 0) {
    throw new Error('@basename requires a param: ' + s + '\nline ' + node.first().token().line() + ', col ' + node.first().token().col());
  }
  var p = cparam.leaf(1).first();
  if(p.isToken()) {
    var token = p.token();
    switch(token.type()) {
      case Token.STRING:
        s = token.val();
        break;
      case Token.VARS:
        s = token.content();
        var k = s.replace(/^[$@]\{?/, '').replace(/}$/, '');
        s = (varHash[k] || globalVar[k] || {}).value;
        break;
    }
  }
  var ext = cparam.leaf(3);
  if(ext) {
    ext = ext.first().token().val();
  }
  else {
    ext = undefined;
  }
  s = path.resolve(file, s);
  return path.basename(s, ext);
}

function extname(node, varHash, globalVar, file) {
  var cparam = node.last();
  var s = '';
  if(cparam.size() == 0) {
    throw new Error('@extname requires a param: ' + s + '\nline ' + node.first().token().line() + ', col ' + node.first().token().col());
  }
  var p = cparam.leaf(1).first();
  if(p.isToken()) {
    var token = p.token();
    switch(token.type()) {
      case Token.STRING:
        s = token.val();
        break;
      case Token.VARS:
        s = token.content();
        var k = s.replace(/^[$@]\{?/, '').replace(/}$/, '');
        s = (varHash[k] || globalVar[k] || {}).value;
        break;
    }
  }
  s = path.resolve(file, s);
  return path.extname(s);
}

function width(node, varHash, globalVar, file) {
  var cparam = node.last();
  var s = '';
  if(cparam.size() == 0) {
    throw new Error('@width requires a param: ' + s + '\nline ' + node.first().token().line() + ', col ' + node.first().token().col());
  }
  var p = cparam.leaf(1).first();
  if(p.isToken()) {
    var token = p.token();
    switch(token.type()) {
      case Token.STRING:
        s = token.val();
        break;
      case Token.VARS:
        s = token.content();
        var k = s.replace(/^[$@]\{?/, '').replace(/}$/, '');
        s = (varHash[k] || globalVar[k] || {}).value;
        break;
    }
  }
  s = path.resolve(file, s);
  return images(s).width();
}

function height(node, varHash, globalVar, file) {
  var cparam = node.last();
  var s = '';
  if(cparam.size() == 0) {
    throw new Error('@height requires a param: ' + s + '\nline ' + node.first().token().line() + ', col ' + node.first().token().col());
  }
  var p = cparam.leaf(1).first();
  if(p.isToken()) {
    var token = p.token();
    switch(token.type()) {
      case Token.STRING:
        s = token.val();
        break;
      case Token.VARS:
        s = token.content();
        var k = s.replace(/^[$@]\{?/, '').replace(/}$/, '');
        s = (varHash[k] || globalVar[k] || {}).value;
        break;
    }
  }
  s = path.resolve(file, s);
  return images(s).height();
}

function eqstmt(node, varHash, globalVar) {
  if(node.name() == Node.EQSTMT) {
    var rel = relstmt(node.first(), varHash, globalVar);
    var next = node.leaf(1);
    var token = next.token();
    switch(token.content()) {
      case '==':
        return rel == relstmt(node.last(), varHash, globalVar);
      case '!=':
        return rel != relstmt(node.last(), varHash, globalVar);
    }
  }
  return relstmt(node, varHash, globalVar);
}

function relstmt(node, varHash, globalVar) {
  if(node.name() == Node.RELSTMT) {
    var add = addstmt(node.first(), varHash, globalVar);
    var next = node.leaf(1);
    var token = next.token();
    switch(token.content()) {
      case '>':
        return add > addstmt(node.last(), varHash, globalVar);
      case '>=':
        return add >= addstmt(node.last(), varHash, globalVar);
      case '<':
        return add < addstmt(node.last(), varHash, globalVar);
      case '<=':
        return add <= addstmt(node.last(), varHash, globalVar);
    }
  }
  return addstmt(node, varHash, globalVar);
}

function addstmt(node, varHash, globalVar) {
  if(node.name() == Node.ADDSTMT) {
    var mtpl = mtplstmt(node.first(), varHash, globalVar);
    var next = node.leaf(1);
    var token = next.token();
    switch(token.content()) {
      case '+':
        return mtpl + mtplstmt(node.last(), varHash, globalVar);
      case '-':
        return mtpl + mtplstmt(node.last(), varHash, globalVar);
    }
  }
  return mtplstmt(node, varHash, globalVar);
}

function mtplstmt(node, varHash, globalVar) {
  if(node.name() == Node.MTPLSTMT) {
    var postfix = postfixstmt(node.first(), varHash, globalVar);
    var next = node.leaf(1);
    var token = next.token();
    switch(token.content()) {
      case '*':
        return postfix * mtplstmt(node.last(), varHash, globalVar);
      case '/':
        return postfix / mtplstmt(node.last(), varHash, globalVar);
    }
  }
  return postfixstmt(node, varHash, globalVar);
}

function postfixstmt(node, varHash, globalVar) {
  if(node.name() == Node.POSTFIXSTMT) {
    var prmr = prmrstmt(node.first(), varHash, globalVar);
    var next = node.leaf(1);
    var token = next.token();
    switch(token.content()) {
      case '++':
        return prmr.value++;
      case '--':
        return prmr.value--;
    }
  }
  return prmrstmt(node, varHash, globalVar).value;
}

function prmrstmt(node, varHash, globalVar) {
  var token = node.first().token();
  var s = token.content();
  switch(token.type()) {
    case Token.VARS:
      var k = s.replace(/^[$@]\{?/, '').replace(/}$/, '');
      return varHash[k] || globalVar[k] || {};
    case Token.NUMBER:
      return { value: parseFloat(s) };
    case Token.STRING:
      return { value: s };
    default:
      if(s == '(') {
        return { value: exprstmt(node.leaf(1), varHash, globalVar) };
      }
      else if(s == '[') {
        var arr = [];
        node.leaves().forEach(function(item) {
          if(item.name() == Node.VALUE) {
            var token = item.first().token();
            var s = token.content();
            if(token.type() == Token.VARS) {
              arr.push(varHash[k] || globalVar[k] || {}).value;
            }
            else if(token.type() == Token.NUMBER) {
              arr.push(parseFloat(s));
            }
            else {
              arr.push(s);
            }
          }
        });
        return { value: arr };
      }
  }
}

export default exprstmt;