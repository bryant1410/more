var homunculus=function(){var _0=require('homunculus');return _0.hasOwnProperty("homunculus")?_0.homunculus:_0.hasOwnProperty("default")?_0["default"]:_0}();
var getVar=function(){var _1=require('./getVar');return _1.hasOwnProperty("getVar")?_1.getVar:_1.hasOwnProperty("default")?_1["default"]:_1}();
var exprstmt=function(){var _2=require('./exprstmt');return _2.hasOwnProperty("exprstmt")?_2.exprstmt:_2.hasOwnProperty("default")?_2["default"]:_2}();

var Token = homunculus.getClass('token', 'css');
var Node = homunculus.getClass('node', 'css');

exports["default"]=function(node, varHash, globalHash, file) {
  switch(node.name()) {
    case Node.ADDEXPR:
    case Node.MTPLEXPR:
      var temp = new Add(node, varHash, globalHash, file);
      return {
        value: temp.exec(),
        unit: temp.unit
      };
    case Node.PRMREXPR:
      var temp = new Prmr(node, varHash, globalHash, file);
      return {
        value: temp.exec(),
        unit: temp.unit
      };
  }
};


  function Add(node, varHash, globalHash, file) {
    this.node = node;
    this.varHash = varHash;
    this.globalHash = globalHash;
    this.file = file;
    this.res = '';
    this.unit = '';
  }
  Add.prototype.exec = function() {
    var self = this;
    var first = self.node.first();
    var firstUnit = first.next();
    var opt;
    if(firstUnit.token().type() == Token.UNITS) {
      opt = firstUnit.next();
      firstUnit = firstUnit.token().content();
    }
    else {
      opt = firstUnit;
      firstUnit = '';
    }
    switch(first.name()) {
      case Node.ADDEXPR:
      case Node.MTPLEXPR:
        var temp = new Add(first, self.varHash, self.globalHash, self.file);
        self.res = temp.exec();
        self.unit = firstUnit || temp.unit;
        break;
      case Node.PRMREXPR:
        var temp = new Prmr(first, self.varHash, self.globalHash, self.file);
        self.res = temp.exec();
        self.unit = firstUnit || temp.unit;
        break;
      default:
        if([Node.WIDTH, Node.HEIGHT].indexOf(first.name()) > -1) {
          self.res = exprstmt(first, self.varHash, self.globalHash, self.file);
        }
        else {
          var type = first.token().type();
          if(type == Token.VARS) {
            var k = first.token().content().replace(/^\$\{?/, '').replace(/}$/, '');
            var vara = self.varHash[k] || self.globalHash[k];
            if(vara !== void 0) {
              self.res = vara.value;
              self.unit = vara.unit;
            }
            else if(typeof console != 'undefined') {
              console.warn(k + ' is undefined');
            }
          }
          else if(type == Token.NUMBER) {
            first = first.token().content();
            self.res = first.indexOf('.') > -1 ? parseFloat(first) : parseInt(first);
          }
          else {
            self.res = first.token().content();
          }
          self.unit = self.unit || firstUnit;
        }
    }
    while(opt && opt.token().type() == Token.SIGN) {
      var optValue = opt.token().content();
      var second = opt.next();
      var secondUnit = second.next();
      if(secondUnit && secondUnit.token().type() == Token.UNITS) {
        opt = secondUnit.next();
        secondUnit = secondUnit.token().content();
      }
      else {
        secondUnit = '';
        opt = second.next();
      }
      switch(second.name()) {
        case Node.ADDEXPR:
        case Node.MTPLEXPR:
          var temp = new Add(second, self.varHash, self.globalHash, self.file);
          second = temp.exec();
          secondUnit = secondUnit || temp.unit;
          break;
        case Node.PRMREXPR:
          var temp = new Prmr(second, self.varHash, self.globalHash, self.file);
          second = temp.exec();
          secondUnit = secondUnit || temp.unit;
          break;
        default:
          if([Node.WIDTH, Node.HEIGHT].indexOf(second.name()) > -1) {
            second = exprstmt(second, self.varHash, self.globalHash, self.file);
          }
          else {
            var type = second.token().type();
            if(type == Token.VARS) {
              var k = second.token().content().replace(/^\$\{?/, '').replace(/}$/, '');
              var vara = self.varHash[k] || self.globalHash[k];
              if(vara !== void 0) {
                second = vara.value;
                secondUnit = vara.unit || secondUnit;
              }
              else if(typeof console != 'undefined') {
                console.warn(k + ' is undefined');
              }
            }
            else if(type == Token.NUMBER) {
              second = second.token().content();
              second = second.indexOf('.') > -1 ? parseFloat(second) : parseInt(second);
            }
            else {
              second = second.token().content();
            }
          }
      }
      //两个单位只有1个，或相等的情况下，无冲突，其中有一个为%无冲突，其余冲突取最后一个
      if(self.unit == secondUnit && secondUnit == '%') {
        switch(optValue) {
          case '+':
            self.res += second;
            break;
          case '-':
            self.res -= second;
            break;
          case '*':
            self.res *= second;
            self.res /= 100;
            break;
          case '/':
            self.res /= second;
            self.res /= 100;
            break;
        }
      }
      else if(self.unit != secondUnit) {
        if(self.unit == '%') {
          self.unit = secondUnit;
          switch(optValue) {
            case '+':
              self.res = self.res * second / 100 + second;
              break;
            case '-':
              self.res = self.res * second / 100 - second;
              break;
            case '*':
              self.res = self.res * second / 100;
              break;
            case '/':
              self.res /= second;
              break;
          }
        }
        else if(secondUnit == '%') {
          self.unit = self.unit;
          switch(optValue) {
            case '+':
              self.res += self.res * second / 100;
              break;
            case '-':
              self.res -= self.res * second / 100;
              break;
            case '*':
              self.res = self.res * second / 100;
              break;
            case '/':
              self.res = self.res * 100 / second;
              break;
          }
        }
        else {
          self.unit = secondUnit || self.unit;
          switch(optValue) {
            case '+':
              self.res += second;
              break;
            case '-':
              self.res -= second;
              break;
            case '*':
              self.res *= second;
              break;
            case '/':
              self.res /= second;
              break;
          }
        }
      }
      else {
        switch(optValue) {
          case '+':
            self.res += second;
            break;
          case '-':
            self.res -= second;
            break;
          case '*':
            self.res *= second;
            break;
          case '/':
            self.res /= second;
            break;
        }
      }
    }
    return self.res;
  }



  function Prmr(node, varHash, globalHash, file) {
    this.node = node;
    this.varHash = varHash;
    this.globalHash = globalHash;
    this.file = file;
    this.res = '';
    this.unit = '';
  }
  Prmr.prototype.exec = function() {
    var first = this.node.leaf(1);
    switch(first.name()) {
      case Node.ADDEXPR:
      case Node.MTPLEXPR:
        var temp = new Add(first, this.varHash, this.globalHash, this.file);
        this.res = temp.exec();
        this.unit = temp.unit;
        break;
      case Node.PRMREXPR:
        var temp = new Prmr(first, this.varHash, this.globalHash, this.file);
        this.res = temp.exec();
        this.unit = temp.unit;
      default:
        if([Node.WIDTH, Node.HEIGHT].indexOf(first.name()) > -1) {
          this.res = exprstmt(first, this.varHash, this.globalHash, this.file);
        }
        else {
          var unit = first.next().token();
          if(unit.type() == Token.UNITS) {
            this.unit = unit.content();
          }
          this.res = first.token().content();
        }
    }
    return this.res;
  }
