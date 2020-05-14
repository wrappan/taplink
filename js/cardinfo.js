/*
 * card-info v1.2.4
 * Get bank logo, colors, brand and etc. by card number
 * https://github.com/iserdmi/card-info.git
 * by Sergey Dmitriev (http://srdm.io)
 */

;(function () {
  function CardInfo (numberSource, options) {
    CardInfo._assign(this, CardInfo._defaultProps)

    this.options = CardInfo._assign({}, CardInfo.defaultOptions, options || {})
    this.numberSource = arguments.length ? numberSource : ''
    this.number = CardInfo._getNumber(this.numberSource)

    var bankData = CardInfo._getBank(this.number)
    if (bankData) {
      this.bankAlias = bankData.alias
      this.bankName = bankData.name
      this.bankNameEn = bankData.nameEn
      this.bankCountry = bankData.country
      this.bankUrl = bankData.url
      this.bankLogoPng = CardInfo._getLogo(this.options.banksLogosPath, bankData.logoPng)
      this.bankLogoSvg = CardInfo._getLogo(this.options.banksLogosPath, bankData.logoSvg)
      this.bankLogo = CardInfo._getLogoByPreferredExt(this.bankLogoPng, this.bankLogoSvg, this.options.preferredExt)
      this.bankLogoStyle = bankData.logoStyle
      this.backgroundColor = bankData.backgroundColor
      this.backgroundColors = bankData.backgroundColors
      this.backgroundLightness = bankData.backgroundLightness
      this.textColor = bankData.text
    }

    this.backgroundGradient = CardInfo._getGradient(this.backgroundColors, this.options.gradientDegrees)

    var brandData = CardInfo._getBrand(this.number)
    if (brandData) {
      this.brandAlias = brandData.alias
      this.brandName = brandData.name
      var brandLogoBasename = CardInfo._getBrandLogoBasename(this.brandAlias, this.options.brandLogoPolicy, this.backgroundLightness, this.bankLogoStyle)
      this.brandLogoPng = CardInfo._getLogo(this.options.brandsLogosPath, brandLogoBasename, 'png')
      this.brandLogoSvg = CardInfo._getLogo(this.options.brandsLogosPath, brandLogoBasename, 'svg')
      this.brandLogo = CardInfo._getLogoByPreferredExt(this.brandLogoPng, this.brandLogoSvg, this.options.preferredExt)
      this.codeName = brandData.codeName
      this.codeLength = brandData.codeLength
      this.numberLengths = brandData.lengths
      this.numberGaps = brandData.gaps
    }

    this.numberBlocks = CardInfo._getBlocks(this.numberGaps, this.numberLengths)
    this.numberMask = CardInfo._getMask(this.options.maskDigitSymbol, this.options.maskDelimiterSymbol, this.numberBlocks)
    this.numberNice = CardInfo._getNumberNice(this.number, this.numberGaps)
  }

  CardInfo._defaultProps = {
    bankAlias: null,
    bankName: null,
    bankNameEn: null,
    bankCountry: null,
    bankUrl: null,
    bankLogo: null,
    bankLogoPng: null,
    bankLogoSvg: null,
    bankLogoStyle: null,
    backgroundColor: '#eeeeee',
    backgroundColors: ['#eeeeee', '#dddddd'],
    backgroundLightness: 'light',
    backgroundGradient: null,
    textColor: '#000',
    brandAlias: null,
    brandName: null,
    brandLogo: null,
    brandLogoPng: null,
    brandLogoSvg: null,
    codeName: null,
    codeLength: null,
    numberMask: null,
    numberGaps: [4, 8, 12],
    numberBlocks: null,
    numberLengths: [12, 13, 14, 15, 16, 17, 18, 19],
    numberNice: null,
    number: null,
    numberSource: null,
    options: {}
  }

  CardInfo.defaultOptions = {
    banksLogosPath: '/bower_components/card-info/dist/banks-logos/',
    brandsLogosPath: '/bower_components/card-info/dist/brands-logos/',
    brandLogoPolicy: 'auto',
    preferredExt: 'svg',
    maskDigitSymbol: '0',
    maskDelimiterSymbol: ' ',
    gradientDegrees: 135
  }

  CardInfo._banks = {}

  CardInfo._prefixes = {}

  CardInfo._brands = [
    {
      alias: 'visa',
      name: 'Visa',
      codeName: 'CVV',
      codeLength: 3,
      gaps: [4, 8, 12],
      lengths: [16],
      pattern: /^4\d*$/
    },
    {
      alias: 'master-card',
      name: 'MasterCard',
      codeName: 'CVC',
      codeLength: 3,
      gaps: [4, 8, 12],
      lengths: [16],
      pattern: /^(5[1-5]|222[1-9]|2[3-6]|27[0-1]|2720)\d*$/
    },
    {
      alias: 'american-express',
      name: 'American Express',
      codeName: 'CID',
      codeLength: 4,
      gaps: [4, 10],
      lengths: [15],
      pattern: /^3[47]\d*$/
    },
    {
      alias: 'diners-club',
      name: 'Diners Club',
      codeName: 'CVV',
      codeLength: 3,
      gaps: [4, 10],
      lengths: [14],
      pattern: /^3(0[0-5]|[689])\d*$/
    },
    {
      alias: 'discover',
      name: 'Discover',
      codeName: 'CID',
      codeLength: 3,
      gaps: [4, 8, 12],
      lengths: [16, 19],
      pattern: /^(6011|65|64[4-9])\d*$/
    },
    {
      alias: 'jcb',
      name: 'JCB',
      codeName: 'CVV',
      codeLength: 3,
      gaps: [4, 8, 12],
      lengths: [16],
      pattern: /^(2131|1800|35)\d*$/
    },
    {
      alias: 'unionpay',
      name: 'UnionPay',
      codeName: 'CVN',
      codeLength: 3,
      gaps: [4, 8, 12],
      lengths: [16, 17, 18, 19],
      pattern: /^62[0-5]\d*$/
    },
    {
      alias: 'maestro',
      name: 'Maestro',
      codeName: 'CVC',
      codeLength: 3,
      gaps: [4, 8, 12],
      lengths: [12, 13, 14, 15, 16, 17, 18, 19],
      pattern: /^(5[0678]|6304|6390|6054|6271|67)\d*$/
    },
    {
      alias: 'mir',
      name: 'MIR',
      codeName: 'CVC',
      codeLength: 3,
      gaps: [4, 8, 12],
      lengths: [16],
      pattern: /^22\d*$/
    }
  ]

  CardInfo._assign = function () {
    var objTarget = arguments[0]
    for (var i = 1; i < arguments.length; i++) {
      var objSource = arguments[i]
      for (var key in objSource) {
        if (objSource.hasOwnProperty(key)) {
          if (objSource[key] instanceof Array) {
            objTarget[key] = CardInfo._assign([], objSource[key])
          } else {
            objTarget[key] = objSource[key]
          }
        }
      }
    }
    return objTarget
  }

  CardInfo._getNumber = function (numberSource) {
    var numberSourceString = numberSource + ''
    return /^[\d ]*$/.test(numberSourceString) ? numberSourceString.replace(/\D/g, '') : ''
  }

  CardInfo._getBank = function (number) {
    if (number.length < 6) return undefined
    var prefix = number.substr(0, 6)
    return this._prefixes[prefix]
      ? this._banks[this._prefixes[prefix]]
      : undefined
  }

  CardInfo._getBrand = function (number) {
    var brands = []
    for (var i = 0; i < this._brands.length; i++) {
      if (this._brands[i].pattern.test(number)) brands.push(this._brands[i])
    }
    if (brands.length === 1) return brands[0]
  }

  CardInfo._getLogo = function (dirname, basename, extname) {
    return basename ? dirname + (extname ? basename + '.' + extname : basename) : null
  }

  CardInfo._getBrandLogoBasename = function (brandAlias, brandLogoPolicy, backgroundLightness, bankLogoStyle) {
    switch (brandLogoPolicy) {
      case 'auto': return brandAlias + '-' + (bankLogoStyle || 'colored')
      case 'colored': return brandAlias + '-colored'
      case 'mono': return brandAlias + (backgroundLightness === 'light' ? '-black' : '-white')
      case 'black': return brandAlias + '-black'
      case 'white': return brandAlias + '-white'
    }
  }

  CardInfo._getLogoByPreferredExt = function (logoPng, logoSvg, preferredExt) {
    if (!logoPng && !logoSvg) return null
    if (!logoPng) return logoSvg
    if (!logoSvg) return logoPng
    return (logoPng.substr(logoPng.length - 3) === preferredExt)
      ? logoPng
      : logoSvg
  }

  CardInfo._getGradient = function (backgroundColors, gradientDegrees) {
    return 'linear-gradient(' + gradientDegrees + 'deg, ' + backgroundColors.join(', ') + ')'
  }

  CardInfo._getBlocks = function (numberGaps, numberLengths) {
    var numberLength = numberLengths[numberLengths.length - 1]
    var blocks = []
    for (var i = numberGaps.length - 1; i >= 0; i--) {
      var blockLength = numberLength - numberGaps[i]
      numberLength -= blockLength
      blocks.push(blockLength)
    }
    blocks.push(numberLength)
    return blocks.reverse()
  }

  CardInfo._getMask = function (maskDigitSymbol, maskDelimiterSymbol, numberBlocks) {
    var mask = ''
    for (var i = 0; i < numberBlocks.length; i++) {
      mask += (i ? maskDelimiterSymbol : '') + Array(numberBlocks[i] + 1).join(maskDigitSymbol)
    }
    return mask
  }

  CardInfo._getNumberNice = function (number, numberGaps) {
    var offsets = [0].concat(numberGaps).concat([number.length])
    var components = []
    for (var i = 0; offsets[i] < number.length; i++) {
      var start = offsets[i]
      var end = Math.min(offsets[i + 1], number.length)
      components.push(number.substring(start, end))
    }
    return components.join(' ')
  }

  CardInfo._addBanks = function (banks) {
    this._assign(this._banks, banks)
  }

  CardInfo._addPrefixes = function (prefixes) {
    this._assign(this._prefixes, prefixes)
  }

  CardInfo.addBanksAndPrefixes = function (banksAndPrefixes) {
    this._addBanks(banksAndPrefixes.banks)
    this._addPrefixes(banksAndPrefixes.prefixes)
  }

  CardInfo.getBanks = function (options) {
    options = CardInfo._assign({}, CardInfo.defaultOptions, options || {})
    var banks = []
    var exts = ['png', 'svg']
    var extsCapitalized = ['Png', 'Svg']
    for (var bi in this._banks) {
      if (this._banks.hasOwnProperty(bi)) {
        var bank = CardInfo._assign({}, this._banks[bi])
        for (var ei = 0; ei < exts.length; ei++) {
          var logoKey = 'logo' + extsCapitalized[ei]
          if (bank[logoKey]) bank[logoKey] = CardInfo._getLogo(options.banksLogosPath, bank[logoKey])
        }
        bank.backgroundGradient = CardInfo._getGradient(bank.backgroundColors, options.gradientDegrees)
        bank.logo = CardInfo._getLogoByPreferredExt(bank.logoPng, bank.logoSvg, options.preferredExt)
        banks.push(bank)
      }
    }
    return banks
  }

  CardInfo.getBrands = function (options) {
    options = CardInfo._assign({}, CardInfo.defaultOptions, options || {})
    var brands = []
    var styles = ['colored', 'black', 'white']
    var exts = ['png', 'svg']
    var stylesCapitalized = ['Colored', 'Black', 'White']
    var extsCapitalized = ['Png', 'Svg']
    for (var bi = 0; bi < this._brands.length; bi++) {
      var brand = CardInfo._assign({}, this._brands[bi])
      brand.blocks = CardInfo._getBlocks(brand.gaps, brand.lengths)
      brand.mask = CardInfo._getMask(options.maskDigitSymbol, options.maskDelimiterSymbol, brand.blocks)
      for (var si = 0; si < styles.length; si++) {
        var logoKey = 'logo' + stylesCapitalized[si]
        for (var ei = 0; ei < exts.length; ei++) {
          brand[logoKey + extsCapitalized[ei]] = CardInfo._getLogo(options.brandsLogosPath, brand.alias + '-' + styles[si], exts[ei])
        }
        brand[logoKey] = CardInfo._getLogoByPreferredExt(brand[logoKey + 'Png'], brand[logoKey + 'Svg'], options.preferredExt)
      }
      brands.push(brand)
    }
    return brands
  }

  CardInfo.setDefaultOptions = function (options) {
    this._assign(CardInfo.defaultOptions, options)
  }

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = CardInfo
    }
    exports.CardInfo = CardInfo
  } else if (typeof window !== 'undefined') {
    window.CardInfo = CardInfo
  }
})();

/**
 * jquery.mask.js
 * @version: v1.14.13
 * @author: Igor Escobar
 *
 * Created by Igor Escobar on 2012-03-10. Please report any bug at github.com/igorescobar/jQuery-Mask-Plugin
 *
 * Copyright (c) 2012 Igor Escobar http://igorescobar.com
 *
 * The MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/* jshint laxbreak: true */
/* jshint maxcomplexity:17 */
/* global define */

// UMD (Universal Module Definition) patterns for JavaScript modules that work everywhere.
// https://github.com/umdjs/umd/blob/master/templates/jqueryPlugin.js
(function (factory, jQuery, Zepto) {

    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery || Zepto);
    }

}(function ($) {
    'use strict';

    var Mask = function (el, mask, options) {

        var p = {
            invalid: [],
            getCaret: function () {
                try {
                    var sel,
                        pos = 0,
                        ctrl = el.get(0),
                        dSel = document.selection,
                        cSelStart = ctrl.selectionStart;

                    // IE Support
                    if (dSel && navigator.appVersion.indexOf('MSIE 10') === -1) {
                        sel = dSel.createRange();
                        sel.moveStart('character', -p.val().length);
                        pos = sel.text.length;
                    }
                    // Firefox support
                    else if (cSelStart || cSelStart === '0') {
                        pos = cSelStart;
                    }

                    return pos;
                } catch (e) {}
            },
            setCaret: function(pos) {
                try {
                    if (el.is(':focus')) {
                        var range, ctrl = el.get(0);

                        // Firefox, WebKit, etc..
                        if (ctrl.setSelectionRange) {
                            ctrl.setSelectionRange(pos, pos);
                        } else { // IE
                            range = ctrl.createTextRange();
                            range.collapse(true);
                            range.moveEnd('character', pos);
                            range.moveStart('character', pos);
                            range.select();
                        }
                    }
                } catch (e) {}
            },
            events: function() {
                el
                .on('keydown.mask', function(e) {
                    el.data('mask-keycode', e.keyCode || e.which);
                    el.data('mask-previus-value', el.val());
                    el.data('mask-previus-caret-pos', p.getCaret());
                    p.maskDigitPosMapOld = p.maskDigitPosMap;
                })
                .on($.jMaskGlobals.useInput ? 'input.mask' : 'keyup.mask', p.behaviour)
                .on('paste.mask drop.mask', function() {
                    setTimeout(function() {
                        el.keydown().keyup();
                    }, 100);
                })
                .on('change.mask', function(){
                    el.data('changed', true);
                })
                .on('blur.mask', function(){
                    if (oldValue !== p.val() && !el.data('changed')) {
                        el.trigger('change');
                    }
                    el.data('changed', false);
                })
                // it's very important that this callback remains in this position
                // otherwhise oldValue it's going to work buggy
                .on('blur.mask', function() {
                    oldValue = p.val();
                })
                // select all text on focus
                .on('focus.mask', function (e) {
                    if (options.selectOnFocus === true) {
                        $(e.target).select();
                    }
                })
                // clear the value if it not complete the mask
                .on('focusout.mask', function() {
                    if (options.clearIfNotMatch && !regexMask.test(p.val())) {
                       p.val('');
                   }
                });
            },
            getRegexMask: function() {
                var maskChunks = [], translation, pattern, optional, recursive, oRecursive, r;

                for (var i = 0; i < mask.length; i++) {
                    translation = jMask.translation[mask.charAt(i)];

                    if (translation) {

                        pattern = translation.pattern.toString().replace(/.{1}$|^.{1}/g, '');
                        optional = translation.optional;
                        recursive = translation.recursive;

                        if (recursive) {
                            maskChunks.push(mask.charAt(i));
                            oRecursive = {digit: mask.charAt(i), pattern: pattern};
                        } else {
                            maskChunks.push(!optional && !recursive ? pattern : (pattern + '?'));
                        }

                    } else {
                        maskChunks.push(mask.charAt(i).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
                    }
                }

                r = maskChunks.join('');

                if (oRecursive) {
                    r = r.replace(new RegExp('(' + oRecursive.digit + '(.*' + oRecursive.digit + ')?)'), '($1)?')
                         .replace(new RegExp(oRecursive.digit, 'g'), oRecursive.pattern);
                }

                return new RegExp(r);
            },
            destroyEvents: function() {
                el.off(['input', 'keydown', 'keyup', 'paste', 'drop', 'blur', 'focusout', ''].join('.mask '));
            },
            val: function(v) {
                var isInput = el.is('input'),
                    method = isInput ? 'val' : 'text',
                    r;

                if (arguments.length > 0) {
                    if (el[method]() !== v) {
                        el[method](v);
                    }
                    r = el;
                } else {
                    r = el[method]();
                }

                return r;
            },
            calculateCaretPosition: function() {
                var oldVal = el.data('mask-previus-value') || '',
                    newVal = p.getMasked(),
                    caretPosNew = p.getCaret();
                if (oldVal !== newVal) {
                    var caretPosOld = el.data('mask-previus-caret-pos') || 0,
                        newValL = newVal.length,
                        oldValL = oldVal.length,
                        maskDigitsBeforeCaret = 0,
                        maskDigitsAfterCaret = 0,
                        maskDigitsBeforeCaretAll = 0,
                        maskDigitsBeforeCaretAllOld = 0,
                        i = 0;

                    for (i = caretPosNew; i < newValL; i++) {
                        if (!p.maskDigitPosMap[i]) {
                            break;
                        }
                        maskDigitsAfterCaret++;
                    }

                    for (i = caretPosNew - 1; i >= 0; i--) {
                        if (!p.maskDigitPosMap[i]) {
                            break;
                        }
                        maskDigitsBeforeCaret++;
                    }

                    for (i = caretPosNew - 1; i >= 0; i--) {
                        if (p.maskDigitPosMap[i]) {
                            maskDigitsBeforeCaretAll++;
                        }
                    }

                    for (i = caretPosOld - 1; i >= 0; i--) {
                        if (p.maskDigitPosMapOld[i]) {
                            maskDigitsBeforeCaretAllOld++;
                        }
                    }

                    // if the cursor is at the end keep it there
                    if (caretPosNew > oldValL) {
                      caretPosNew = newValL * 10;
                    } else if (caretPosOld >= caretPosNew && caretPosOld !== oldValL) {
                        if (!p.maskDigitPosMapOld[caretPosNew])  {
                          var caretPos = caretPosNew;
                          caretPosNew -= maskDigitsBeforeCaretAllOld - maskDigitsBeforeCaretAll;
                          caretPosNew -= maskDigitsBeforeCaret;
                          if (p.maskDigitPosMap[caretPosNew])  {
                            caretPosNew = caretPos;
                          }
                        }
                    }
                    else if (caretPosNew > caretPosOld) {
                        caretPosNew += maskDigitsBeforeCaretAll - maskDigitsBeforeCaretAllOld;
                        caretPosNew += maskDigitsAfterCaret;
                    }
                }
                return caretPosNew;
            },
            behaviour: function(e) {
                e = e || window.event;
                p.invalid = [];

                var keyCode = el.data('mask-keycode');

                if ($.inArray(keyCode, jMask.byPassKeys) === -1) {
                    var newVal   = p.getMasked(),
                        caretPos = p.getCaret();

                    // this is a compensation to devices/browsers that don't compensate
                    // caret positioning the right way
                    setTimeout(function() {
                      p.setCaret(p.calculateCaretPosition());
                    }, 10);

                    p.val(newVal);
                    p.setCaret(caretPos);
                    return p.callbacks(e);
                }
            },
            getMasked: function(skipMaskChars, val) {
                var buf = [],
                    value = val === undefined ? p.val() : val + '',
                    m = 0, maskLen = mask.length,
                    v = 0, valLen = value.length,
                    offset = 1, addMethod = 'push',
                    resetPos = -1,
                    maskDigitCount = 0,
                    maskDigitPosArr = [],
                    lastMaskChar,
                    check;

                if (options.reverse) {
                    addMethod = 'unshift';
                    offset = -1;
                    lastMaskChar = 0;
                    m = maskLen - 1;
                    v = valLen - 1;
                    check = function () {
                        return m > -1 && v > -1;
                    };
                } else {
                    lastMaskChar = maskLen - 1;
                    check = function () {
                        return m < maskLen && v < valLen;
                    };
                }

                var lastUntranslatedMaskChar;
                while (check()) {
                    var maskDigit = mask.charAt(m),
                        valDigit = value.charAt(v),
                        translation = jMask.translation[maskDigit];

                    if (translation) {
                        if (valDigit.match(translation.pattern)) {
                            buf[addMethod](valDigit);
                             if (translation.recursive) {
                                if (resetPos === -1) {
                                    resetPos = m;
                                } else if (m === lastMaskChar && m !== resetPos) {
                                    m = resetPos - offset;
                                }

                                if (lastMaskChar === resetPos) {
                                    m -= offset;
                                }
                            }
                            m += offset;
                        } else if (valDigit === lastUntranslatedMaskChar) {
                            // matched the last untranslated (raw) mask character that we encountered
                            // likely an insert offset the mask character from the last entry; fall
                            // through and only increment v
                            maskDigitCount--;
                            lastUntranslatedMaskChar = undefined;
                        } else if (translation.optional) {
                            m += offset;
                            v -= offset;
                        } else if (translation.fallback) {
                            buf[addMethod](translation.fallback);
                            m += offset;
                            v -= offset;
                        } else {
                          p.invalid.push({p: v, v: valDigit, e: translation.pattern});
                        }
                        v += offset;
                    } else {
                        if (!skipMaskChars) {
                            buf[addMethod](maskDigit);
                        }

                        if (valDigit === maskDigit) {
                            maskDigitPosArr.push(v);
                            v += offset;
                        } else {
                            lastUntranslatedMaskChar = maskDigit;
                            maskDigitPosArr.push(v + maskDigitCount);
                            maskDigitCount++;
                        }

                        m += offset;
                    }
                }

                var lastMaskCharDigit = mask.charAt(lastMaskChar);
                if (maskLen === valLen + 1 && !jMask.translation[lastMaskCharDigit]) {
                    buf.push(lastMaskCharDigit);
                }

                var newVal = buf.join('');
                p.mapMaskdigitPositions(newVal, maskDigitPosArr, valLen);
                return newVal;
            },
            mapMaskdigitPositions: function(newVal, maskDigitPosArr, valLen) {
              var maskDiff = options.reverse ? newVal.length - valLen : 0;
              p.maskDigitPosMap = {};
              for (var i = 0; i < maskDigitPosArr.length; i++) {
                p.maskDigitPosMap[maskDigitPosArr[i] + maskDiff] = 1;
              }
            },
            callbacks: function (e) {
                var val = p.val(),
                    changed = val !== oldValue,
                    defaultArgs = [val, e, el, options],
                    callback = function(name, criteria, args) {
                        if (typeof options[name] === 'function' && criteria) {
                            options[name].apply(this, args);
                        }
                    };

                callback('onChange', changed === true, defaultArgs);
                callback('onKeyPress', changed === true, defaultArgs);
                callback('onComplete', val.length === mask.length, defaultArgs);
                callback('onInvalid', p.invalid.length > 0, [val, e, el, p.invalid, options]);
            }
        };

        el = $(el);
        var jMask = this, oldValue = p.val(), regexMask;

        mask = typeof mask === 'function' ? mask(p.val(), undefined, el,  options) : mask;

        // public methods
        jMask.mask = mask;
        jMask.options = options;
        jMask.remove = function() {
            var caret = p.getCaret();
            p.destroyEvents();
            p.val(jMask.getCleanVal());
            p.setCaret(caret);
            return el;
        };

        // get value without mask
        jMask.getCleanVal = function() {
           return p.getMasked(true);
        };

        // get masked value without the value being in the input or element
        jMask.getMaskedVal = function(val) {
           return p.getMasked(false, val);
        };

       jMask.init = function(onlyMask) {
            onlyMask = onlyMask || false;
            options = options || {};

            jMask.clearIfNotMatch  = $.jMaskGlobals.clearIfNotMatch;
            jMask.byPassKeys       = $.jMaskGlobals.byPassKeys;
            jMask.translation      = $.extend({}, $.jMaskGlobals.translation, options.translation);

            jMask = $.extend(true, {}, jMask, options);

            regexMask = p.getRegexMask();

            if (onlyMask) {
                p.events();
                p.val(p.getMasked());
            } else {
                if (options.placeholder) {
                    el.attr('placeholder' , options.placeholder);
                }

                // this is necessary, otherwise if the user submit the form
                // and then press the "back" button, the autocomplete will erase
                // the data. Works fine on IE9+, FF, Opera, Safari.
                if (el.data('mask')) {
                  el.attr('autocomplete', 'off');
                }

                // detect if is necessary let the user type freely.
                // for is a lot faster than forEach.
                for (var i = 0, maxlength = true; i < mask.length; i++) {
                    var translation = jMask.translation[mask.charAt(i)];
                    if (translation && translation.recursive) {
                        maxlength = false;
                        break;
                    }
                }

                if (maxlength) {
                    el.attr('maxlength', mask.length);
                }

                p.destroyEvents();
                p.events();

                var caret = p.getCaret();
                p.val(p.getMasked());
                p.setCaret(caret);
            }
        };

        jMask.init(!el.is('input'));
    };

    $.maskWatchers = {};
    var HTMLAttributes = function () {
        var input = $(this),
            options = {},
            prefix = 'data-mask-',
            mask = input.attr('data-mask');

        if (input.attr(prefix + 'reverse')) {
            options.reverse = true;
        }

        if (input.attr(prefix + 'clearifnotmatch')) {
            options.clearIfNotMatch = true;
        }

        if (input.attr(prefix + 'selectonfocus') === 'true') {
           options.selectOnFocus = true;
        }

        if (notSameMaskObject(input, mask, options)) {
            return input.data('mask', new Mask(this, mask, options));
        }
    },
    notSameMaskObject = function(field, mask, options) {
        options = options || {};
        var maskObject = $(field).data('mask'),
            stringify = JSON.stringify,
            value = $(field).val() || $(field).text();
        try {
            if (typeof mask === 'function') {
                mask = mask(value);
            }
            return typeof maskObject !== 'object' || stringify(maskObject.options) !== stringify(options) || maskObject.mask !== mask;
        } catch (e) {}
    },
    eventSupported = function(eventName) {
        var el = document.createElement('div'), isSupported;

        eventName = 'on' + eventName;
        isSupported = (eventName in el);

        if ( !isSupported ) {
            el.setAttribute(eventName, 'return;');
            isSupported = typeof el[eventName] === 'function';
        }
        el = null;

        return isSupported;
    };

    $.fn.mask = function(mask, options) {
        options = options || {};
        var selector = this.selector,
            globals = $.jMaskGlobals,
            interval = globals.watchInterval,
            watchInputs = options.watchInputs || globals.watchInputs,
            maskFunction = function() {
                if (notSameMaskObject(this, mask, options)) {
                    return $(this).data('mask', new Mask(this, mask, options));
                }
            };

        $(this).each(maskFunction);

        if (selector && selector !== '' && watchInputs) {
            clearInterval($.maskWatchers[selector]);
            $.maskWatchers[selector] = setInterval(function(){
                $(document).find(selector).each(maskFunction);
            }, interval);
        }
        return this;
    };

    $.fn.masked = function(val) {
        return this.data('mask').getMaskedVal(val);
    };

    $.fn.unmask = function() {
        clearInterval($.maskWatchers[this.selector]);
        delete $.maskWatchers[this.selector];
        return this.each(function() {
            var dataMask = $(this).data('mask');
            if (dataMask) {
                dataMask.remove().removeData('mask');
            }
        });
    };

    $.fn.cleanVal = function() {
        return this.data('mask').getCleanVal();
    };

    $.applyDataMask = function(selector) {
        selector = selector || $.jMaskGlobals.maskElements;
        var $selector = (selector instanceof $) ? selector : $(selector);
        $selector.filter($.jMaskGlobals.dataMaskAttr).each(HTMLAttributes);
    };

    var globals = {
        maskElements: 'input,td,span,div',
        dataMaskAttr: '*[data-mask]',
        dataMask: true,
        watchInterval: 300,
        watchInputs: true,
        // old versions of chrome dont work great with input event
        useInput: !/Chrome\/[2-4][0-9]|SamsungBrowser/.test(window.navigator.userAgent) && eventSupported('input'),
        watchDataMask: false,
        byPassKeys: [9, 16, 17, 18, 36, 37, 38, 39, 40, 91],
        translation: {
            '0': {pattern: /\d/},
            '9': {pattern: /\d/, optional: true},
            '#': {pattern: /\d/, recursive: true},
            'A': {pattern: /[a-zA-Z0-9]/},
            'S': {pattern: /[a-zA-Z]/}
        }
    };

    $.jMaskGlobals = $.jMaskGlobals || {};
    globals = $.jMaskGlobals = $.extend(true, {}, globals, $.jMaskGlobals);

    // looking for inputs with data-mask attribute
    if (globals.dataMask) {
        $.applyDataMask();
    }

    setInterval(function() {
        if ($.jMaskGlobals.watchDataMask) {
            $.applyDataMask();
        }
    }, globals.watchInterval);
}, window.jQuery, window.Zepto));

/*
 * card-info v1.2.4
 * Get bank logo, colors, brand and etc. by card number
 * https://github.com/iserdmi/card-info.git
 * by Sergey Dmitriev (http://srdm.io)
 */

;(function () {
  function CardInfo (numberSource, options) {
    CardInfo._assign(this, CardInfo._defaultProps)

    this.options = CardInfo._assign({}, CardInfo.defaultOptions, options || {})
    this.numberSource = arguments.length ? numberSource : ''
    this.number = CardInfo._getNumber(this.numberSource)

    var bankData = CardInfo._getBank(this.number)
    if (bankData) {
      this.bankAlias = bankData.alias
      this.bankName = bankData.name
      this.bankNameEn = bankData.nameEn
      this.bankCountry = bankData.country
      this.bankUrl = bankData.url
      this.bankLogoPng = CardInfo._getLogo(this.options.banksLogosPath, bankData.logoPng)
      this.bankLogoSvg = CardInfo._getLogo(this.options.banksLogosPath, bankData.logoSvg)
      this.bankLogo = CardInfo._getLogoByPreferredExt(this.bankLogoPng, this.bankLogoSvg, this.options.preferredExt)
      this.bankLogoStyle = bankData.logoStyle
      this.backgroundColor = bankData.backgroundColor
      this.backgroundColors = bankData.backgroundColors
      this.backgroundLightness = bankData.backgroundLightness
      this.textColor = bankData.text
    }

    this.backgroundGradient = CardInfo._getGradient(this.backgroundColors, this.options.gradientDegrees)

    var brandData = CardInfo._getBrand(this.number)
    if (brandData) {
      this.brandAlias = brandData.alias
      this.brandName = brandData.name
      var brandLogoBasename = CardInfo._getBrandLogoBasename(this.brandAlias, this.options.brandLogoPolicy, this.backgroundLightness, this.bankLogoStyle)
      this.brandLogoPng = CardInfo._getLogo(this.options.brandsLogosPath, brandLogoBasename, 'png')
      this.brandLogoSvg = CardInfo._getLogo(this.options.brandsLogosPath, brandLogoBasename, 'svg')
      this.brandLogo = CardInfo._getLogoByPreferredExt(this.brandLogoPng, this.brandLogoSvg, this.options.preferredExt)
      this.codeName = brandData.codeName
      this.codeLength = brandData.codeLength
      this.numberLengths = brandData.lengths
      this.numberGaps = brandData.gaps
    }

    this.numberBlocks = CardInfo._getBlocks(this.numberGaps, this.numberLengths)
    this.numberMask = CardInfo._getMask(this.options.maskDigitSymbol, this.options.maskDelimiterSymbol, this.numberBlocks)
    this.numberNice = CardInfo._getNumberNice(this.number, this.numberGaps)
  }

  CardInfo._defaultProps = {
    bankAlias: null,
    bankName: null,
    bankNameEn: null,
    bankCountry: null,
    bankUrl: null,
    bankLogo: null,
    bankLogoPng: null,
    bankLogoSvg: null,
    bankLogoStyle: null,
    backgroundColor: '#eeeeee',
    backgroundColors: ['#eeeeee', '#dddddd'],
    backgroundLightness: 'light',
    backgroundGradient: null,
    textColor: '#000',
    brandAlias: null,
    brandName: null,
    brandLogo: null,
    brandLogoPng: null,
    brandLogoSvg: null,
    codeName: null,
    codeLength: null,
    numberMask: null,
    numberGaps: [4, 8, 12],
    numberBlocks: null,
    numberLengths: [12, 13, 14, 15, 16, 17, 18, 19],
    numberNice: null,
    number: null,
    numberSource: null,
    options: {}
  }

  CardInfo.defaultOptions = {
    banksLogosPath: '/bower_components/card-info/dist/banks-logos/',
    brandsLogosPath: '/bower_components/card-info/dist/brands-logos/',
    brandLogoPolicy: 'auto',
    preferredExt: 'svg',
    maskDigitSymbol: '0',
    maskDelimiterSymbol: ' ',
    gradientDegrees: 135
  }

  CardInfo._banks = {}

  CardInfo._prefixes = {}

  CardInfo._brands = [
    {
      alias: 'visa',
      name: 'Visa',
      codeName: 'CVV',
      codeLength: 3,
      gaps: [4, 8, 12],
      lengths: [16],
      pattern: /^4\d*$/
    },
    {
      alias: 'master-card',
      name: 'MasterCard',
      codeName: 'CVC',
      codeLength: 3,
      gaps: [4, 8, 12],
      lengths: [16],
      pattern: /^(5[1-5]|222[1-9]|2[3-6]|27[0-1]|2720)\d*$/
    },
    {
      alias: 'american-express',
      name: 'American Express',
      codeName: 'CID',
      codeLength: 4,
      gaps: [4, 10],
      lengths: [15],
      pattern: /^3[47]\d*$/
    },
    {
      alias: 'diners-club',
      name: 'Diners Club',
      codeName: 'CVV',
      codeLength: 3,
      gaps: [4, 10],
      lengths: [14],
      pattern: /^3(0[0-5]|[689])\d*$/
    },
    {
      alias: 'discover',
      name: 'Discover',
      codeName: 'CID',
      codeLength: 3,
      gaps: [4, 8, 12],
      lengths: [16, 19],
      pattern: /^(6011|65|64[4-9])\d*$/
    },
    {
      alias: 'jcb',
      name: 'JCB',
      codeName: 'CVV',
      codeLength: 3,
      gaps: [4, 8, 12],
      lengths: [16],
      pattern: /^(2131|1800|35)\d*$/
    },
    {
      alias: 'unionpay',
      name: 'UnionPay',
      codeName: 'CVN',
      codeLength: 3,
      gaps: [4, 8, 12],
      lengths: [16, 17, 18, 19],
      pattern: /^62[0-5]\d*$/
    },
    {
      alias: 'maestro',
      name: 'Maestro',
      codeName: 'CVC',
      codeLength: 3,
      gaps: [4, 8, 12],
      lengths: [12, 13, 14, 15, 16, 17, 18, 19],
      pattern: /^(5[0678]|6304|6390|6054|6271|67)\d*$/
    },
    {
      alias: 'mir',
      name: 'MIR',
      codeName: 'CVC',
      codeLength: 3,
      gaps: [4, 8, 12],
      lengths: [16],
      pattern: /^22\d*$/
    }
  ]

  CardInfo._assign = function () {
    var objTarget = arguments[0]
    for (var i = 1; i < arguments.length; i++) {
      var objSource = arguments[i]
      for (var key in objSource) {
        if (objSource.hasOwnProperty(key)) {
          if (objSource[key] instanceof Array) {
            objTarget[key] = CardInfo._assign([], objSource[key])
          } else {
            objTarget[key] = objSource[key]
          }
        }
      }
    }
    return objTarget
  }

  CardInfo._getNumber = function (numberSource) {
    var numberSourceString = numberSource + ''
    return /^[\d ]*$/.test(numberSourceString) ? numberSourceString.replace(/\D/g, '') : ''
  }

  CardInfo._getBank = function (number) {
    if (number.length < 6) return undefined
    var prefix = number.substr(0, 6)
    return this._prefixes[prefix]
      ? this._banks[this._prefixes[prefix]]
      : undefined
  }

  CardInfo._getBrand = function (number) {
    var brands = []
    for (var i = 0; i < this._brands.length; i++) {
      if (this._brands[i].pattern.test(number)) brands.push(this._brands[i])
    }
    if (brands.length === 1) return brands[0]
  }

  CardInfo._getLogo = function (dirname, basename, extname) {
    return basename ? dirname + (extname ? basename + '.' + extname : basename) : null
  }

  CardInfo._getBrandLogoBasename = function (brandAlias, brandLogoPolicy, backgroundLightness, bankLogoStyle) {
    switch (brandLogoPolicy) {
      case 'auto': return brandAlias + '-' + (bankLogoStyle || 'colored')
      case 'colored': return brandAlias + '-colored'
      case 'mono': return brandAlias + (backgroundLightness === 'light' ? '-black' : '-white')
      case 'black': return brandAlias + '-black'
      case 'white': return brandAlias + '-white'
    }
  }

  CardInfo._getLogoByPreferredExt = function (logoPng, logoSvg, preferredExt) {
    if (!logoPng && !logoSvg) return null
    if (!logoPng) return logoSvg
    if (!logoSvg) return logoPng
    return (logoPng.substr(logoPng.length - 3) === preferredExt)
      ? logoPng
      : logoSvg
  }

  CardInfo._getGradient = function (backgroundColors, gradientDegrees) {
    return 'linear-gradient(' + gradientDegrees + 'deg, ' + backgroundColors.join(', ') + ')'
  }

  CardInfo._getBlocks = function (numberGaps, numberLengths) {
    var numberLength = numberLengths[numberLengths.length - 1]
    var blocks = []
    for (var i = numberGaps.length - 1; i >= 0; i--) {
      var blockLength = numberLength - numberGaps[i]
      numberLength -= blockLength
      blocks.push(blockLength)
    }
    blocks.push(numberLength)
    return blocks.reverse()
  }

  CardInfo._getMask = function (maskDigitSymbol, maskDelimiterSymbol, numberBlocks) {
    var mask = ''
    for (var i = 0; i < numberBlocks.length; i++) {
      mask += (i ? maskDelimiterSymbol : '') + Array(numberBlocks[i] + 1).join(maskDigitSymbol)
    }
    return mask
  }

  CardInfo._getNumberNice = function (number, numberGaps) {
    var offsets = [0].concat(numberGaps).concat([number.length])
    var components = []
    for (var i = 0; offsets[i] < number.length; i++) {
      var start = offsets[i]
      var end = Math.min(offsets[i + 1], number.length)
      components.push(number.substring(start, end))
    }
    return components.join(' ')
  }

  CardInfo._addBanks = function (banks) {
    this._assign(this._banks, banks)
  }

  CardInfo._addPrefixes = function (prefixes) {
    this._assign(this._prefixes, prefixes)
  }

  CardInfo.addBanksAndPrefixes = function (banksAndPrefixes) {
    this._addBanks(banksAndPrefixes.banks)
    this._addPrefixes(banksAndPrefixes.prefixes)
  }

  CardInfo.getBanks = function (options) {
    options = CardInfo._assign({}, CardInfo.defaultOptions, options || {})
    var banks = []
    var exts = ['png', 'svg']
    var extsCapitalized = ['Png', 'Svg']
    for (var bi in this._banks) {
      if (this._banks.hasOwnProperty(bi)) {
        var bank = CardInfo._assign({}, this._banks[bi])
        for (var ei = 0; ei < exts.length; ei++) {
          var logoKey = 'logo' + extsCapitalized[ei]
          if (bank[logoKey]) bank[logoKey] = CardInfo._getLogo(options.banksLogosPath, bank[logoKey])
        }
        bank.backgroundGradient = CardInfo._getGradient(bank.backgroundColors, options.gradientDegrees)
        bank.logo = CardInfo._getLogoByPreferredExt(bank.logoPng, bank.logoSvg, options.preferredExt)
        banks.push(bank)
      }
    }
    return banks
  }

  CardInfo.getBrands = function (options) {
    options = CardInfo._assign({}, CardInfo.defaultOptions, options || {})
    var brands = []
    var styles = ['colored', 'black', 'white']
    var exts = ['png', 'svg']
    var stylesCapitalized = ['Colored', 'Black', 'White']
    var extsCapitalized = ['Png', 'Svg']
    for (var bi = 0; bi < this._brands.length; bi++) {
      var brand = CardInfo._assign({}, this._brands[bi])
      brand.blocks = CardInfo._getBlocks(brand.gaps, brand.lengths)
      brand.mask = CardInfo._getMask(options.maskDigitSymbol, options.maskDelimiterSymbol, brand.blocks)
      for (var si = 0; si < styles.length; si++) {
        var logoKey = 'logo' + stylesCapitalized[si]
        for (var ei = 0; ei < exts.length; ei++) {
          brand[logoKey + extsCapitalized[ei]] = CardInfo._getLogo(options.brandsLogosPath, brand.alias + '-' + styles[si], exts[ei])
        }
        brand[logoKey] = CardInfo._getLogoByPreferredExt(brand[logoKey + 'Png'], brand[logoKey + 'Svg'], options.preferredExt)
      }
      brands.push(brand)
    }
    return brands
  }

  CardInfo.setDefaultOptions = function (options) {
    this._assign(CardInfo.defaultOptions, options)
  }

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = CardInfo
    }
    exports.CardInfo = CardInfo
  } else if (typeof window !== 'undefined') {
    window.CardInfo = CardInfo
  }
})()

;(function () {
  var banks = {
    "ru-absolut": {
      "name": "Абсолют Банк",
      "nameEn": "Absolut Bank",
      "url": "http://absolutbank.ru/",
      "backgroundColor": "#fdb89a",
      "backgroundColors": [
        "#fbd6c5",
        "#fdb89a"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#676766",
      "alias": "ru-absolut",
      "country": "ru",
      "logoPng": "ru-absolut.png"
    },
    "ru-akbars": {
      "name": "Ак Барс",
      "nameEn": "AK Bars",
      "url": "https://www.akbars.ru/",
      "backgroundColor": "#01973e",
      "backgroundColors": [
        "#01973e",
        "#04632b"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-akbars",
      "country": "ru",
      "logoPng": "ru-akbars.png"
    },
    "ru-alfa": {
      "name": "Альфа-Банк",
      "nameEn": "Alfa-Bank",
      "url": "https://alfabank.ru/",
      "backgroundColor": "#ef3124",
      "backgroundColors": [
        "#ef3124",
        "#d6180b"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-alfa",
      "country": "ru",
      "logoPng": "ru-alfa.png",
      "logoSvg": "ru-alfa.svg"
    },
    "ru-atb": {
      "name": "Азиатско-Тихоокеанский Банк",
      "nameEn": "Азиатско-Тихоокеанский Банк",
      "url": "https://www.atb.su/",
      "backgroundColor": "#eeeeee",
      "backgroundColors": [
        "#eeeeee",
        "#dea184"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#373a36",
      "alias": "ru-atb",
      "country": "ru",
      "logoPng": "ru-atb.png",
      "logoSvg": "ru-atb.svg"
    },
    "ru-avangard": {
      "name": "Авангард",
      "nameEn": "Avangard",
      "url": "https://www.avangard.ru/",
      "backgroundColor": "#095b34",
      "backgroundColors": [
        "#0f8e52",
        "#095b34"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-avangard",
      "country": "ru",
      "logoPng": "ru-avangard.png"
    },
    "ru-binbank": {
      "name": "Бинбанк",
      "nameEn": "B&N Bank Public",
      "url": "https://www.binbank.ru/",
      "backgroundColor": "#cdeafd",
      "backgroundColors": [
        "#cdeafd",
        "#9cc0d9"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#004c81",
      "alias": "ru-binbank",
      "country": "ru",
      "logoPng": "ru-binbank.png",
      "logoSvg": "ru-binbank.svg"
    },
    "ru-ceb": {
      "name": "Кредит Европа Банк",
      "nameEn": "Credit Europe Bank",
      "url": "https://www.crediteurope.ru/",
      "backgroundColor": "#e0eaf7",
      "backgroundColors": [
        "#e0eaf7",
        "#f7dfdf"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#1c297b",
      "alias": "ru-ceb",
      "country": "ru",
      "logoPng": "ru-ceb.png",
      "logoSvg": "ru-ceb.svg"
    },
    "ru-cetelem": {
      "name": "Сетелем Банк",
      "nameEn": "Cetelem Bank",
      "url": "https://www.cetelem.ru/",
      "backgroundColor": "#ceecb7",
      "backgroundColors": [
        "#ceecb7",
        "#8bbb75"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#167158",
      "alias": "ru-cetelem",
      "country": "ru",
      "logoPng": "ru-cetelem.png",
      "logoSvg": "ru-cetelem.svg"
    },
    "ru-citi": {
      "name": "Ситибанк",
      "nameEn": "Citibank",
      "url": "https://www.citibank.ru/",
      "backgroundColor": "#008bd0",
      "backgroundColors": [
        "#00bcf2",
        "#004e90"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-citi",
      "country": "ru",
      "logoPng": "ru-citi.png",
      "logoSvg": "ru-citi.svg"
    },
    "ru-globex": {
      "name": "Глобэкс",
      "nameEn": "Globexbank",
      "url": "http://www.globexbank.ru/",
      "backgroundColor": "#9bdaff",
      "backgroundColors": [
        "#9bdaff",
        "#ffd2a2"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#072761",
      "alias": "ru-globex",
      "country": "ru",
      "logoPng": "ru-globex.png"
    },
    "ru-gpb": {
      "name": "Газпромбанк",
      "nameEn": "Gazprombank",
      "url": "http://www.gazprombank.ru/",
      "backgroundColor": "#02356c",
      "backgroundColors": [
        "#044b98",
        "#02356c"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-gpb",
      "country": "ru",
      "logoPng": "ru-gpb.png",
      "logoSvg": "ru-gpb.svg"
    },
    "ru-hcf": {
      "name": "Хоум Кредит Банк",
      "nameEn": "HCF Bank",
      "url": "http://homecredit.ru/",
      "backgroundColor": "#e41701",
      "backgroundColors": [
        "#e41701",
        "#bd1908"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-hcf",
      "country": "ru",
      "logoPng": "ru-hcf.png",
      "logoSvg": "ru-hcf.svg"
    },
    "ru-jugra": {
      "name": "Югра",
      "nameEn": "Jugra",
      "url": "http://www.jugra.ru/",
      "backgroundColor": "#d6ffe6",
      "backgroundColors": [
        "#d6ffe6",
        "#fff1e4"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#088237",
      "alias": "ru-jugra",
      "country": "ru",
      "logoPng": "ru-jugra.png"
    },
    "ru-mib": {
      "name": "Московский Индустриальный Банк",
      "nameEn": "Mosсow Industrial Bank",
      "url": "http://www.minbank.ru/",
      "backgroundColor": "#8f0e0f",
      "backgroundColors": [
        "#ce4647",
        "#8f0e0f"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-mib",
      "country": "ru",
      "logoPng": "ru-mib.png"
    },
    "ru-mkb": {
      "name": "Московский Кредитный Банк",
      "nameEn": "Credit Bank of Moscow",
      "url": "https://mkb.ru/",
      "backgroundColor": "#eeeeee",
      "backgroundColors": [
        "#eeeeee",
        "#f9dee8"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#ae0039",
      "alias": "ru-mkb",
      "country": "ru",
      "logoPng": "ru-mkb.png"
    },
    "ru-mob": {
      "name": "Московский Областной Банк",
      "nameEn": "Mosoblbank",
      "url": "http://www.mosoblbank.ru/",
      "backgroundColor": "#dd3c3d",
      "backgroundColors": [
        "#e14041",
        "#8e2222"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-mob",
      "country": "ru",
      "logoPng": "ru-mob.png"
    },
    "ru-mts": {
      "name": "МТС Банк",
      "nameEn": "MTS Bank",
      "url": "http://www.mtsbank.ru/",
      "backgroundColor": "#de1612",
      "backgroundColors": [
        "#ff0000",
        "#ba0e0a"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-mts",
      "country": "ru",
      "logoPng": "ru-mts.png",
      "logoSvg": "ru-mts.svg"
    },
    "ru-novikom": {
      "name": "Новикомбанк",
      "nameEn": "Novikombank",
      "url": "http://www.novikom.ru/",
      "backgroundColor": "#00529b",
      "backgroundColors": [
        "#00529b",
        "#0a4477"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-novikom",
      "country": "ru",
      "logoPng": "ru-novikom.png",
      "logoSvg": "ru-novikom.svg"
    },
    "ru-open": {
      "name": "ФК Открытие",
      "nameEn": "Otkritie FC",
      "url": "https://www.open.ru/",
      "backgroundColor": "#00b3e1",
      "backgroundColors": [
        "#29c9f3",
        "#00b3e1"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-open",
      "country": "ru",
      "logoPng": "ru-open.png",
      "logoSvg": "ru-open.svg"
    },
    "ru-otp": {
      "name": "ОТП Банк",
      "nameEn": "OTP Bank",
      "url": "https://www.otpbank.ru/",
      "backgroundColor": "#acff90",
      "backgroundColors": [
        "#acff90",
        "#9edabf"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#006437",
      "alias": "ru-otp",
      "country": "ru",
      "logoPng": "ru-otp.png",
      "logoSvg": "ru-otp.svg"
    },
    "ru-pochta": {
      "name": "Почта Банк",
      "nameEn": "Pochtabank",
      "url": "https://www.pochtabank.ru/",
      "backgroundColor": "#efefef",
      "backgroundColors": [
        "#efefef",
        "#dbe1ff"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#001689",
      "alias": "ru-pochta",
      "country": "ru",
      "logoPng": "ru-pochta.png",
      "logoSvg": "ru-pochta.svg"
    },
    "ru-psb": {
      "name": "Промсвязьбанк",
      "nameEn": "Promsvyazbank",
      "url": "http://www.psbank.ru/",
      "backgroundColor": "#c5cfef",
      "backgroundColors": [
        "#f7d1b5",
        "#c5cfef"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#274193",
      "alias": "ru-psb",
      "country": "ru",
      "logoPng": "ru-psb.png",
      "logoSvg": "ru-psb.svg"
    },
    "ru-raiffeisen": {
      "name": "Райффайзенбанк",
      "nameEn": "Raiffeisenbank bank",
      "url": "https://www.raiffeisen.ru/",
      "backgroundColor": "#efe6a2",
      "backgroundColors": [
        "#eeeeee",
        "#efe6a2"
      ],
      "backgroundLightness": "light",
      "logoStyle": "black",
      "text": "#000",
      "alias": "ru-raiffeisen",
      "country": "ru",
      "logoPng": "ru-raiffeisen.png",
      "logoSvg": "ru-raiffeisen.svg"
    },
    "ru-reb": {
      "name": "РосЕвроБанк",
      "nameEn": "Rosevrobank",
      "url": "http://www.rosevrobank.ru/",
      "backgroundColor": "#4b1650",
      "backgroundColors": [
        "#8b2d8e",
        "#4b1650"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-reb",
      "country": "ru",
      "logoPng": "ru-reb.png"
    },
    "ru-ren": {
      "name": "Ренессанс Кредит",
      "nameEn": "Renaissance Capital",
      "url": "https://rencredit.ru/",
      "backgroundColor": "#ffe6f1",
      "backgroundColors": [
        "#ffe6f1",
        "#f9fff1"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#439539",
      "alias": "ru-ren",
      "country": "ru",
      "logoPng": "ru-ren.png"
    },
    "ru-rgs": {
      "name": "Росгосстрах Банк",
      "nameEn": "Rosgosstrakh Bank",
      "url": "https://www.rgsbank.ru/",
      "backgroundColor": "#b31b2c",
      "backgroundColors": [
        "#b31b2c",
        "#6f030f"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "colored",
      "text": "#ffe2b8",
      "alias": "ru-rgs",
      "country": "ru",
      "logoPng": "ru-rgs.png",
      "logoSvg": "ru-rgs.svg"
    },
    "ru-rosbank": {
      "name": "Росбанк",
      "nameEn": "Rosbank bank",
      "url": "http://www.rosbank.ru/",
      "backgroundColor": "#d3b9ba",
      "backgroundColors": [
        "#d3b9ba",
        "#b1898b"
      ],
      "backgroundLightness": "light",
      "logoStyle": "black",
      "text": "#000",
      "alias": "ru-rosbank",
      "country": "ru",
      "logoPng": "ru-rosbank.png",
      "logoSvg": "ru-rosbank.svg"
    },
    "ru-roscap": {
      "name": "Российский Капитал",
      "nameEn": "Rossiysky Capital",
      "url": "http://www.roscap.ru/",
      "backgroundColor": "#ffdcc1",
      "backgroundColors": [
        "#ffdcc1",
        "#ffced0"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#000",
      "alias": "ru-roscap",
      "country": "ru",
      "logoPng": "ru-roscap.png"
    },
    "ru-rossiya": {
      "name": "Россия",
      "nameEn": "Rossiya",
      "url": "http://www.abr.ru/",
      "backgroundColor": "#eeeeee",
      "backgroundColors": [
        "#eeeeee",
        "#98c2dd"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#07476e",
      "alias": "ru-rossiya",
      "country": "ru",
      "logoPng": "ru-rossiya.png"
    },
    "ru-rsb": {
      "name": "Русский Стандарт",
      "nameEn": "Russian Standard Bank",
      "url": "https://www.rsb.ru/",
      "backgroundColor": "#414042",
      "backgroundColors": [
        "#6a656f",
        "#414042"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-rsb",
      "country": "ru",
      "logoPng": "ru-rsb.png",
      "logoSvg": "ru-rsb.svg"
    },
    "ru-rshb": {
      "name": "Россельхозбанк",
      "nameEn": "Rosselkhozbank",
      "url": "http://www.rshb.ru/",
      "backgroundColor": "#007f2b",
      "backgroundColors": [
        "#007f2b",
        "#005026"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#ffcd00",
      "alias": "ru-rshb",
      "country": "ru",
      "logoPng": "ru-rshb.png",
      "logoSvg": "ru-rshb.svg"
    },
    "ru-sberbank": {
      "name": "Сбербанк России",
      "nameEn": "Sberbank",
      "url": "https://www.sberbank.ru/",
      "backgroundColor": "#1a9f29",
      "backgroundColors": [
        "#1a9f29",
        "#0d7518"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-sberbank",
      "country": "ru",
      "logoPng": "ru-sberbank.png",
      "logoSvg": "ru-sberbank.svg"
    },
    "ru-skb": {
      "name": "СКБ-Банк",
      "nameEn": "SKB-Bank",
      "url": "http://www.skbbank.ru/",
      "backgroundColor": "#006b5a",
      "backgroundColors": [
        "#31a899",
        "#006b5a"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-skb",
      "country": "ru",
      "logoPng": "ru-skb.png"
    },
    "ru-smp": {
      "name": "СМП Банк",
      "nameEn": "SMP Bank",
      "url": "http://smpbank.ru/",
      "backgroundColor": "#9fe5ff",
      "backgroundColors": [
        "#9fe5ff",
        "#5ea6d6"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#005288",
      "alias": "ru-smp",
      "country": "ru",
      "logoPng": "ru-smp.png",
      "logoSvg": "ru-smp.svg"
    },
    "ru-sovkom": {
      "name": "Совкомбанк",
      "nameEn": "Sovcombank bank",
      "url": "https://sovcombank.ru/",
      "backgroundColor": "#c9e4f6",
      "backgroundColors": [
        "#c9e4f6",
        "#f5fafd"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#004281",
      "alias": "ru-sovkom",
      "country": "ru",
      "logoPng": "ru-sovkom.png"
    },
    "ru-spb": {
      "name": "Банк «Санкт-Петербург»",
      "nameEn": "Bank Saint Petersburg",
      "url": "https://www.bspb.ru/",
      "backgroundColor": "#ffcfcf",
      "backgroundColors": [
        "#ffcfcf",
        "#d2553f"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#000",
      "alias": "ru-spb",
      "country": "ru",
      "logoPng": "ru-spb.png"
    },
    "ru-sviaz": {
      "name": "Связь-Банк",
      "nameEn": "Sviaz-Bank",
      "url": "https://www.sviaz-bank.ru/",
      "backgroundColor": "#d2e0ec",
      "backgroundColors": [
        "#d2e0ec",
        "#caecd8"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#165a9a",
      "alias": "ru-sviaz",
      "country": "ru",
      "logoPng": "ru-sviaz.png"
    },
    "ru-tcb": {
      "name": "Транскапиталбанк",
      "nameEn": "Transcapitalbank",
      "url": "https://www.tkbbank.ru/",
      "backgroundColor": "#8cf5f4",
      "backgroundColors": [
        "#8cf5f4",
        "#ffe6bf"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#005599",
      "alias": "ru-tcb",
      "country": "ru",
      "logoPng": "ru-tcb.png"
    },
    "ru-tinkoff": {
      "name": "Тинькофф Банк",
      "nameEn": "Tinkoff Bank",
      "url": "https://www.tinkoff.ru/",
      "backgroundColor": "#333",
      "backgroundColors": [
        "#444",
        "#222"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-tinkoff",
      "country": "ru",
      "logoPng": "ru-tinkoff.png",
      "logoSvg": "ru-tinkoff.svg"
    },
    "ru-trust": {
      "name": "Траст",
      "nameEn": "Trust",
      "url": "http://www.trust.ru/",
      "backgroundColor": "#231f20",
      "backgroundColors": [
        "#403739",
        "#231f20"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-trust",
      "country": "ru",
      "logoPng": "ru-trust.png"
    },
    "ru-ubrd": {
      "name": "Уральский Банк Реконструкции и Развития",
      "nameEn": "UBRD",
      "url": "http://www.ubrr.ru/",
      "backgroundColor": "#ffd9e4",
      "backgroundColors": [
        "#ffd9e4",
        "#b6d1e3"
      ],
      "backgroundLightness": "light",
      "logoStyle": "black",
      "text": "#000",
      "alias": "ru-ubrd",
      "country": "ru",
      "logoPng": "ru-ubrd.png"
    },
    "ru-ucb": {
      "name": "ЮниКредит Банк",
      "nameEn": "UniCredit Bank",
      "url": "https://www.unicreditbank.ru/",
      "backgroundColor": "#250c0c",
      "backgroundColors": [
        "#402727",
        "#250c0c"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-ucb",
      "country": "ru",
      "logoPng": "ru-ucb.png",
      "logoSvg": "ru-ucb.svg"
    },
    "ru-uralsib": {
      "name": "Банк Уралсиб",
      "nameEn": "Uralsib",
      "url": "https://www.uralsib.ru/",
      "backgroundColor": "#2c4257",
      "backgroundColors": [
        "#6289aa",
        "#2c4257"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-uralsib",
      "country": "ru",
      "logoPng": "ru-uralsib.png",
      "logoSvg": "ru-uralsib.svg"
    },
    "ru-vbrr": {
      "name": "Всероссийский Банк Развития Регионов",
      "nameEn": "Russian Regional Development Bank",
      "url": "https://www.vbrr.ru/",
      "backgroundColor": "#173e6d",
      "backgroundColors": [
        "#4a5e75",
        "#173e6d"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-vbrr",
      "country": "ru",
      "logoPng": "ru-vbrr.png",
      "logoSvg": "ru-vbrr.svg"
    },
    "ru-veb": {
      "name": "Восточный Экспресс Банк",
      "nameEn": "Eastern Express Bank",
      "url": "https://www.vostbank.ru/",
      "backgroundColor": "#004e96",
      "backgroundColors": [
        "#004e96",
        "#ee3224"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-veb",
      "country": "ru",
      "logoPng": "ru-veb.png",
      "logoSvg": "ru-veb.svg"
    },
    "ru-vozrozhdenie": {
      "name": "Возрождение",
      "nameEn": "Bank Vozrozhdenie",
      "url": "http://www.vbank.ru/",
      "backgroundColor": "#cedae6",
      "backgroundColors": [
        "#cedae6",
        "#a4abb3"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#13427b",
      "alias": "ru-vozrozhdenie",
      "country": "ru",
      "logoPng": "ru-vozrozhdenie.png",
      "logoSvg": "ru-vozrozhdenie.svg"
    },
    "ru-vtb": {
      "name": "ВТБ Банк Москвы",
      "nameEn": "VTB Bank",
      "url": "http://www.vtb.ru/",
      "backgroundColor": "#1d2d70",
      "backgroundColors": [
        "#264489",
        "#1d2d70"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-vtb",
      "country": "ru",
      "logoPng": "ru-vtb.png",
      "logoSvg": "ru-vtb.svg"
    },
    "ru-vtb24": {
      "name": "ВТБ 24",
      "nameEn": "VTB 24",
      "url": "https://www.vtb24.ru/",
      "backgroundColor": "#c4cde4",
      "backgroundColors": [
        "#c4cde4",
        "#9fabcc",
        "#dca9ad"
      ],
      "backgroundLightness": "light",
      "logoStyle": "colored",
      "text": "#0a2972",
      "alias": "ru-vtb24",
      "country": "ru",
      "logoPng": "ru-vtb24.png"
    },
    "ru-zenit": {
      "name": "Зенит",
      "nameEn": "Zenit",
      "url": "https://www.zenit.ru/",
      "backgroundColor": "#008c99",
      "backgroundColors": [
        "#3fc2ce",
        "#008c99"
      ],
      "backgroundLightness": "dark",
      "logoStyle": "white",
      "text": "#fff",
      "alias": "ru-zenit",
      "country": "ru",
      "logoPng": "ru-zenit.png",
      "logoSvg": "ru-zenit.svg"
    }
  }
  var prefixes = {
    "220001": "ru-gpb",
    "220003": "ru-psb",
    "220006": "ru-sviaz",
    "220008": "ru-rossiya",
    "220020": "ru-mib",
    "220022": "ru-binbank",
    "220023": "ru-avangard",
    "220030": "ru-raiffeisen",
    "220488": "ru-smp",
    "360769": "ru-rsb",
    "375117": "ru-rsb",
    "400079": "ru-akbars",
    "400171": "ru-reb",
    "400244": "ru-uralsib",
    "400812": "ru-rosbank",
    "400814": "ru-rosbank",
    "400866": "ru-rosbank",
    "401173": "ru-open",
    "402107": "ru-vtb",
    "402177": "ru-raiffeisen",
    "402178": "ru-raiffeisen",
    "402179": "ru-raiffeisen",
    "402311": "ru-otp",
    "402312": "ru-otp",
    "402313": "ru-otp",
    "402326": "ru-mib",
    "402327": "ru-mib",
    "402328": "ru-mib",
    "402333": "ru-sberbank",
    "402429": "ru-globex",
    "402457": "ru-novikom",
    "402507": "ru-psb",
    "402532": "ru-sovkom",
    "402533": "ru-sovkom",
    "402534": "ru-sovkom",
    "402549": "ru-mib",
    "402877": "ru-tcb",
    "402909": "ru-novikom",
    "402910": "ru-novikom",
    "402911": "ru-novikom",
    "402948": "ru-binbank",
    "402949": "ru-binbank",
    "403184": "ru-vozrozhdenie",
    "403218": "ru-roscap",
    "403324": "ru-globex",
    "403780": "ru-mkb",
    "403894": "ru-binbank",
    "403896": "ru-avangard",
    "403897": "ru-avangard",
    "403898": "ru-avangard",
    "404111": "ru-uralsib",
    "404114": "ru-avangard",
    "404136": "ru-gpb",
    "404204": "ru-mts",
    "404224": "ru-mts",
    "404266": "ru-mts",
    "404267": "ru-mts",
    "404268": "ru-mts",
    "404269": "ru-mts",
    "404270": "ru-gpb",
    "404586": "ru-open",
    "404807": "ru-raiffeisen",
    "404862": "ru-rosbank",
    "404863": "ru-rosbank",
    "404885": "ru-raiffeisen",
    "404890": "ru-rosbank",
    "404892": "ru-rosbank",
    "404906": "ru-psb",
    "405225": "ru-binbank",
    "405226": "ru-binbank",
    "405436": "ru-rosbank",
    "405658": "ru-open",
    "405665": "ru-roscap",
    "405666": "ru-roscap",
    "405667": "ru-roscap",
    "405669": "ru-roscap",
    "405870": "ru-open",
    "405990": "ru-pochta",
    "405991": "ru-pochta",
    "405992": "ru-pochta",
    "405993": "ru-pochta",
    "406140": "ru-vbrr",
    "406141": "ru-vbrr",
    "406356": "ru-mts",
    "406364": "ru-hcf",
    "406372": "ru-absolut",
    "406744": "ru-vtb24",
    "406767": "ru-rosbank",
    "406777": "ru-jugra",
    "406778": "ru-jugra",
    "406779": "ru-jugra",
    "406780": "ru-jugra",
    "406781": "ru-jugra",
    "406977": "ru-vtb24",
    "407178": "ru-open",
    "407564": "ru-rosbank",
    "408373": "ru-ceb",
    "408396": "ru-alfa",
    "408397": "ru-alfa",
    "409356": "ru-open",
    "409357": "ru-open",
    "409358": "ru-open",
    "409398": "ru-vtb24",
    "409681": "ru-otp",
    "409682": "ru-uralsib",
    "409794": "ru-binbank",
    "410085": "ru-binbank",
    "410086": "ru-binbank",
    "410213": "ru-uralsib",
    "410323": "ru-trust",
    "410584": "ru-alfa",
    "410695": "ru-skb",
    "410696": "ru-skb",
    "410730": "ru-vozrozhdenie",
    "410731": "ru-vozrozhdenie",
    "411641": "ru-binbank",
    "411647": "ru-ceb",
    "411648": "ru-ceb",
    "411649": "ru-ceb",
    "411669": "ru-mob",
    "411670": "ru-mob",
    "411671": "ru-mob",
    "411676": "ru-spb",
    "411790": "ru-rsb",
    "411791": "ru-psb",
    "411900": "ru-trust",
    "411945": "ru-roscap",
    "412434": "ru-zenit",
    "412519": "ru-rosbank",
    "412746": "ru-binbank",
    "412776": "ru-citi",
    "413047": "ru-ucb",
    "413052": "ru-vozrozhdenie",
    "413203": "ru-vbrr",
    "413204": "ru-vbrr",
    "413205": "ru-vbrr",
    "413877": "ru-skb",
    "413878": "ru-skb",
    "413879": "ru-skb",
    "414035": "ru-vozrozhdenie",
    "414076": "ru-open",
    "414379": "ru-rosbank",
    "414563": "ru-roscap",
    "414656": "ru-zenit",
    "414657": "ru-zenit",
    "414658": "ru-zenit",
    "414659": "ru-zenit",
    "415025": "ru-ubrd",
    "415400": "ru-alfa",
    "415428": "ru-alfa",
    "415429": "ru-alfa",
    "415430": "ru-raiffeisen",
    "415481": "ru-alfa",
    "415482": "ru-alfa",
    "415822": "ru-reb",
    "416132": "ru-absolut",
    "416700": "ru-binbank",
    "416701": "ru-binbank",
    "416702": "ru-binbank",
    "416703": "ru-binbank",
    "416790": "ru-binbank",
    "416791": "ru-binbank",
    "416792": "ru-binbank",
    "416920": "ru-ceb",
    "416927": "ru-vtb",
    "416928": "ru-vtb",
    "416982": "ru-rgs",
    "416983": "ru-rgs",
    "416984": "ru-rgs",
    "417250": "ru-rsb",
    "417251": "ru-rsb",
    "417252": "ru-rsb",
    "417253": "ru-rsb",
    "417254": "ru-rsb",
    "417291": "ru-rsb",
    "417398": "ru-sberbank",
    "417689": "ru-binbank",
    "418260": "ru-vtb",
    "418261": "ru-vtb",
    "418262": "ru-vtb",
    "418362": "ru-sovkom",
    "418363": "ru-sovkom",
    "418364": "ru-sovkom",
    "418384": "ru-rshb",
    "418385": "ru-rshb",
    "418386": "ru-rshb",
    "418387": "ru-rshb",
    "418388": "ru-rshb",
    "418831": "ru-vtb24",
    "418906": "ru-reb",
    "418907": "ru-reb",
    "418908": "ru-reb",
    "418909": "ru-reb",
    "419149": "ru-atb",
    "419150": "ru-atb",
    "419151": "ru-atb",
    "419152": "ru-atb",
    "419153": "ru-atb",
    "419163": "ru-avangard",
    "419164": "ru-avangard",
    "419292": "ru-mkb",
    "419293": "ru-citi",
    "419349": "ru-citi",
    "419370": "ru-uralsib",
    "419519": "ru-binbank",
    "419539": "ru-alfa",
    "419540": "ru-alfa",
    "419636": "ru-otp",
    "419718": "ru-rsb",
    "419804": "ru-uralsib",
    "419805": "ru-uralsib",
    "419810": "ru-uralsib",
    "419905": "ru-rossiya",
    "420336": "ru-absolut",
    "420337": "ru-absolut",
    "420705": "ru-raiffeisen",
    "421179": "ru-citi",
    "421394": "ru-rosbank",
    "421398": "ru-gpb",
    "421637": "ru-sovkom",
    "421647": "ru-sovkom",
    "421648": "ru-rosbank",
    "421651": "ru-binbank",
    "421919": "ru-absolut",
    "422096": "ru-sovkom",
    "422097": "ru-sovkom",
    "422098": "ru-binbank",
    "422104": "ru-binbank",
    "422105": "ru-binbank",
    "422287": "ru-raiffeisen",
    "422372": "ru-uralsib",
    "422608": "ru-rshb",
    "422838": "ru-vozrozhdenie",
    "422839": "ru-vozrozhdenie",
    "423078": "ru-sberbank",
    "423169": "ru-rosbank",
    "423197": "ru-spb",
    "423218": "ru-vozrozhdenie",
    "423569": "ru-absolut",
    "424204": "ru-uralsib",
    "424205": "ru-uralsib",
    "424206": "ru-uralsib",
    "424207": "ru-uralsib",
    "424290": "ru-uralsib",
    "424291": "ru-uralsib",
    "424436": "ru-akbars",
    "424437": "ru-akbars",
    "424438": "ru-akbars",
    "424439": "ru-akbars",
    "424440": "ru-akbars",
    "424473": "ru-uralsib",
    "424474": "ru-uralsib",
    "424475": "ru-uralsib",
    "424476": "ru-uralsib",
    "424553": "ru-trust",
    "424554": "ru-trust",
    "424555": "ru-trust",
    "424561": "ru-psb",
    "424562": "ru-psb",
    "424563": "ru-psb",
    "424901": "ru-sovkom",
    "424917": "ru-gpb",
    "424944": "ru-sovkom",
    "424974": "ru-gpb",
    "424975": "ru-gpb",
    "424976": "ru-gpb",
    "425153": "ru-rosbank",
    "425534": "ru-veb",
    "425535": "ru-veb",
    "425553": "ru-veb",
    "425620": "ru-raiffeisen",
    "425693": "ru-smp",
    "425694": "ru-smp",
    "425695": "ru-smp",
    "425696": "ru-smp",
    "425874": "ru-binbank",
    "425884": "ru-raiffeisen",
    "425885": "ru-raiffeisen",
    "426101": "ru-alfa",
    "426102": "ru-alfa",
    "426113": "ru-alfa",
    "426114": "ru-alfa",
    "426201": "ru-trust",
    "426334": "ru-trust",
    "426335": "ru-trust",
    "426390": "ru-uralsib",
    "426396": "ru-uralsib",
    "426803": "ru-psb",
    "426804": "ru-psb",
    "426809": "ru-rossiya",
    "426810": "ru-rossiya",
    "426811": "ru-rossiya",
    "426812": "ru-rossiya",
    "426813": "ru-rossiya",
    "426814": "ru-rossiya",
    "426815": "ru-rossiya",
    "426890": "ru-gpb",
    "427229": "ru-vtb24",
    "427230": "ru-vtb24",
    "427326": "ru-gpb",
    "427400": "ru-sberbank",
    "427401": "ru-sberbank",
    "427402": "ru-sberbank",
    "427403": "ru-sberbank",
    "427404": "ru-sberbank",
    "427405": "ru-sberbank",
    "427406": "ru-sberbank",
    "427407": "ru-sberbank",
    "427408": "ru-sberbank",
    "427409": "ru-sberbank",
    "427410": "ru-sberbank",
    "427411": "ru-sberbank",
    "427412": "ru-sberbank",
    "427413": "ru-sberbank",
    "427414": "ru-sberbank",
    "427415": "ru-sberbank",
    "427416": "ru-sberbank",
    "427417": "ru-sberbank",
    "427418": "ru-sberbank",
    "427419": "ru-sberbank",
    "427420": "ru-sberbank",
    "427421": "ru-sberbank",
    "427422": "ru-sberbank",
    "427423": "ru-sberbank",
    "427424": "ru-sberbank",
    "427425": "ru-sberbank",
    "427426": "ru-sberbank",
    "427427": "ru-sberbank",
    "427428": "ru-sberbank",
    "427429": "ru-sberbank",
    "427430": "ru-sberbank",
    "427431": "ru-sberbank",
    "427432": "ru-sberbank",
    "427433": "ru-sberbank",
    "427434": "ru-sberbank",
    "427435": "ru-sberbank",
    "427436": "ru-sberbank",
    "427437": "ru-sberbank",
    "427438": "ru-sberbank",
    "427439": "ru-sberbank",
    "427440": "ru-sberbank",
    "427441": "ru-sberbank",
    "427442": "ru-sberbank",
    "427443": "ru-sberbank",
    "427444": "ru-sberbank",
    "427445": "ru-sberbank",
    "427446": "ru-sberbank",
    "427447": "ru-sberbank",
    "427448": "ru-sberbank",
    "427449": "ru-sberbank",
    "427450": "ru-sberbank",
    "427451": "ru-sberbank",
    "427452": "ru-sberbank",
    "427453": "ru-sberbank",
    "427454": "ru-sberbank",
    "427455": "ru-sberbank",
    "427456": "ru-sberbank",
    "427457": "ru-sberbank",
    "427458": "ru-sberbank",
    "427459": "ru-sberbank",
    "427460": "ru-sberbank",
    "427461": "ru-sberbank",
    "427462": "ru-sberbank",
    "427463": "ru-sberbank",
    "427464": "ru-sberbank",
    "427465": "ru-sberbank",
    "427466": "ru-sberbank",
    "427467": "ru-sberbank",
    "427468": "ru-sberbank",
    "427469": "ru-sberbank",
    "427470": "ru-sberbank",
    "427471": "ru-sberbank",
    "427472": "ru-sberbank",
    "427473": "ru-sberbank",
    "427474": "ru-sberbank",
    "427475": "ru-sberbank",
    "427476": "ru-sberbank",
    "427477": "ru-sberbank",
    "427491": "ru-sberbank",
    "427499": "ru-sberbank",
    "427600": "ru-sberbank",
    "427601": "ru-sberbank",
    "427602": "ru-sberbank",
    "427603": "ru-sberbank",
    "427604": "ru-sberbank",
    "427605": "ru-sberbank",
    "427606": "ru-sberbank",
    "427607": "ru-sberbank",
    "427608": "ru-sberbank",
    "427609": "ru-sberbank",
    "427610": "ru-sberbank",
    "427611": "ru-sberbank",
    "427612": "ru-sberbank",
    "427613": "ru-sberbank",
    "427614": "ru-sberbank",
    "427615": "ru-sberbank",
    "427616": "ru-sberbank",
    "427617": "ru-sberbank",
    "427618": "ru-sberbank",
    "427619": "ru-sberbank",
    "427620": "ru-sberbank",
    "427621": "ru-sberbank",
    "427622": "ru-sberbank",
    "427623": "ru-sberbank",
    "427624": "ru-sberbank",
    "427625": "ru-sberbank",
    "427626": "ru-sberbank",
    "427627": "ru-sberbank",
    "427628": "ru-sberbank",
    "427629": "ru-sberbank",
    "427630": "ru-sberbank",
    "427631": "ru-sberbank",
    "427632": "ru-sberbank",
    "427633": "ru-sberbank",
    "427634": "ru-sberbank",
    "427635": "ru-sberbank",
    "427636": "ru-sberbank",
    "427637": "ru-sberbank",
    "427638": "ru-sberbank",
    "427639": "ru-sberbank",
    "427640": "ru-sberbank",
    "427641": "ru-sberbank",
    "427642": "ru-sberbank",
    "427643": "ru-sberbank",
    "427644": "ru-sberbank",
    "427645": "ru-sberbank",
    "427646": "ru-sberbank",
    "427647": "ru-sberbank",
    "427648": "ru-sberbank",
    "427649": "ru-sberbank",
    "427650": "ru-sberbank",
    "427651": "ru-sberbank",
    "427652": "ru-sberbank",
    "427653": "ru-sberbank",
    "427654": "ru-sberbank",
    "427655": "ru-sberbank",
    "427656": "ru-sberbank",
    "427657": "ru-sberbank",
    "427658": "ru-sberbank",
    "427659": "ru-sberbank",
    "427660": "ru-sberbank",
    "427661": "ru-sberbank",
    "427662": "ru-sberbank",
    "427663": "ru-sberbank",
    "427664": "ru-sberbank",
    "427665": "ru-sberbank",
    "427666": "ru-sberbank",
    "427667": "ru-sberbank",
    "427668": "ru-sberbank",
    "427669": "ru-sberbank",
    "427670": "ru-sberbank",
    "427671": "ru-sberbank",
    "427672": "ru-sberbank",
    "427673": "ru-sberbank",
    "427674": "ru-sberbank",
    "427675": "ru-sberbank",
    "427676": "ru-sberbank",
    "427677": "ru-sberbank",
    "427678": "ru-sberbank",
    "427679": "ru-sberbank",
    "427680": "ru-sberbank",
    "427681": "ru-sberbank",
    "427682": "ru-sberbank",
    "427683": "ru-sberbank",
    "427684": "ru-sberbank",
    "427685": "ru-sberbank",
    "427686": "ru-sberbank",
    "427687": "ru-sberbank",
    "427688": "ru-sberbank",
    "427689": "ru-sberbank",
    "427690": "ru-sberbank",
    "427692": "ru-sberbank",
    "427693": "ru-sberbank",
    "427694": "ru-sberbank",
    "427695": "ru-sberbank",
    "427696": "ru-sberbank",
    "427697": "ru-sberbank",
    "427699": "ru-sberbank",
    "427714": "ru-alfa",
    "427715": "ru-rosbank",
    "427725": "ru-binbank",
    "427760": "ru-citi",
    "427761": "ru-citi",
    "427806": "ru-roscap",
    "427807": "ru-roscap",
    "427808": "ru-roscap",
    "427827": "ru-uralsib",
    "427828": "ru-uralsib",
    "427853": "ru-sovkom",
    "427900": "ru-sberbank",
    "427901": "ru-sberbank",
    "427902": "ru-sberbank",
    "427903": "ru-sberbank",
    "427904": "ru-sberbank",
    "427905": "ru-sberbank",
    "427906": "ru-sberbank",
    "427907": "ru-sberbank",
    "427908": "ru-sberbank",
    "427909": "ru-sberbank",
    "427910": "ru-sberbank",
    "427911": "ru-sberbank",
    "427912": "ru-sberbank",
    "427913": "ru-sberbank",
    "427914": "ru-sberbank",
    "427915": "ru-sberbank",
    "427916": "ru-sberbank",
    "427917": "ru-sberbank",
    "427918": "ru-sberbank",
    "427919": "ru-sberbank",
    "427920": "ru-sberbank",
    "427921": "ru-sberbank",
    "427922": "ru-sberbank",
    "427923": "ru-sberbank",
    "427924": "ru-sberbank",
    "427925": "ru-sberbank",
    "427926": "ru-sberbank",
    "427927": "ru-sberbank",
    "427928": "ru-sberbank",
    "427929": "ru-sberbank",
    "427930": "ru-sberbank",
    "427931": "ru-sberbank",
    "427932": "ru-sberbank",
    "427933": "ru-sberbank",
    "427934": "ru-sberbank",
    "427935": "ru-sberbank",
    "427936": "ru-sberbank",
    "427937": "ru-sberbank",
    "427938": "ru-sberbank",
    "427939": "ru-sberbank",
    "427940": "ru-sberbank",
    "427941": "ru-sberbank",
    "427942": "ru-sberbank",
    "427943": "ru-sberbank",
    "427944": "ru-sberbank",
    "427945": "ru-sberbank",
    "427946": "ru-sberbank",
    "427947": "ru-sberbank",
    "427948": "ru-sberbank",
    "427949": "ru-sberbank",
    "427950": "ru-sberbank",
    "427951": "ru-sberbank",
    "427952": "ru-sberbank",
    "427953": "ru-sberbank",
    "427954": "ru-sberbank",
    "427955": "ru-sberbank",
    "427956": "ru-sberbank",
    "427957": "ru-sberbank",
    "427958": "ru-sberbank",
    "427959": "ru-sberbank",
    "427960": "ru-sberbank",
    "427961": "ru-sberbank",
    "427962": "ru-sberbank",
    "427963": "ru-sberbank",
    "427964": "ru-sberbank",
    "427965": "ru-sberbank",
    "427966": "ru-sberbank",
    "427967": "ru-sberbank",
    "427968": "ru-sberbank",
    "427969": "ru-sberbank",
    "427970": "ru-sberbank",
    "427971": "ru-sberbank",
    "427972": "ru-sberbank",
    "427973": "ru-sberbank",
    "427974": "ru-sberbank",
    "427975": "ru-sberbank",
    "427976": "ru-sberbank",
    "427977": "ru-sberbank",
    "427978": "ru-sberbank",
    "427979": "ru-sberbank",
    "427980": "ru-sberbank",
    "427981": "ru-sberbank",
    "427982": "ru-sberbank",
    "427983": "ru-sberbank",
    "427984": "ru-sberbank",
    "427985": "ru-sberbank",
    "427986": "ru-sberbank",
    "427987": "ru-sberbank",
    "427988": "ru-sberbank",
    "427989": "ru-sberbank",
    "427990": "ru-sberbank",
    "427991": "ru-sberbank",
    "427992": "ru-sberbank",
    "427993": "ru-sberbank",
    "427994": "ru-sberbank",
    "427995": "ru-sberbank",
    "427996": "ru-sberbank",
    "427997": "ru-sberbank",
    "427998": "ru-sberbank",
    "427999": "ru-sberbank",
    "428252": "ru-absolut",
    "428253": "ru-absolut",
    "428254": "ru-absolut",
    "428266": "ru-zenit",
    "428666": "ru-atb",
    "428804": "ru-alfa",
    "428905": "ru-alfa",
    "428906": "ru-alfa",
    "428925": "ru-spb",
    "429015": "ru-veb",
    "429016": "ru-veb",
    "429037": "ru-open",
    "429038": "ru-open",
    "429039": "ru-open",
    "429040": "ru-open",
    "429096": "ru-open",
    "429196": "ru-uralsib",
    "429197": "ru-uralsib",
    "429565": "ru-vtb24",
    "429749": "ru-vtb24",
    "429796": "ru-zenit",
    "429797": "ru-zenit",
    "429798": "ru-zenit",
    "429811": "ru-uralsib",
    "430081": "ru-rosbank",
    "430088": "ru-rosbank",
    "430180": "ru-ubrd",
    "430181": "ru-ubrd",
    "430289": "ru-sviaz",
    "430299": "ru-gpb",
    "430323": "ru-ucb",
    "430439": "ru-ubrd",
    "430708": "ru-rossiya",
    "430709": "ru-rossiya",
    "431112": "ru-uralsib",
    "431113": "ru-uralsib",
    "431114": "ru-uralsib",
    "431165": "ru-open",
    "431166": "ru-open",
    "431359": "ru-rgs",
    "431416": "ru-alfa",
    "431417": "ru-alfa",
    "431727": "ru-alfa",
    "431854": "ru-ren",
    "431855": "ru-ren",
    "431856": "ru-ren",
    "431857": "ru-ren",
    "431890": "ru-ren",
    "432050": "ru-globex",
    "432058": "ru-skb",
    "432158": "ru-ceb",
    "432169": "ru-uralsib",
    "432259": "ru-uralsib",
    "432260": "ru-uralsib",
    "432417": "ru-open",
    "432498": "ru-raiffeisen",
    "432560": "ru-ucb",
    "432638": "ru-rosbank",
    "432947": "ru-otp",
    "432948": "ru-otp",
    "432949": "ru-otp",
    "433011": "ru-uralsib",
    "433102": "ru-vozrozhdenie",
    "433300": "ru-ucb",
    "433316": "ru-gpb",
    "433336": "ru-ucb",
    "434135": "ru-alfa",
    "434146": "ru-open",
    "434147": "ru-open",
    "434148": "ru-open",
    "434149": "ru-uralsib",
    "435139": "ru-ubrd",
    "435986": "ru-rshb",
    "436100": "ru-rshb",
    "436104": "ru-rshb",
    "436398": "ru-novikom",
    "436865": "ru-otp",
    "437348": "ru-rsb",
    "437349": "ru-spb",
    "437524": "ru-skb",
    "437540": "ru-trust",
    "437541": "ru-trust",
    "437772": "ru-tinkoff",
    "437773": "ru-tinkoff",
    "437784": "ru-tinkoff",
    "438046": "ru-citi",
    "438143": "ru-alfa",
    "438254": "ru-vozrozhdenie",
    "438933": "ru-rosbank",
    "438970": "ru-rosbank",
    "438971": "ru-rosbank",
    "439000": "ru-alfa",
    "439054": "ru-sviaz",
    "439055": "ru-sviaz",
    "439056": "ru-sviaz",
    "439057": "ru-sviaz",
    "439077": "ru-alfa",
    "439243": "ru-globex",
    "439244": "ru-globex",
    "439245": "ru-globex",
    "439246": "ru-globex",
    "439250": "ru-globex",
    "439251": "ru-globex",
    "440237": "ru-alfa",
    "440399": "ru-vozrozhdenie",
    "440503": "ru-rosbank",
    "440504": "ru-rosbank",
    "440505": "ru-rosbank",
    "440540": "ru-rosbank",
    "440541": "ru-rosbank",
    "440610": "ru-uralsib",
    "440664": "ru-uralsib",
    "440665": "ru-uralsib",
    "440666": "ru-uralsib",
    "440668": "ru-uralsib",
    "440680": "ru-uralsib",
    "440682": "ru-uralsib",
    "440683": "ru-uralsib",
    "440689": "ru-uralsib",
    "440690": "ru-uralsib",
    "440849": "ru-rosbank",
    "440850": "ru-rosbank",
    "441108": "ru-globex",
    "441273": "ru-vbrr",
    "441318": "ru-sviaz",
    "442466": "ru-uralsib",
    "443222": "ru-mkb",
    "443223": "ru-mkb",
    "443271": "ru-mkb",
    "443272": "ru-mkb",
    "443273": "ru-mkb",
    "443274": "ru-mkb",
    "443275": "ru-roscap",
    "443306": "ru-absolut",
    "443307": "ru-absolut",
    "443308": "ru-absolut",
    "443309": "ru-absolut",
    "443884": "ru-veb",
    "443885": "ru-veb",
    "443886": "ru-veb",
    "443887": "ru-veb",
    "443888": "ru-veb",
    "444002": "ru-binbank",
    "444023": "ru-binbank",
    "444024": "ru-binbank",
    "444025": "ru-binbank",
    "444094": "ru-veb",
    "444238": "ru-smp",
    "444239": "ru-smp",
    "444240": "ru-smp",
    "444241": "ru-smp",
    "444429": "ru-rsb",
    "445433": "ru-hcf",
    "445434": "ru-hcf",
    "445435": "ru-hcf",
    "445436": "ru-hcf",
    "445977": "ru-raiffeisen",
    "446050": "ru-psb",
    "446065": "ru-open",
    "446098": "ru-hcf",
    "446320": "ru-veb",
    "446674": "ru-vtb",
    "446915": "ru-hcf",
    "446916": "ru-raiffeisen",
    "446917": "ru-raiffeisen",
    "446950": "ru-tcb",
    "447362": "ru-binbank",
    "447363": "ru-binbank",
    "447516": "ru-trust",
    "447603": "ru-raiffeisen",
    "447624": "ru-raiffeisen",
    "447817": "ru-psb",
    "447818": "ru-psb",
    "447824": "ru-psb",
    "448331": "ru-vtb24",
    "448343": "ru-vtb24",
    "448344": "ru-vtb24",
    "448346": "ru-vtb24",
    "448369": "ru-vtb24",
    "449572": "ru-hcf",
    "450251": "ru-rosbank",
    "451382": "ru-psb",
    "452235": "ru-rossiya",
    "452236": "ru-rossiya",
    "453558": "ru-uralsib",
    "453559": "ru-uralsib",
    "453560": "ru-uralsib",
    "453561": "ru-uralsib",
    "456515": "ru-trust",
    "456516": "ru-trust",
    "456587": "ru-ceb",
    "456588": "ru-ceb",
    "457647": "ru-rsb",
    "457802": "ru-mts",
    "457816": "ru-open",
    "457817": "ru-open",
    "457818": "ru-open",
    "457819": "ru-open",
    "458218": "ru-binbank",
    "458279": "ru-alfa",
    "458280": "ru-alfa",
    "458281": "ru-alfa",
    "458410": "ru-alfa",
    "458411": "ru-alfa",
    "458443": "ru-alfa",
    "458450": "ru-alfa",
    "458473": "ru-atb",
    "458488": "ru-atb",
    "458489": "ru-atb",
    "458490": "ru-atb",
    "458493": "ru-open",
    "458559": "ru-novikom",
    "458722": "ru-rossiya",
    "458723": "ru-rossiya",
    "458731": "ru-absolut",
    "459226": "ru-skb",
    "459230": "ru-otp",
    "459290": "ru-uralsib",
    "459328": "ru-roscap",
    "459937": "ru-rosbank",
    "460493": "ru-rosbank",
    "462013": "ru-mts",
    "462235": "ru-vtb24",
    "462729": "ru-raiffeisen",
    "462730": "ru-raiffeisen",
    "462758": "ru-raiffeisen",
    "462776": "ru-ucb",
    "462779": "ru-raiffeisen",
    "464405": "ru-vozrozhdenie",
    "464485": "ru-trust",
    "464636": "ru-akbars",
    "464787": "ru-vtb24",
    "464827": "ru-absolut",
    "464828": "ru-absolut",
    "464842": "ru-vtb24",
    "465203": "ru-binbank",
    "465204": "ru-binbank",
    "465205": "ru-binbank",
    "465227": "ru-alfa",
    "465578": "ru-raiffeisen",
    "465882": "ru-gpb",
    "466047": "ru-uralsib",
    "466048": "ru-uralsib",
    "466049": "ru-uralsib",
    "466050": "ru-uralsib",
    "466163": "ru-ren",
    "466164": "ru-ren",
    "466174": "ru-ren",
    "466500": "ru-roscap",
    "466505": "ru-roscap",
    "466511": "ru-roscap",
    "466512": "ru-roscap",
    "466513": "ru-roscap",
    "466514": "ru-roscap",
    "467033": "ru-trust",
    "467058": "ru-vtb24",
    "467485": "ru-open",
    "467486": "ru-open",
    "467487": "ru-open",
    "467564": "ru-sviaz",
    "467810": "ru-uralsib",
    "467811": "ru-uralsib",
    "467812": "ru-uralsib",
    "467933": "ru-roscap",
    "468596": "ru-smp",
    "469339": "ru-binbank",
    "469360": "ru-citi",
    "469362": "ru-ucb",
    "469376": "ru-globex",
    "469670": "ru-smp",
    "470127": "ru-tinkoff",
    "470342": "ru-uralsib",
    "470434": "ru-zenit",
    "470673": "ru-avangard",
    "470674": "ru-avangard",
    "470675": "ru-avangard",
    "471225": "ru-rgs",
    "471226": "ru-ubrd",
    "471358": "ru-mkb",
    "471436": "ru-novikom",
    "471439": "ru-uralsib",
    "471440": "ru-uralsib",
    "471441": "ru-uralsib",
    "471487": "ru-vtb24",
    "471499": "ru-uralsib",
    "472235": "ru-zenit",
    "472252": "ru-reb",
    "472313": "ru-vtb",
    "472345": "ru-psb",
    "472346": "ru-psb",
    "472347": "ru-psb",
    "472348": "ru-psb",
    "472445": "ru-hcf",
    "472446": "ru-ucb",
    "472480": "ru-mib",
    "472489": "ru-rgs",
    "472879": "ru-skb",
    "472933": "ru-veb",
    "472934": "ru-veb",
    "473841": "ru-rgs",
    "473849": "ru-citi",
    "473850": "ru-citi",
    "473853": "ru-rosbank",
    "473854": "ru-rosbank",
    "473855": "ru-rosbank",
    "473869": "ru-tcb",
    "474218": "ru-rosbank",
    "475098": "ru-sviaz",
    "475791": "ru-alfa",
    "476036": "ru-raiffeisen",
    "476206": "ru-psb",
    "476207": "ru-psb",
    "476208": "ru-psb",
    "476280": "ru-rossiya",
    "476804": "ru-veb",
    "476827": "ru-rosbank",
    "476946": "ru-rossiya",
    "477714": "ru-alfa",
    "477908": "ru-rosbank",
    "477932": "ru-alfa",
    "477960": "ru-alfa",
    "477964": "ru-alfa",
    "477986": "ru-rosbank",
    "478264": "ru-rosbank",
    "478265": "ru-rosbank",
    "478266": "ru-rosbank",
    "478273": "ru-avangard",
    "478387": "ru-atb",
    "478474": "ru-tcb",
    "478475": "ru-tcb",
    "478476": "ru-tcb",
    "478741": "ru-raiffeisen",
    "478752": "ru-alfa",
    "479004": "ru-alfa",
    "479087": "ru-alfa",
    "479713": "ru-spb",
    "479768": "ru-spb",
    "479769": "ru-spb",
    "479770": "ru-spb",
    "479771": "ru-spb",
    "479772": "ru-spb",
    "479773": "ru-spb",
    "479788": "ru-spb",
    "480232": "ru-zenit",
    "480623": "ru-alfa",
    "480938": "ru-mib",
    "481776": "ru-sberbank",
    "481779": "ru-sberbank",
    "481781": "ru-sberbank",
    "482413": "ru-psb",
    "483175": "ru-rsb",
    "483176": "ru-rsb",
    "483177": "ru-rsb",
    "483973": "ru-uralsib",
    "483974": "ru-uralsib",
    "483975": "ru-uralsib",
    "483976": "ru-uralsib",
    "483977": "ru-uralsib",
    "483979": "ru-uralsib",
    "483980": "ru-uralsib",
    "484800": "ru-open",
    "485071": "ru-rossiya",
    "485463": "ru-sberbank",
    "485467": "ru-citi",
    "485608": "ru-ucb",
    "485649": "ru-open",
    "486031": "ru-trust",
    "486065": "ru-rsb",
    "486322": "ru-mob",
    "486666": "ru-citi",
    "487415": "ru-gpb",
    "487416": "ru-gpb",
    "487417": "ru-gpb",
    "488951": "ru-skb",
    "489042": "ru-ucb",
    "489099": "ru-ucb",
    "489169": "ru-uralsib",
    "489186": "ru-reb",
    "489195": "ru-vtb",
    "489196": "ru-vtb",
    "489327": "ru-vtb24",
    "489347": "ru-vtb24",
    "489348": "ru-vtb24",
    "489349": "ru-vtb24",
    "489350": "ru-vtb24",
    "489354": "ru-gpb",
    "490736": "ru-vozrozhdenie",
    "490815": "ru-uralsib",
    "490816": "ru-raiffeisen",
    "490818": "ru-ucb",
    "490855": "ru-ucb",
    "490986": "ru-trust",
    "493475": "ru-trust",
    "494343": "ru-trust",
    "498629": "ru-vtb24",
    "498868": "ru-vozrozhdenie",
    "499932": "ru-rosbank",
    "499966": "ru-rosbank",
    "508406": "ru-raiffeisen",
    "510047": "ru-rsb",
    "510060": "ru-vtb",
    "510069": "ru-raiffeisen",
    "510070": "ru-raiffeisen",
    "510074": "ru-ucb",
    "510082": "ru-roscap",
    "510092": "ru-rsb",
    "510098": "ru-rosbank",
    "510125": "ru-roscap",
    "510126": "ru-alfa",
    "510144": "ru-vtb24",
    "510154": "ru-mib",
    "510162": "ru-roscap",
    "510166": "ru-roscap",
    "510172": "ru-uralsib",
    "510173": "ru-roscap",
    "510411": "ru-uralsib",
    "510412": "ru-uralsib",
    "510424": "ru-uralsib",
    "510429": "ru-uralsib",
    "510436": "ru-uralsib",
    "510444": "ru-uralsib",
    "510453": "ru-rosbank",
    "510464": "ru-zenit",
    "510469": "ru-zenit",
    "510483": "ru-uralsib",
    "510494": "ru-uralsib",
    "510495": "ru-vtb",
    "510499": "ru-uralsib",
    "510508": "ru-uralsib",
    "510511": "ru-mib",
    "511741": "ru-uralsib",
    "512003": "ru-rosbank",
    "512051": "ru-roscap",
    "512082": "ru-roscap",
    "512273": "ru-ceb",
    "512298": "ru-uralsib",
    "512347": "ru-roscap",
    "512378": "ru-vtb",
    "512394": "ru-uralsib",
    "512419": "ru-uralsib",
    "512424": "ru-uralsib",
    "512442": "ru-roscap",
    "512444": "ru-ren",
    "512449": "ru-zenit",
    "512450": "ru-vtb",
    "512478": "ru-rgs",
    "512510": "ru-uralsib",
    "512594": "ru-roscap",
    "512626": "ru-roscap",
    "512636": "ru-uralsib",
    "512641": "ru-roscap",
    "512643": "ru-roscap",
    "512741": "ru-uralsib",
    "512756": "ru-rosbank",
    "512762": "ru-citi",
    "512771": "ru-rosbank",
    "512777": "ru-uralsib",
    "512788": "ru-uralsib",
    "512808": "ru-rosbank",
    "512821": "ru-roscap",
    "513022": "ru-rosbank",
    "513222": "ru-uralsib",
    "513459": "ru-roscap",
    "513691": "ru-rsb",
    "513768": "ru-roscap",
    "513769": "ru-roscap",
    "514014": "ru-roscap",
    "514017": "ru-open",
    "514082": "ru-gpb",
    "514515": "ru-uralsib",
    "514529": "ru-rosbank",
    "514930": "ru-rosbank",
    "515243": "ru-open",
    "515548": "ru-sberbank",
    "515587": "ru-mib",
    "515605": "ru-rosbank",
    "515681": "ru-jugra",
    "515739": "ru-mib",
    "515760": "ru-zenit",
    "515764": "ru-smp",
    "515770": "ru-mkb",
    "515774": "ru-otp",
    "515777": "ru-uralsib",
    "515785": "ru-binbank",
    "515792": "ru-uralsib",
    "515840": "ru-uralsib",
    "515842": "ru-sberbank",
    "515844": "ru-uralsib",
    "515848": "ru-psb",
    "515854": "ru-citi",
    "515861": "ru-uralsib",
    "515862": "ru-roscap",
    "515876": "ru-raiffeisen",
    "515887": "ru-uralsib",
    "515899": "ru-open",
    "515900": "ru-uralsib",
    "516009": "ru-otp",
    "516025": "ru-uralsib",
    "516116": "ru-ren",
    "516150": "ru-ren",
    "516161": "ru-uralsib",
    "516206": "ru-uralsib",
    "516333": "ru-zenit",
    "516354": "ru-open",
    "516356": "ru-mib",
    "516358": "ru-zenit",
    "516372": "ru-zenit",
    "516387": "ru-open",
    "516444": "ru-hcf",
    "516445": "ru-uralsib",
    "516448": "ru-uralsib",
    "516454": "ru-gpb",
    "516456": "ru-zenit",
    "516473": "ru-psb",
    "516570": "ru-vtb",
    "516587": "ru-vtb",
    "516906": "ru-trust",
    "517202": "ru-otp",
    "517375": "ru-gpb",
    "517508": "ru-open",
    "517538": "ru-rosbank",
    "517583": "ru-rosbank",
    "517593": "ru-gpb",
    "517667": "ru-zenit",
    "517803": "ru-roscap",
    "517807": "ru-roscap",
    "517822": "ru-rosbank",
    "517955": "ru-mts",
    "518025": "ru-uralsib",
    "518038": "ru-rosbank",
    "518048": "ru-uralsib",
    "518079": "ru-rosbank",
    "518095": "ru-uralsib",
    "518223": "ru-uralsib",
    "518228": "ru-gpb",
    "518275": "ru-uralsib",
    "518316": "ru-uralsib",
    "518318": "ru-uralsib",
    "518331": "ru-roscap",
    "518365": "ru-roscap",
    "518372": "ru-uralsib",
    "518373": "ru-gpb",
    "518392": "ru-uralsib",
    "518406": "ru-rosbank",
    "518449": "ru-uralsib",
    "518499": "ru-uralsib",
    "518505": "ru-vtb",
    "518522": "ru-uralsib",
    "518533": "ru-uralsib",
    "518580": "ru-rosbank",
    "518586": "ru-binbank",
    "518591": "ru-vtb24",
    "518598": "ru-roscap",
    "518607": "ru-uralsib",
    "518621": "ru-uralsib",
    "518640": "ru-vtb24",
    "518642": "ru-rosbank",
    "518647": "ru-zenit",
    "518681": "ru-avangard",
    "518683": "ru-uralsib",
    "518704": "ru-gpb",
    "518714": "ru-rosbank",
    "518727": "ru-uralsib",
    "518753": "ru-trust",
    "518774": "ru-reb",
    "518781": "ru-reb",
    "518788": "ru-binbank",
    "518795": "ru-roscap",
    "518805": "ru-uralsib",
    "518816": "ru-gpb",
    "518820": "ru-smp",
    "518827": "ru-sviaz",
    "518864": "ru-rosbank",
    "518874": "ru-uralsib",
    "518876": "ru-binbank",
    "518882": "ru-rosbank",
    "518884": "ru-smp",
    "518885": "ru-trust",
    "518889": "ru-rosbank",
    "518901": "ru-tinkoff",
    "518902": "ru-gpb",
    "518909": "ru-uralsib",
    "518911": "ru-uralsib",
    "518916": "ru-roscap",
    "518946": "ru-psb",
    "518970": "ru-psb",
    "518971": "ru-sviaz",
    "518977": "ru-psb",
    "518981": "ru-psb",
    "518996": "ru-ucb",
    "518997": "ru-ucb",
    "519304": "ru-vtb24",
    "519327": "ru-roscap",
    "519333": "ru-vozrozhdenie",
    "519346": "ru-uralsib",
    "519350": "ru-roscap",
    "519747": "ru-alfa",
    "519778": "ru-alfa",
    "519998": "ru-vtb24",
    "520006": "ru-uralsib",
    "520035": "ru-uralsib",
    "520036": "ru-rosbank",
    "520047": "ru-rosbank",
    "520085": "ru-psb",
    "520088": "ru-psb",
    "520093": "ru-roscap",
    "520113": "ru-mib",
    "520305": "ru-citi",
    "520306": "ru-citi",
    "520328": "ru-binbank",
    "520348": "ru-roscap",
    "520350": "ru-zenit",
    "520373": "ru-citi",
    "520377": "ru-citi",
    "520633": "ru-sberbank",
    "520666": "ru-roscap",
    "520685": "ru-roscap",
    "520902": "ru-rosbank",
    "520905": "ru-ren",
    "520920": "ru-smp",
    "520935": "ru-akbars",
    "520957": "ru-citi",
    "520985": "ru-akbars",
    "520993": "ru-citi",
    "520996": "ru-uralsib",
    "521124": "ru-psb",
    "521144": "ru-ceb",
    "521155": "ru-gpb",
    "521159": "ru-mts",
    "521172": "ru-rgs",
    "521178": "ru-alfa",
    "521194": "ru-zenit",
    "521310": "ru-rgs",
    "521324": "ru-tinkoff",
    "521326": "ru-smp",
    "521330": "ru-otp",
    "521374": "ru-rosbank",
    "521379": "ru-uralsib",
    "521381": "ru-uralsib",
    "521508": "ru-rosbank",
    "521528": "ru-mob",
    "521589": "ru-zenit",
    "521658": "ru-uralsib",
    "521779": "ru-uralsib",
    "521801": "ru-mkb",
    "521820": "ru-uralsib",
    "521830": "ru-ceb",
    "521847": "ru-uralsib",
    "521879": "ru-uralsib",
    "522016": "ru-binbank",
    "522022": "ru-uralsib",
    "522042": "ru-roscap",
    "522083": "ru-uralsib",
    "522117": "ru-open",
    "522193": "ru-gpb",
    "522199": "ru-hcf",
    "522212": "ru-uralsib",
    "522223": "ru-avangard",
    "522224": "ru-avangard",
    "522230": "ru-uralsib",
    "522455": "ru-rsb",
    "522456": "ru-zenit",
    "522458": "ru-ucb",
    "522470": "ru-otp",
    "522477": "ru-gpb",
    "522511": "ru-rosbank",
    "522513": "ru-rosbank",
    "522588": "ru-rsb",
    "522592": "ru-cetelem",
    "522598": "ru-vtb24",
    "522705": "ru-rosbank",
    "522711": "ru-rosbank",
    "522826": "ru-gpb",
    "522828": "ru-alfa",
    "522833": "ru-roscap",
    "522851": "ru-zenit",
    "522858": "ru-spb",
    "522860": "ru-sberbank",
    "522862": "ru-roscap",
    "522881": "ru-sovkom",
    "522965": "ru-uralsib",
    "522970": "ru-uralsib",
    "522988": "ru-gpb",
    "522989": "ru-gpb",
    "523281": "ru-uralsib",
    "523436": "ru-roscap",
    "523546": "ru-roscap",
    "523558": "ru-roscap",
    "523559": "ru-roscap",
    "523688": "ru-psb",
    "523701": "ru-alfa",
    "523755": "ru-zenit",
    "523787": "ru-rosbank",
    "524001": "ru-rosbank",
    "524004": "ru-uralsib",
    "524381": "ru-rsb",
    "524390": "ru-uralsib",
    "524448": "ru-rshb",
    "524468": "ru-tinkoff",
    "524477": "ru-vtb",
    "524602": "ru-mts",
    "524614": "ru-rosbank",
    "524620": "ru-citi",
    "524655": "ru-mkb",
    "524665": "ru-ceb",
    "524776": "ru-uralsib",
    "524818": "ru-uralsib",
    "524829": "ru-sberbank",
    "524835": "ru-hcf",
    "524838": "ru-open",
    "524853": "ru-mib",
    "524856": "ru-roscap",
    "524861": "ru-rosbank",
    "524862": "ru-binbank",
    "524943": "ru-mob",
    "525236": "ru-uralsib",
    "525245": "ru-rosbank",
    "525247": "ru-rosbank",
    "525248": "ru-uralsib",
    "525443": "ru-uralsib",
    "525446": "ru-rshb",
    "525494": "ru-psb",
    "525689": "ru-citi",
    "525696": "ru-uralsib",
    "525714": "ru-uralsib",
    "525719": "ru-open",
    "525735": "ru-roscap",
    "525740": "ru-gpb",
    "525741": "ru-rosbank",
    "525744": "ru-binbank",
    "525751": "ru-uralsib",
    "525758": "ru-roscap",
    "525767": "ru-roscap",
    "525768": "ru-roscap",
    "525776": "ru-roscap",
    "525778": "ru-rosbank",
    "525781": "ru-roscap",
    "525784": "ru-gpb",
    "525794": "ru-rosbank",
    "525833": "ru-gpb",
    "525932": "ru-trust",
    "525933": "ru-hcf",
    "526090": "ru-roscap",
    "526280": "ru-psb",
    "526393": "ru-roscap",
    "526462": "ru-rosbank",
    "526469": "ru-vozrozhdenie",
    "526483": "ru-gpb",
    "526532": "ru-vtb",
    "526589": "ru-vtb24",
    "526818": "ru-rgs",
    "526839": "ru-otp",
    "526857": "ru-uralsib",
    "526891": "ru-zenit",
    "526940": "ru-roscap",
    "526981": "ru-rosbank",
    "526984": "ru-rosbank",
    "526992": "ru-uralsib",
    "527001": "ru-uralsib",
    "527023": "ru-mob",
    "527196": "ru-uralsib",
    "527348": "ru-sviaz",
    "527393": "ru-rosbank",
    "527415": "ru-roscap",
    "527444": "ru-gpb",
    "527450": "ru-binbank",
    "527574": "ru-uralsib",
    "527576": "ru-sberbank",
    "527594": "ru-citi",
    "527622": "ru-roscap",
    "527640": "ru-rosbank",
    "527643": "ru-rosbank",
    "527658": "ru-uralsib",
    "527663": "ru-rosbank",
    "527785": "ru-vtb",
    "527792": "ru-mib",
    "527798": "ru-vtb",
    "527883": "ru-vtb24",
    "528014": "ru-uralsib",
    "528015": "ru-rosbank",
    "528016": "ru-roscap",
    "528053": "ru-raiffeisen",
    "528068": "ru-uralsib",
    "528090": "ru-rosbank",
    "528154": "ru-vtb24",
    "528249": "ru-vbrr",
    "528270": "ru-rosbank",
    "528588": "ru-akbars",
    "528593": "ru-roscap",
    "528701": "ru-psb",
    "528704": "ru-uralsib",
    "528808": "ru-raiffeisen",
    "528809": "ru-raiffeisen",
    "528819": "ru-rosbank",
    "528933": "ru-rosbank",
    "529025": "ru-vtb24",
    "529071": "ru-roscap",
    "529100": "ru-rosbank",
    "529101": "ru-rosbank",
    "529160": "ru-psb",
    "529170": "ru-sovkom",
    "529208": "ru-zenit",
    "529247": "ru-rosbank",
    "529260": "ru-open",
    "529273": "ru-uralsib",
    "529278": "ru-gpb",
    "529293": "ru-uralsib",
    "529295": "ru-smp",
    "529426": "ru-roscap",
    "529436": "ru-uralsib",
    "529437": "ru-rosbank",
    "529446": "ru-roscap",
    "529448": "ru-roscap",
    "529450": "ru-uralsib",
    "529461": "ru-uralsib",
    "529488": "ru-gpb",
    "529497": "ru-roscap",
    "529813": "ru-rosbank",
    "529860": "ru-uralsib",
    "529862": "ru-rosbank",
    "529889": "ru-sviaz",
    "529938": "ru-vtb24",
    "529968": "ru-otp",
    "530035": "ru-uralsib",
    "530036": "ru-smp",
    "530078": "ru-roscap",
    "530114": "ru-gpb",
    "530142": "ru-uralsib",
    "530143": "ru-uralsib",
    "530145": "ru-uralsib",
    "530171": "ru-sviaz",
    "530172": "ru-ucb",
    "530183": "ru-open",
    "530184": "ru-vtb24",
    "530215": "ru-rosbank",
    "530229": "ru-vtb",
    "530266": "ru-citi",
    "530279": "ru-uralsib",
    "530403": "ru-open",
    "530412": "ru-rosbank",
    "530413": "ru-atb",
    "530416": "ru-rosbank",
    "530441": "ru-psb",
    "530445": "ru-sovkom",
    "530526": "ru-uralsib",
    "530527": "ru-absolut",
    "530595": "ru-roscap",
    "530758": "ru-uralsib",
    "530800": "ru-rosbank",
    "530827": "ru-alfa",
    "530867": "ru-raiffeisen",
    "530900": "ru-spb",
    "530979": "ru-uralsib",
    "530993": "ru-gpb",
    "531034": "ru-ceb",
    "531038": "ru-uralsib",
    "531073": "ru-uralsib",
    "531207": "ru-uralsib",
    "531222": "ru-rosbank",
    "531233": "ru-vtb24",
    "531236": "ru-ucb",
    "531237": "ru-alfa",
    "531305": "ru-gpb",
    "531310": "ru-sberbank",
    "531315": "ru-ren",
    "531316": "ru-avangard",
    "531318": "ru-trust",
    "531327": "ru-hcf",
    "531332": "ru-sviaz",
    "531344": "ru-ucb",
    "531351": "ru-binbank",
    "531425": "ru-binbank",
    "531428": "ru-otp",
    "531452": "ru-vtb",
    "531534": "ru-psb",
    "531562": "ru-roscap",
    "531652": "ru-roscap",
    "531657": "ru-uralsib",
    "531674": "ru-open",
    "531809": "ru-citi",
    "531853": "ru-binbank",
    "531858": "ru-uralsib",
    "531943": "ru-psb",
    "532058": "ru-rosbank",
    "532130": "ru-open",
    "532184": "ru-mkb",
    "532186": "ru-spb",
    "532301": "ru-open",
    "532310": "ru-roscap",
    "532315": "ru-ceb",
    "532320": "ru-uralsib",
    "532326": "ru-cetelem",
    "532328": "ru-uralsib",
    "532334": "ru-roscap",
    "532336": "ru-rosbank",
    "532356": "ru-vbrr",
    "532436": "ru-roscap",
    "532441": "ru-roscap",
    "532461": "ru-zenit",
    "532463": "ru-zenit",
    "532472": "ru-uralsib",
    "532475": "ru-uralsib",
    "532583": "ru-uralsib",
    "532684": "ru-gpb",
    "532809": "ru-rosbank",
    "532835": "ru-binbank",
    "532917": "ru-roscap",
    "532921": "ru-roscap",
    "532947": "ru-atb",
    "532974": "ru-citi",
    "533151": "ru-binbank",
    "533166": "ru-uralsib",
    "533201": "ru-citi",
    "533205": "ru-sberbank",
    "533206": "ru-avangard",
    "533213": "ru-mts",
    "533214": "ru-zenit",
    "533327": "ru-gpb",
    "533469": "ru-rsb",
    "533594": "ru-raiffeisen",
    "533595": "ru-sovkom",
    "533611": "ru-uralsib",
    "533614": "ru-binbank",
    "533616": "ru-raiffeisen",
    "533668": "ru-roscap",
    "533669": "ru-sberbank",
    "533681": "ru-citi",
    "533684": "ru-rosbank",
    "533685": "ru-otp",
    "533689": "ru-rsb",
    "533725": "ru-roscap",
    "533736": "ru-mts",
    "533794": "ru-roscap",
    "533795": "ru-rosbank",
    "533925": "ru-rosbank",
    "533954": "ru-zenit",
    "534128": "ru-uralsib",
    "534130": "ru-gpb",
    "534132": "ru-uralsib",
    "534134": "ru-roscap",
    "534136": "ru-uralsib",
    "534148": "ru-uralsib",
    "534156": "ru-uralsib",
    "534162": "ru-rshb",
    "534171": "ru-gpb",
    "534183": "ru-roscap",
    "534194": "ru-uralsib",
    "534196": "ru-gpb",
    "534251": "ru-rosbank",
    "534254": "ru-vozrozhdenie",
    "534266": "ru-rsb",
    "534293": "ru-rosbank",
    "534296": "ru-uralsib",
    "534297": "ru-rosbank",
    "534449": "ru-rosbank",
    "534462": "ru-psb",
    "534469": "ru-open",
    "534493": "ru-vtb",
    "534495": "ru-psb",
    "534577": "ru-rosbank",
    "534601": "ru-vtb",
    "534645": "ru-rosbank",
    "534661": "ru-open",
    "534669": "ru-open",
    "534921": "ru-rosbank",
    "534927": "ru-uralsib",
    "535023": "ru-psb",
    "535027": "ru-open",
    "535058": "ru-psb",
    "535082": "ru-vtb24",
    "535108": "ru-open",
    "535946": "ru-avangard",
    "536095": "ru-open",
    "536114": "ru-trust",
    "536176": "ru-uralsib",
    "536186": "ru-uralsib",
    "536370": "ru-roscap",
    "536392": "ru-raiffeisen",
    "536400": "ru-uralsib",
    "536409": "ru-rshb",
    "536443": "ru-roscap",
    "536454": "ru-uralsib",
    "536464": "ru-roscap",
    "536466": "ru-mib",
    "536500": "ru-hcf",
    "536511": "ru-hcf",
    "536554": "ru-roscap",
    "536569": "ru-rosbank",
    "536672": "ru-mts",
    "536829": "ru-vtb24",
    "536960": "ru-uralsib",
    "536995": "ru-gpb",
    "537627": "ru-gpb",
    "537643": "ru-alfa",
    "537705": "ru-uralsib",
    "537709": "ru-uralsib",
    "537713": "ru-roscap",
    "537715": "ru-uralsib",
    "537730": "ru-uralsib",
    "537734": "ru-uralsib",
    "537737": "ru-roscap",
    "537770": "ru-jugra",
    "537965": "ru-raiffeisen",
    "538010": "ru-rshb",
    "538395": "ru-roscap",
    "538397": "ru-uralsib",
    "538800": "ru-uralsib",
    "538828": "ru-roscap",
    "538998": "ru-uralsib",
    "539036": "ru-binbank",
    "539037": "ru-uralsib",
    "539102": "ru-rosbank",
    "539114": "ru-ceb",
    "539600": "ru-binbank",
    "539607": "ru-zenit",
    "539613": "ru-zenit",
    "539617": "ru-uralsib",
    "539621": "ru-psb",
    "539673": "ru-avangard",
    "539704": "ru-psb",
    "539710": "ru-uralsib",
    "539721": "ru-binbank",
    "539726": "ru-citi",
    "539839": "ru-gpb",
    "539850": "ru-zenit",
    "539852": "ru-uralsib",
    "539861": "ru-psb",
    "539864": "ru-roscap",
    "539865": "ru-roscap",
    "539869": "ru-roscap",
    "539898": "ru-zenit",
    "540014": "ru-roscap",
    "540035": "ru-rosbank",
    "540053": "ru-rosbank",
    "540111": "ru-uralsib",
    "540149": "ru-rosbank",
    "540169": "ru-vtb24",
    "540194": "ru-binbank",
    "540229": "ru-rosbank",
    "540308": "ru-roscap",
    "540400": "ru-uralsib",
    "540455": "ru-binbank",
    "540602": "ru-roscap",
    "540616": "ru-mts",
    "540642": "ru-binbank",
    "540664": "ru-gpb",
    "540674": "ru-gpb",
    "540687": "ru-uralsib",
    "540708": "ru-uralsib",
    "540768": "ru-uralsib",
    "540788": "ru-citi",
    "540794": "ru-uralsib",
    "540834": "ru-uralsib",
    "540923": "ru-uralsib",
    "540927": "ru-roscap",
    "541031": "ru-rosbank",
    "541152": "ru-binbank",
    "541269": "ru-psb",
    "541279": "ru-uralsib",
    "541294": "ru-binbank",
    "541354": "ru-uralsib",
    "541435": "ru-mts",
    "541450": "ru-ceb",
    "541456": "ru-uralsib",
    "541503": "ru-psb",
    "541600": "ru-spb",
    "541632": "ru-uralsib",
    "541754": "ru-zenit",
    "541778": "ru-zenit",
    "541789": "ru-uralsib",
    "541895": "ru-roscap",
    "541903": "ru-rosbank",
    "541904": "ru-rosbank",
    "541920": "ru-uralsib",
    "541975": "ru-roscap",
    "541983": "ru-uralsib",
    "541997": "ru-absolut",
    "542033": "ru-mkb",
    "542048": "ru-rsb",
    "542058": "ru-rosbank",
    "542112": "ru-uralsib",
    "542246": "ru-uralsib",
    "542247": "ru-roscap",
    "542255": "ru-gpb",
    "542289": "ru-open",
    "542340": "ru-psb",
    "542475": "ru-open",
    "542501": "ru-open",
    "542504": "ru-binbank",
    "542577": "ru-sberbank",
    "542581": "ru-roscap",
    "542600": "ru-roscap",
    "542654": "ru-atb",
    "542751": "ru-vbrr",
    "542772": "ru-raiffeisen",
    "542932": "ru-roscap",
    "542963": "ru-rosbank",
    "543015": "ru-uralsib",
    "543019": "ru-open",
    "543038": "ru-binbank",
    "543101": "ru-spb",
    "543127": "ru-rosbank",
    "543211": "ru-mkb",
    "543236": "ru-zenit",
    "543354": "ru-uralsib",
    "543366": "ru-binbank",
    "543367": "ru-roscap",
    "543435": "ru-uralsib",
    "543618": "ru-roscap",
    "543664": "ru-roscap",
    "543672": "ru-gpb",
    "543724": "ru-gpb",
    "543728": "ru-roscap",
    "543749": "ru-uralsib",
    "543762": "ru-gpb",
    "543763": "ru-sberbank",
    "543807": "ru-uralsib",
    "543874": "ru-psb",
    "543942": "ru-sberbank",
    "544025": "ru-zenit",
    "544026": "ru-gpb",
    "544069": "ru-roscap",
    "544092": "ru-open",
    "544117": "ru-binbank",
    "544123": "ru-mts",
    "544175": "ru-roscap",
    "544195": "ru-uralsib",
    "544212": "ru-roscap",
    "544218": "ru-open",
    "544237": "ru-raiffeisen",
    "544263": "ru-rosbank",
    "544270": "ru-roscap",
    "544272": "ru-uralsib",
    "544326": "ru-uralsib",
    "544331": "ru-sberbank",
    "544343": "ru-open",
    "544367": "ru-uralsib",
    "544369": "ru-uralsib",
    "544417": "ru-uralsib",
    "544429": "ru-rsb",
    "544439": "ru-uralsib",
    "544462": "ru-uralsib",
    "544491": "ru-rosbank",
    "544499": "ru-open",
    "544552": "ru-uralsib",
    "544561": "ru-gpb",
    "544573": "ru-open",
    "544754": "ru-roscap",
    "544800": "ru-psb",
    "544852": "ru-zenit",
    "544885": "ru-roscap",
    "544886": "ru-atb",
    "544905": "ru-rosbank",
    "544962": "ru-open",
    "545037": "ru-sberbank",
    "545101": "ru-gpb",
    "545115": "ru-raiffeisen",
    "545117": "ru-zenit",
    "545151": "ru-rosbank",
    "545152": "ru-sberbank",
    "545160": "ru-rsb",
    "545182": "ru-citi",
    "545200": "ru-uralsib",
    "545204": "ru-rosbank",
    "545214": "ru-otp",
    "545224": "ru-vtb24",
    "545266": "ru-uralsib",
    "545272": "ru-uralsib",
    "545350": "ru-psb",
    "545362": "ru-roscap",
    "545364": "ru-rosbank",
    "545379": "ru-rosbank",
    "545472": "ru-uralsib",
    "545490": "ru-roscap",
    "545511": "ru-roscap",
    "545529": "ru-rosbank",
    "545539": "ru-uralsib",
    "545540": "ru-uralsib",
    "545547": "ru-rosbank",
    "545572": "ru-rosbank",
    "545575": "ru-rosbank",
    "545592": "ru-uralsib",
    "545638": "ru-uralsib",
    "545655": "ru-uralsib",
    "545701": "ru-uralsib",
    "545742": "ru-uralsib",
    "545744": "ru-uralsib",
    "545761": "ru-uralsib",
    "545762": "ru-hcf",
    "545778": "ru-uralsib",
    "545789": "ru-uralsib",
    "545792": "ru-uralsib",
    "545799": "ru-uralsib",
    "545807": "ru-gpb",
    "545817": "ru-uralsib",
    "545840": "ru-sberbank",
    "545868": "ru-uralsib",
    "545896": "ru-zenit",
    "545916": "ru-uralsib",
    "545929": "ru-zenit",
    "546031": "ru-sberbank",
    "546339": "ru-uralsib",
    "546340": "ru-uralsib",
    "546468": "ru-uralsib",
    "546551": "ru-uralsib",
    "546593": "ru-uralsib",
    "546662": "ru-uralsib",
    "546679": "ru-uralsib",
    "546718": "ru-uralsib",
    "546766": "ru-psb",
    "546842": "ru-uralsib",
    "546844": "ru-uralsib",
    "546850": "ru-sovkom",
    "546901": "ru-sberbank",
    "546902": "ru-sberbank",
    "546903": "ru-sberbank",
    "546904": "ru-sberbank",
    "546905": "ru-sberbank",
    "546906": "ru-sberbank",
    "546907": "ru-sberbank",
    "546908": "ru-sberbank",
    "546909": "ru-sberbank",
    "546910": "ru-sberbank",
    "546911": "ru-sberbank",
    "546912": "ru-sberbank",
    "546913": "ru-sberbank",
    "546916": "ru-sberbank",
    "546917": "ru-sberbank",
    "546918": "ru-sberbank",
    "546920": "ru-sberbank",
    "546922": "ru-sberbank",
    "546925": "ru-sberbank",
    "546926": "ru-sberbank",
    "546927": "ru-sberbank",
    "546928": "ru-sberbank",
    "546929": "ru-sberbank",
    "546930": "ru-sberbank",
    "546931": "ru-sberbank",
    "546932": "ru-sberbank",
    "546933": "ru-sberbank",
    "546935": "ru-sberbank",
    "546936": "ru-sberbank",
    "546937": "ru-sberbank",
    "546938": "ru-sberbank",
    "546939": "ru-sberbank",
    "546940": "ru-sberbank",
    "546941": "ru-sberbank",
    "546942": "ru-sberbank",
    "546943": "ru-sberbank",
    "546944": "ru-sberbank",
    "546945": "ru-sberbank",
    "546946": "ru-sberbank",
    "546947": "ru-sberbank",
    "546948": "ru-sberbank",
    "546949": "ru-sberbank",
    "546950": "ru-sberbank",
    "546951": "ru-sberbank",
    "546952": "ru-sberbank",
    "546953": "ru-sberbank",
    "546954": "ru-sberbank",
    "546955": "ru-sberbank",
    "546956": "ru-sberbank",
    "546959": "ru-sberbank",
    "546960": "ru-sberbank",
    "546961": "ru-sberbank",
    "546962": "ru-sberbank",
    "546963": "ru-sberbank",
    "546964": "ru-sberbank",
    "546966": "ru-sberbank",
    "546967": "ru-sberbank",
    "546968": "ru-sberbank",
    "546969": "ru-sberbank",
    "546970": "ru-sberbank",
    "546972": "ru-sberbank",
    "546974": "ru-sberbank",
    "546975": "ru-sberbank",
    "546976": "ru-sberbank",
    "546977": "ru-sberbank",
    "546996": "ru-roscap",
    "546998": "ru-sberbank",
    "546999": "ru-sberbank",
    "547070": "ru-rosbank",
    "547151": "ru-roscap",
    "547228": "ru-uralsib",
    "547243": "ru-binbank",
    "547253": "ru-uralsib",
    "547257": "ru-uralsib",
    "547258": "ru-uralsib",
    "547262": "ru-rsb",
    "547298": "ru-uralsib",
    "547300": "ru-uralsib",
    "547306": "ru-uralsib",
    "547314": "ru-uralsib",
    "547319": "ru-uralsib",
    "547324": "ru-uralsib",
    "547329": "ru-psb",
    "547348": "ru-gpb",
    "547377": "ru-binbank",
    "547421": "ru-uralsib",
    "547447": "ru-uralsib",
    "547449": "ru-open",
    "547470": "ru-rosbank",
    "547490": "ru-citi",
    "547547": "ru-uralsib",
    "547550": "ru-ceb",
    "547563": "ru-uralsib",
    "547576": "ru-uralsib",
    "547580": "ru-uralsib",
    "547601": "ru-rshb",
    "547610": "ru-roscap",
    "547613": "ru-raiffeisen",
    "547616": "ru-open",
    "547665": "ru-uralsib",
    "547681": "ru-rosbank",
    "547699": "ru-uralsib",
    "547705": "ru-rosbank",
    "547728": "ru-ucb",
    "547743": "ru-vozrozhdenie",
    "547761": "ru-uralsib",
    "547796": "ru-uralsib",
    "547801": "ru-binbank",
    "547851": "ru-uralsib",
    "547859": "ru-roscap",
    "547901": "ru-sberbank",
    "547902": "ru-sberbank",
    "547905": "ru-sberbank",
    "547906": "ru-sberbank",
    "547907": "ru-sberbank",
    "547910": "ru-sberbank",
    "547911": "ru-sberbank",
    "547912": "ru-sberbank",
    "547913": "ru-sberbank",
    "547920": "ru-sberbank",
    "547922": "ru-sberbank",
    "547925": "ru-sberbank",
    "547926": "ru-sberbank",
    "547927": "ru-sberbank",
    "547928": "ru-sberbank",
    "547930": "ru-sberbank",
    "547931": "ru-sberbank",
    "547932": "ru-sberbank",
    "547935": "ru-sberbank",
    "547936": "ru-sberbank",
    "547937": "ru-sberbank",
    "547938": "ru-sberbank",
    "547940": "ru-sberbank",
    "547942": "ru-sberbank",
    "547943": "ru-sberbank",
    "547944": "ru-sberbank",
    "547945": "ru-sberbank",
    "547947": "ru-sberbank",
    "547948": "ru-sberbank",
    "547949": "ru-sberbank",
    "547950": "ru-sberbank",
    "547951": "ru-sberbank",
    "547952": "ru-sberbank",
    "547953": "ru-sberbank",
    "547954": "ru-sberbank",
    "547955": "ru-sberbank",
    "547956": "ru-sberbank",
    "547959": "ru-sberbank",
    "547960": "ru-sberbank",
    "547961": "ru-sberbank",
    "547962": "ru-sberbank",
    "547964": "ru-sberbank",
    "547966": "ru-sberbank",
    "547969": "ru-sberbank",
    "547972": "ru-sberbank",
    "547976": "ru-sberbank",
    "547998": "ru-sberbank",
    "547999": "ru-sberbank",
    "548027": "ru-gpb",
    "548035": "ru-mts",
    "548062": "ru-roscap",
    "548072": "ru-roscap",
    "548073": "ru-roscap",
    "548092": "ru-binbank",
    "548137": "ru-uralsib",
    "548138": "ru-uralsib",
    "548164": "ru-raiffeisen",
    "548172": "ru-psb",
    "548173": "ru-roscap",
    "548177": "ru-uralsib",
    "548186": "ru-roscap",
    "548204": "ru-roscap",
    "548205": "ru-uralsib",
    "548214": "ru-uralsib",
    "548225": "ru-rosbank",
    "548235": "ru-rsb",
    "548246": "ru-uralsib",
    "548249": "ru-uralsib",
    "548265": "ru-binbank",
    "548266": "ru-uralsib",
    "548268": "ru-uralsib",
    "548269": "ru-psb",
    "548270": "ru-binbank",
    "548272": "ru-uralsib",
    "548291": "ru-uralsib",
    "548294": "ru-uralsib",
    "548301": "ru-roscap",
    "548308": "ru-vozrozhdenie",
    "548309": "ru-vozrozhdenie",
    "548326": "ru-uralsib",
    "548328": "ru-roscap",
    "548335": "ru-roscap",
    "548351": "ru-mib",
    "548386": "ru-skb",
    "548387": "ru-tinkoff",
    "548393": "ru-uralsib",
    "548401": "ru-sberbank",
    "548402": "ru-sberbank",
    "548403": "ru-sberbank",
    "548404": "ru-roscap",
    "548405": "ru-sberbank",
    "548406": "ru-sberbank",
    "548407": "ru-sberbank",
    "548409": "ru-rosbank",
    "548410": "ru-sberbank",
    "548411": "ru-sberbank",
    "548412": "ru-sberbank",
    "548413": "ru-sberbank",
    "548416": "ru-sberbank",
    "548420": "ru-sberbank",
    "548422": "ru-sberbank",
    "548425": "ru-sberbank",
    "548426": "ru-sberbank",
    "548427": "ru-sberbank",
    "548428": "ru-sberbank",
    "548429": "ru-psb",
    "548430": "ru-sberbank",
    "548431": "ru-sberbank",
    "548432": "ru-sberbank",
    "548435": "ru-sberbank",
    "548436": "ru-sberbank",
    "548438": "ru-sberbank",
    "548440": "ru-sberbank",
    "548442": "ru-sberbank",
    "548443": "ru-sberbank",
    "548444": "ru-sberbank",
    "548445": "ru-sberbank",
    "548447": "ru-sberbank",
    "548448": "ru-sberbank",
    "548449": "ru-sberbank",
    "548450": "ru-sberbank",
    "548451": "ru-sberbank",
    "548452": "ru-sberbank",
    "548453": "ru-uralsib",
    "548454": "ru-sberbank",
    "548455": "ru-sberbank",
    "548456": "ru-sberbank",
    "548459": "ru-sberbank",
    "548460": "ru-sberbank",
    "548461": "ru-sberbank",
    "548462": "ru-sberbank",
    "548463": "ru-sberbank",
    "548464": "ru-sberbank",
    "548466": "ru-sberbank",
    "548468": "ru-sberbank",
    "548469": "ru-sberbank",
    "548470": "ru-sberbank",
    "548472": "ru-sberbank",
    "548476": "ru-sberbank",
    "548477": "ru-sberbank",
    "548484": "ru-open",
    "548490": "ru-roscap",
    "548498": "ru-sberbank",
    "548499": "ru-sberbank",
    "548504": "ru-uralsib",
    "548511": "ru-uralsib",
    "548554": "ru-roscap",
    "548571": "ru-uralsib",
    "548588": "ru-uralsib",
    "548601": "ru-alfa",
    "548655": "ru-alfa",
    "548673": "ru-alfa",
    "548674": "ru-alfa",
    "548704": "ru-uralsib",
    "548706": "ru-uralsib",
    "548713": "ru-uralsib",
    "548745": "ru-hcf",
    "548752": "ru-uralsib",
    "548753": "ru-roscap",
    "548754": "ru-roscap",
    "548755": "ru-roscap",
    "548767": "ru-zenit",
    "548768": "ru-zenit",
    "548771": "ru-zenit",
    "548777": "ru-roscap",
    "548783": "ru-roscap",
    "548784": "ru-roscap",
    "548785": "ru-roscap",
    "548791": "ru-roscap",
    "548796": "ru-rosbank",
    "548899": "ru-uralsib",
    "548921": "ru-rosbank",
    "548934": "ru-uralsib",
    "548996": "ru-uralsib",
    "548997": "ru-uralsib",
    "548999": "ru-gpb",
    "549000": "ru-gpb",
    "549014": "ru-uralsib",
    "549015": "ru-uralsib",
    "549024": "ru-open",
    "549025": "ru-open",
    "549068": "ru-rosbank",
    "549071": "ru-skb",
    "549074": "ru-roscap",
    "549081": "ru-rosbank",
    "549098": "ru-gpb",
    "549223": "ru-vtb24",
    "549229": "ru-uralsib",
    "549251": "ru-uralsib",
    "549255": "ru-uralsib",
    "549256": "ru-uralsib",
    "549257": "ru-uralsib",
    "549258": "ru-roscap",
    "549264": "ru-uralsib",
    "549268": "ru-rosbank",
    "549270": "ru-vtb24",
    "549274": "ru-uralsib",
    "549283": "ru-uralsib",
    "549285": "ru-uralsib",
    "549302": "ru-ucb",
    "549303": "ru-uralsib",
    "549306": "ru-uralsib",
    "549307": "ru-uralsib",
    "549314": "ru-roscap",
    "549347": "ru-uralsib",
    "549349": "ru-binbank",
    "549376": "ru-spb",
    "549401": "ru-uralsib",
    "549411": "ru-zenit",
    "549424": "ru-uralsib",
    "549425": "ru-psb",
    "549439": "ru-psb",
    "549447": "ru-uralsib",
    "549454": "ru-uralsib",
    "549470": "ru-roscap",
    "549475": "ru-rosbank",
    "549478": "ru-rosbank",
    "549483": "ru-uralsib",
    "549512": "ru-binbank",
    "549522": "ru-uralsib",
    "549523": "ru-binbank",
    "549524": "ru-psb",
    "549574": "ru-roscap",
    "549597": "ru-roscap",
    "549600": "ru-gpb",
    "549614": "ru-gpb",
    "549647": "ru-uralsib",
    "549654": "ru-uralsib",
    "549715": "ru-rshb",
    "549716": "ru-uralsib",
    "549822": "ru-rosbank",
    "549829": "ru-rosbank",
    "549830": "ru-uralsib",
    "549848": "ru-open",
    "549855": "ru-rosbank",
    "549865": "ru-rosbank",
    "549870": "ru-mib",
    "549873": "ru-uralsib",
    "549881": "ru-uralsib",
    "549882": "ru-zenit",
    "549887": "ru-roscap",
    "549888": "ru-zenit",
    "549935": "ru-roscap",
    "549965": "ru-jugra",
    "549966": "ru-jugra",
    "549969": "ru-roscap",
    "550006": "ru-uralsib",
    "550025": "ru-binbank",
    "550064": "ru-rosbank",
    "550070": "ru-roscap",
    "550143": "ru-rosbank",
    "550165": "ru-rosbank",
    "550210": "ru-rosbank",
    "550219": "ru-zenit",
    "550235": "ru-roscap",
    "550251": "ru-sberbank",
    "550446": "ru-open",
    "550467": "ru-rosbank",
    "550468": "ru-uralsib",
    "550484": "ru-raiffeisen",
    "550547": "ru-rosbank",
    "550583": "ru-mts",
    "551950": "ru-roscap",
    "551960": "ru-tinkoff",
    "551979": "ru-rosbank",
    "551985": "ru-rosbank",
    "551989": "ru-rosbank",
    "551993": "ru-rosbank",
    "551996": "ru-rosbank",
    "552055": "ru-gpb",
    "552151": "ru-rosbank",
    "552175": "ru-alfa",
    "552186": "ru-alfa",
    "552549": "ru-roscap",
    "552573": "ru-citi",
    "552574": "ru-citi",
    "552603": "ru-roscap",
    "552613": "ru-reb",
    "552618": "ru-mts",
    "552680": "ru-mkb",
    "552702": "ru-gpb",
    "552708": "ru-open",
    "552729": "ru-ren",
    "552845": "ru-uralsib",
    "552866": "ru-binbank",
    "552958": "ru-akbars",
    "553000": "ru-uralsib",
    "553069": "ru-rosbank",
    "553128": "ru-rosbank",
    "553420": "ru-tinkoff",
    "553496": "ru-raiffeisen",
    "553581": "ru-uralsib",
    "553584": "ru-uralsib",
    "553690": "ru-rosbank",
    "553909": "ru-rosbank",
    "553964": "ru-rosbank",
    "554279": "ru-psb",
    "554317": "ru-rosbank",
    "554324": "ru-rosbank",
    "554326": "ru-rosbank",
    "554364": "ru-roscap",
    "554365": "ru-roscap",
    "554372": "ru-binbank",
    "554373": "ru-binbank",
    "554384": "ru-vtb",
    "554386": "ru-vtb24",
    "554393": "ru-vtb24",
    "554524": "ru-smp",
    "554546": "ru-uralsib",
    "554549": "ru-rosbank",
    "554562": "ru-uralsib",
    "554581": "ru-uralsib",
    "554607": "ru-uralsib",
    "554615": "ru-uralsib",
    "554651": "ru-uralsib",
    "554713": "ru-rosbank",
    "554733": "ru-rosbank",
    "554759": "ru-psb",
    "554761": "ru-rosbank",
    "554780": "ru-zenit",
    "554781": "ru-psb",
    "554782": "ru-rosbank",
    "554844": "ru-rosbank",
    "555057": "ru-citi",
    "555058": "ru-citi",
    "555079": "ru-rosbank",
    "555156": "ru-alfa",
    "555921": "ru-alfa",
    "555928": "ru-alfa",
    "555933": "ru-alfa",
    "555947": "ru-alfa",
    "555949": "ru-alfa",
    "555957": "ru-alfa",
    "556052": "ru-gpb",
    "556056": "ru-sviaz",
    "556057": "ru-uralsib",
    "557029": "ru-zenit",
    "557030": "ru-zenit",
    "557036": "ru-uralsib",
    "557056": "ru-ceb",
    "557057": "ru-ceb",
    "557071": "ru-mib",
    "557072": "ru-mib",
    "557073": "ru-binbank",
    "557106": "ru-uralsib",
    "557107": "ru-uralsib",
    "557646": "ru-rosbank",
    "557724": "ru-rosbank",
    "557734": "ru-hcf",
    "557737": "ru-ren",
    "557808": "ru-trust",
    "557809": "ru-trust",
    "557841": "ru-rosbank",
    "557842": "ru-rosbank",
    "557848": "ru-rosbank",
    "557849": "ru-rosbank",
    "557942": "ru-zenit",
    "557944": "ru-zenit",
    "557946": "ru-open",
    "557948": "ru-open",
    "557959": "ru-roscap",
    "557960": "ru-zenit",
    "557969": "ru-roscap",
    "557970": "ru-uralsib",
    "557976": "ru-binbank",
    "557977": "ru-rosbank",
    "557980": "ru-rosbank",
    "557981": "ru-psb",
    "557986": "ru-mib",
    "558254": "ru-psb",
    "558258": "ru-rosbank",
    "558268": "ru-psb",
    "558273": "ru-raiffeisen",
    "558274": "ru-rosbank",
    "558275": "ru-uralsib",
    "558296": "ru-rosbank",
    "558298": "ru-trust",
    "558326": "ru-uralsib",
    "558334": "ru-alfa",
    "558354": "ru-uralsib",
    "558355": "ru-gpb",
    "558356": "ru-uralsib",
    "558374": "ru-uralsib",
    "558385": "ru-jugra",
    "558391": "ru-uralsib",
    "558416": "ru-rosbank",
    "558462": "ru-mib",
    "558463": "ru-uralsib",
    "558480": "ru-rosbank",
    "558488": "ru-roscap",
    "558504": "ru-rosbank",
    "558516": "ru-psb",
    "558518": "ru-vtb24",
    "558535": "ru-avangard",
    "558536": "ru-raiffeisen",
    "558605": "ru-rosbank",
    "558620": "ru-open",
    "558622": "ru-raiffeisen",
    "558625": "ru-binbank",
    "558636": "ru-binbank",
    "558651": "ru-uralsib",
    "558664": "ru-uralsib",
    "558672": "ru-psb",
    "558673": "ru-rosbank",
    "558690": "ru-uralsib",
    "558696": "ru-zenit",
    "558713": "ru-vbrr",
    "559066": "ru-vtb",
    "559255": "ru-gpb",
    "559264": "ru-open",
    "559448": "ru-rosbank",
    "559456": "ru-mib",
    "559476": "ru-rosbank",
    "559488": "ru-rosbank",
    "559596": "ru-rosbank",
    "559598": "ru-rosbank",
    "559615": "ru-rosbank",
    "559645": "ru-zenit",
    "559811": "ru-rosbank",
    "559813": "ru-ceb",
    "559814": "ru-rosbank",
    "559899": "ru-rosbank",
    "559901": "ru-sberbank",
    "559969": "ru-rosbank",
    "559992": "ru-gpb",
    "605461": "ru-sberbank",
    "605462": "ru-uralsib",
    "627119": "ru-alfa",
    "639002": "ru-sberbank",
    "670505": "ru-roscap",
    "670508": "ru-psb",
    "670512": "ru-zenit",
    "670518": "ru-open",
    "670521": "ru-roscap",
    "670550": "ru-rosbank",
    "670555": "ru-atb",
    "670556": "ru-roscap",
    "670557": "ru-rosbank",
    "670560": "ru-rosbank",
    "670567": "ru-rosbank",
    "670575": "ru-rosbank",
    "670583": "ru-psb",
    "670587": "ru-open",
    "670594": "ru-roscap",
    "670601": "ru-roscap",
    "670602": "ru-roscap",
    "670605": "ru-roscap",
    "670607": "ru-rosbank",
    "670611": "ru-psb",
    "670614": "ru-zenit",
    "670623": "ru-roscap",
    "670624": "ru-roscap",
    "670625": "ru-roscap",
    "670628": "ru-roscap",
    "670633": "ru-roscap",
    "670637": "ru-skb",
    "670638": "ru-roscap",
    "670646": "ru-rosbank",
    "670647": "ru-rosbank",
    "670652": "ru-rosbank",
    "670654": "ru-psb",
    "670661": "ru-psb",
    "670663": "ru-roscap",
    "670671": "ru-roscap",
    "670674": "ru-rosbank",
    "670676": "ru-roscap",
    "670694": "ru-rosbank",
    "670818": "ru-roscap",
    "670819": "ru-rosbank",
    "670828": "ru-rosbank",
    "670846": "ru-roscap",
    "670849": "ru-rosbank",
    "670851": "ru-rosbank",
    "670852": "ru-mob",
    "670869": "ru-rosbank",
    "670893": "ru-roscap",
    "670981": "ru-roscap",
    "670992": "ru-uralsib",
    "670995": "ru-uralsib",
    "670996": "ru-rosbank",
    "671106": "ru-uralsib",
    "671109": "ru-vtb",
    "671111": "ru-vtb",
    "671122": "ru-gpb",
    "671123": "ru-zenit",
    "671136": "ru-uralsib",
    "671137": "ru-rosbank",
    "671148": "ru-vtb",
    "671172": "ru-vtb",
    "676195": "ru-sberbank",
    "676196": "ru-sberbank",
    "676230": "ru-alfa",
    "676231": "ru-open",
    "676245": "ru-jugra",
    "676280": "ru-sberbank",
    "676333": "ru-raiffeisen",
    "676347": "ru-rosbank",
    "676371": "ru-roscap",
    "676397": "ru-vozrozhdenie",
    "676428": "ru-binbank",
    "676444": "ru-psb",
    "676445": "ru-roscap",
    "676450": "ru-rosbank",
    "676454": "ru-gpb",
    "676463": "ru-avangard",
    "676501": "ru-rosbank",
    "676523": "ru-zenit",
    "676528": "ru-uralsib",
    "676533": "ru-rosbank",
    "676565": "ru-rsb",
    "676586": "ru-ceb",
    "676625": "ru-raiffeisen",
    "676642": "ru-trust",
    "676664": "ru-rosbank",
    "676668": "ru-rosbank",
    "676672": "ru-ucb",
    "676697": "ru-open",
    "676800": "ru-vtb24",
    "676802": "ru-vtb24",
    "676803": "ru-vtb24",
    "676805": "ru-vtb24",
    "676845": "ru-vtb24",
    "676851": "ru-vtb24",
    "676859": "ru-roscap",
    "676860": "ru-vtb24",
    "676861": "ru-vtb24",
    "676881": "ru-reb",
    "676884": "ru-mts",
    "676888": "ru-vtb24",
    "676893": "ru-vtb24",
    "676896": "ru-vtb24",
    "676934": "ru-binbank",
    "676939": "ru-vtb24",
    "676946": "ru-rosbank",
    "676947": "ru-binbank",
    "676967": "ru-mkb",
    "676974": "ru-vtb24",
    "676979": "ru-roscap",
    "676984": "ru-uralsib",
    "676989": "ru-roscap",
    "676990": "ru-gpb",
    "676998": "ru-binbank",
    "677018": "ru-roscap",
    "677040": "ru-ren",
    "677058": "ru-binbank",
    "677076": "ru-rosbank",
    "677084": "ru-zenit",
    "677088": "ru-akbars",
    "677110": "ru-gpb",
    "677112": "ru-rosbank",
    "677128": "ru-sberbank",
    "677136": "ru-roscap",
    "677146": "ru-roscap",
    "677151": "ru-vtb",
    "677175": "ru-smp",
    "677189": "ru-rgs",
    "677194": "ru-vtb24",
    "677222": "ru-rosbank",
    "677223": "ru-roscap",
    "677228": "ru-roscap",
    "677229": "ru-roscap",
    "677234": "ru-rosbank",
    "677235": "ru-rosbank",
    "677240": "ru-rosbank",
    "677245": "ru-rosbank",
    "677257": "ru-roscap",
    "677260": "ru-zenit",
    "677261": "ru-uralsib",
    "677263": "ru-psb",
    "677267": "ru-roscap",
    "677271": "ru-vtb24",
    "677272": "ru-roscap",
    "677275": "ru-binbank",
    "677276": "ru-binbank",
    "677285": "ru-roscap",
    "677288": "ru-roscap",
    "677289": "ru-roscap",
    "677302": "ru-roscap",
    "677303": "ru-rosbank",
    "677305": "ru-roscap",
    "677309": "ru-rosbank",
    "677314": "ru-rosbank",
    "677315": "ru-rosbank",
    "677318": "ru-roscap",
    "677319": "ru-roscap",
    "677327": "ru-zenit",
    "677329": "ru-zenit",
    "677335": "ru-roscap",
    "677336": "ru-roscap",
    "677338": "ru-roscap",
    "677342": "ru-rosbank",
    "677343": "ru-rosbank",
    "677345": "ru-rosbank",
    "677349": "ru-roscap",
    "677358": "ru-binbank",
    "677359": "ru-rosbank",
    "677360": "ru-rosbank",
    "677363": "ru-trust",
    "677366": "ru-smp",
    "677367": "ru-sviaz",
    "677370": "ru-psb",
    "677371": "ru-psb",
    "677372": "ru-psb",
    "677374": "ru-roscap",
    "677375": "ru-rosbank",
    "677376": "ru-rosbank",
    "677380": "ru-zenit",
    "677382": "ru-uralsib",
    "677388": "ru-zenit",
    "677389": "ru-zenit",
    "677391": "ru-rsb",
    "677401": "ru-rosbank",
    "677405": "ru-psb",
    "677406": "ru-binbank",
    "677408": "ru-uralsib",
    "677424": "ru-roscap",
    "677428": "ru-roscap",
    "677430": "ru-uralsib",
    "677431": "ru-uralsib",
    "677444": "ru-roscap",
    "677456": "ru-roscap",
    "677457": "ru-roscap",
    "677458": "ru-zenit",
    "677459": "ru-zenit",
    "677461": "ru-psb",
    "677462": "ru-psb",
    "677466": "ru-roscap",
    "677467": "ru-rosbank",
    "677468": "ru-rosbank",
    "677470": "ru-vtb24",
    "677471": "ru-vtb24",
    "677484": "ru-gpb",
    "677493": "ru-zenit",
    "677496": "ru-mob",
    "677497": "ru-zenit",
    "677501": "ru-roscap",
    "677505": "ru-binbank",
    "677506": "ru-psb",
    "677507": "ru-rosbank",
    "677510": "ru-zenit",
    "677514": "ru-zenit",
    "677518": "ru-smp",
    "677578": "ru-roscap",
    "677579": "ru-rosbank",
    "677585": "ru-gpb",
    "677597": "ru-rosbank",
    "677600": "ru-roscap",
    "677611": "ru-roscap",
    "677617": "ru-rosbank",
    "677646": "ru-roscap",
    "677649": "ru-vbrr",
    "677655": "ru-roscap",
    "677656": "ru-roscap",
    "677659": "ru-zenit",
    "677660": "ru-zenit",
    "677684": "ru-mts",
    "677688": "ru-roscap",
    "677694": "ru-roscap",
    "677714": "ru-roscap",
    "677721": "ru-rosbank",
    "679074": "ru-uralsib"
  }
  if (typeof exports !== 'undefined') {
    exports.CardInfo._banks = banks
    exports.CardInfo._prefixes = prefixes
  } else if (typeof window !== 'undefined') {
    window.CardInfo._banks = banks
    window.CardInfo._prefixes = prefixes
  }
}())

/*
$(function() {
	$(document).on('hover focus', '[data-mask]', function(e) {
		var o = $(this);
		o.mask(o.data('mask')).removeAttr('data-mask');
	});
});
*/

$mx.observe('[data-mask]', function(o) {
// 	$.mask.definitions['#'] = '[0-9]';
	
	function cb() {
		var mask = o.data('mask');
		o.mask(mask).removeAttr('data-mask');
	}

	if (o.val()) {
		cb();
	} else {
		o.one('focus', cb);
	}
});

$(function() {
	CardInfo.setDefaultOptions({
		banksLogosPath: '/s/i/cardinfo/banks/',
		brandsLogosPath: '/s/i/cardinfo/brands/',
		backgroundColors: ['#d8d8d8', '#dddddd'],
		backgroundGradient: 'linear-gradient(135deg, #d8d8d8, #dddddd)'
	});

	var cardInfo = new CardInfo('5244 6800 0000 0000');
	var bankData = CardInfo._getBank('5244 6800 0000 0000');
	//backgroundGradient
	
	$mx.observe('.card-info__field-number', function(o) {
		
	o.on('keyup change paste', function() {
		var r = new CardInfo(this.value);
			
			if (r) {
				var p = $(this).closest('.card-info__form-wrap');
				var f = $(".card-info__cards", p);
				var l = $('.card-info__type-logo', p);
				var c = $('.card-info__field-code', p);
				
				c.attr("placeholder", r.codeName?r.codeName:"");
				
				$(window).resize(function() {
					f.css("fontSize",(.026*f.width())+"px");
				}).trigger('resize');
				
				
				$('.card-info__front', p).css("backgroundColor", r.backgroundColor).css("backgroundImage", r.backgroundGradient).css("color", r.textColor);
				var i = $('.card-info__bank-logo-link', p).toggleClass('hide', r.bankLogo == null).toggleClass('is-hidden', r.bankLogo == null);
				
				if (r.bankLogo) {
					i.attr("title", r.bankName).css("backgroundImage","url('"+r.bankLogo+"')");
				}
				
				r.brandLogo?l.attr("src", r.brandLogo).show():l.hide();
				
				$('.card-info__bank-logo-wrap', p).css('display', r.bankLogo?'block':'node');
			}
		}).trigger('change');
	});
	
	
});