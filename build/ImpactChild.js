var KEY_HASH=function(){var _0=require('./abbreviationKey.js');return _0.hasOwnProperty("KEY_HASH")?_0.KEY_HASH:_0.hasOwnProperty("default")?_0["default"]:_0}();


  function ImpactChild() {
    this.imCache = {};
  }
  ImpactChild.prototype.noImpact = function(list, first, last, child) {
    for(var i = first; i <= last; i++) {
      if(list[i].s2s.indexOf(':-ms-') > -1) {
        return false;
      }
    }
    //紧邻选择器无优先级影响
    if(first == last - 1 && false) {
      return true;
    }
    //非紧邻先取可能缓存的判断结果
    else if(this.imCache.hasOwnProperty([first + ',' + last + ',' + child])) {
      return this.imCache[first + ',' + last + ',' + child];
    }
    //都是tag结尾则无冲突
    else if(this.allTag(list, first, last)) {
      return this.imCache[first + ',' + last + ',' + child] = true;
    }
    //非紧邻若无相同样式或important优先级不同无影响
    else {
      var style = list[last].styles[child];
      var hash = {
        important: style.important,
        value: style.value
      };
      var key = getKey(style);
      var abbreviation = {
        index: KEY_HASH[key],
        important: style.important
      };
      for(var i = first + 1; i < last; i++) {
        var item = list[i];
        if(this.isChildren(item, list[last])
          || this.isChildren(item, list[first])) {
          this.imCache[i + ',' + last + ',' + child] = true;
          continue;
        }
        var styles = item.styles;
        for(var j = 0, len = styles.length; j < len; j++) {
          var style = styles[j];
          var k = getKey(style);
          //值不等且优先级不等时冲突
          if(key == k
            && hash.value != style.value
            && hash.important == style.important) {
            this.imCache[i + ',' + last + ',' + child] = false;
            return false;
          }
          //有缩写且优先级不等也冲突
          else if(key != k && KEY_HASH.hasOwnProperty(k)) {
            if(abbreviation.index == KEY_HASH[k]
              && style.important == abbreviation.important) {
              this.imCache[i + ',' + last + ',' + child] = false;
              return false;
            }
          }
        }
        this.imCache[i + ',' + last + ',' + child] = true;
      }
    }
    this.imCache[first + ',' + last + ',' + child] = true;
    return true;
  }
  ImpactChild.prototype.isChildren = function(first, last) {
    //两个选择器完全互为对方的子选择器则返回true
    for(var i = 0, len = first.selectors.length; i < len; i++) {
      var selector1 = first.selectors[i];
      for(var j = 0, len2 = last.selectors.length; j < len2; j++) {
        var selector2 = last.selectors[j];
        if(selector1.indexOf(selector2) > -1 || selector2.indexOf(selector1) > -1) {
          continue;
        }
        return false;
      }
    }
    return true;
  }
  ImpactChild.prototype.allTag = function(list, first, last) {
    var hash = {};
    for(var i = 0, len = list[first].selectors.length; i < len; i++) {
      var s = list[first].selectors[i];
      //div全字母为tag
      if(/^[a-z]+$/i.test(s)) {
        hash[s] = true;
        continue;
      }
      // div前面空格类型
      if(/ [a-z]+$/i.test(s)) {
        hash[/ [a-z]+$/i.exec(s)[0].slice(1)] = true;
        continue;
      }
      //>div
      if(/>[a-z]+$/i.test(s)) {
        hash[/>[a-z]+$/i.exec(s)[0].slice(1)] = true;
        continue;
      }
      return false;
    }
    for(var i = 0, len = list[last].selectors.length; i < len; i++) {
      var s = list[last].selectors[i];
      if(/^[a-z]+$/i.test(s) && !hash[s]) {
        continue;
      }
      if(/ [a-z]+$/i.test(s) && !hash[/ [a-z]+$/i.exec(s)[0].slice(1)]) {
        continue;
      }
      if(/>[a-z]+$/i.test(s) && !hash[/>[a-z]+$/i.exec(s)[0].slice(1)]) {
        continue;
      }
      return false;
    }
  }


function getKey(style) {
  return style.key.slice(style.prefixHack.length).toLowerCase();
}

exports["default"]=ImpactChild;