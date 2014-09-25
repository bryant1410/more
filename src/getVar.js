module homunculus from 'homunculus';

import share from './share';

var Token = homunculus.getClass('token');
var Node = homunculus.getClass('node', 'css');

export default function(token, varHash, globalVar) {
  var s = token.content();
  var type = token.type();
  //@media等关键字忽略之
  if(type == Token.HEAD) {
    return s;
  }
  if(s.indexOf('$') > -1 || s.indexOf('@') > -1) {
    for(var i = 0; i < s.length; i++) {
      if(s.charAt(i) == '\\') {
        i++;
        continue;
      }
      if(s.charAt(i) == '$' || s.charAt(i) == '@') {
        var c = s.charAt(i + 1);
        if(c == '{') {
          var j = s.indexOf('}', i + 3);
          if(j > -1) {
            c = s.slice(i + 2, j);
            var vara = varHash[c] || globalVar[c];
            if(vara !== void 0) {
              s = s.slice(0, i)
                + (type == Token.STRING && /^['"]/.test(s)
                  ? vara.replace(/^(['"])(.*)\1$/, '$2')
                  : vara)
                + s.slice(j + 1);
            }
            else if(typeof console != 'undefined' && !share('silence')) {
              console.warn(c + ' is undefined');
            }
          }
        }
        else if(/[\w-]/.test(c)) {
          c = /^[\w-]+/.exec(s.slice(i + 1))[0] || '$' + c;
          var vara = varHash[c] || globalVar[c];
          if(vara !== void 0) {
            s = s.slice(0, i)
              + (type == Token.STRING && /^['"]/.test(s)
                ? vara.replace(/^(['"])(.*)\1$/, '$2')
                : vara)
              + s.slice(i + c.length + 1);
          }
          else if(typeof console != 'undefined' && !share('silence')) {
            console.warn(c + ' is undefined');
          }
        }
      }
    }
  }
  return s.replace(/\n/g, '');
}