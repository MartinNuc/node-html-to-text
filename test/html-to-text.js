var expect = require('chai').expect;
var htmlToText = require('..');
var path = require('path');
var fs = require('fs');


describe('html-to-text', function() {
  describe('.fromString()', function() {
    describe('wordwrap option', function() {

      var longStr;

      beforeEach(function() {
        longStr = '111111111 222222222 333333333 444444444 555555555 666666666 777777777 888888888 999999999';
      });

      it('should wordwrap at 80 characters by default', function() {
        expect(htmlToText.fromString(longStr)).to.equal('111111111 222222222 333333333 444444444 555555555 666666666 777777777 888888888\n999999999');
      });

      it('should wordwrap at given amount of characters when give a number', function() {

        expect(htmlToText.fromString(longStr, { wordwrap: 20 })).to.equal('111111111 222222222\n333333333 444444444\n555555555 666666666\n777777777 888888888\n999999999');

        expect(htmlToText.fromString(longStr, { wordwrap: 50 })).to.equal('111111111 222222222 333333333 444444444 555555555\n666666666 777777777 888888888 999999999');

        expect(htmlToText.fromString(longStr, { wordwrap: 70 })).to.equal('111111111 222222222 333333333 444444444 555555555 666666666 777777777\n888888888 999999999');
      });

      it('should not wordwrap when given null', function() {
        expect(htmlToText.fromString(longStr, { wordwrap: null })).to.equal(longStr);
      });

      it('should not wordwrap when given false', function() {
        expect(htmlToText.fromString(longStr, { wordwrap: false })).to.equal(longStr);
      });

      it('should not exceed the line width when processing embedded format tags', function() {
        var testString = '<p><strong>This text isn\'t counted</strong> when calculating where to break a string for 80 character line lengths.</p>';
        expect(htmlToText.fromString(testString, {} )).to.equal('This text isn\'t counted when calculating where to break a string for 80\ncharacter line lengths.');
      });

      it('should work with a long string containing line feeds', function() {
        var testString = '<p>If a word with a line feed exists over the line feed boundary then\nyou\nmust\nrespect it.</p>';
        expect(htmlToText.fromString(testString, {} )).to.equal('If a word with a line feed exists over the line feed boundary then you must\nrespect it.');
      });

      it('should not wrongly truncate lines when processing embedded format tags', function() {
        var testString = '<p><strong>This text isn\'t counted</strong> when calculating where to break a string for 80 character line lengths.  However it can affect where the next line breaks and this could lead to having an early line break</p>';
        expect(htmlToText.fromString(testString, {} )).to.equal('This text isn\'t counted when calculating where to break a string for 80\ncharacter line lengths. However it can affect where the next line breaks and\nthis could lead to having an early line break');
      });

      it('should not exceed the line width when processing anchor tags', function() {
        var testString = "<p>We appreciate your business. And we hope you'll check out our <a href=\"http://example.com/\">new products</a>!</p>";
        expect(htmlToText.fromString(testString, {} )).to.equal('We appreciate your business. And we hope you\'ll check out our new products\n[http://example.com/] !');
      });

      it('should honour line feeds from a long word across the wrap, where the line feed is before the wrap', function() {
        var testString = '<p>This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.</p>';
        expect(htmlToText.fromString(testString, {} ))
            .to.equal('This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.');
      });

      it('should remove line feeds from a long word across the wrap, where the line feed is after the wrap', function() {
        var testString = '<p>This string is meant to test if a string is split properly across anewlineandlong\nword with following text.</p>';
        expect(htmlToText.fromString(testString, {} ))
            .to.equal('This string is meant to test if a string is split properly across\nanewlineandlong word with following text.');
      });
    });

    describe('preserveNewlines option', function() {

      var newlineStr;

      beforeEach(function() {
        newlineStr = '<p\n>One\nTwo\nThree</p>';
      });

      it('should not preserve newlines by default', function() {
        expect(htmlToText.fromString(newlineStr)).to.not.contain('\n');
      });

      it('should preserve newlines when provided with a truthy value', function() {
        expect(htmlToText.fromString(newlineStr, { preserveNewlines: true })).to.contain('\n');
      });

      it('should not preserve newlines in the tags themselves', function() {
        var output_text = htmlToText.fromString(newlineStr, { preserveNewlines: true });
        expect(output_text.slice(0,1)).to.equal("O");
      });

      it('should preserve line feeds in a long wrapping string containing line feeds', function() {
        var testString = '<p>If a word with a line feed exists over the line feed boundary then\nyou\nmust\nrespect it.</p>';
        expect(htmlToText.fromString(testString, { preserveNewlines: true } ))
            .to.equal('If a word with a line feed exists over the line feed boundary then\nyou\nmust\nrespect it.');
      });

      it('should preserve line feeds in a long string containing line feeds across the wrap', function() {
        var testString = '<p>If a word with a line feed exists over the line feed boundary then\nyou must respect it.</p>';
        expect(htmlToText.fromString(testString, { preserveNewlines: true } ))
            .to.equal('If a word with a line feed exists over the line feed boundary then\nyou must respect it.');
      });

      it('should preserve line feeds in a long string containing line feeds across the wrap with a line feed before 80 chars', function() {
        var testString = '<p>This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.</p>';
        expect(htmlToText.fromString(testString, { preserveNewlines: true } ))
            .to.equal('This string is meant to test if a string is split properly across a\nnewlineandlongword with following text.');
      });

      it('should preserve line feeds in a long string containing line feeds across the wrap with a line feed after 80 chars', function() {
        var testString = '<p>This string is meant to test if a string is split properly across anewlineandlong\nword with following text.</p>';
        expect(htmlToText.fromString(testString, { preserveNewlines: true } ))
            .to.equal('This string is meant to test if a string is split properly across\nanewlineandlong\nword with following text.');
      });

      it('should split long lines', function() {
        var testString = '<p>If a word with a line feed exists over the line feed boundary then you must respect it.</p>';
        expect(htmlToText.fromString(testString, { preserveNewlines: true } ))
            .to.equal('If a word with a line feed exists over the line feed boundary then you must\nrespect it.');
      });
    });
  });

  describe('.fromFile()', function() {
    it('should convert file at given path', function(done) {

      var htmlFile = path.join(__dirname, 'test.html'),
        txtFile = path.join(__dirname, 'test.txt');

      var expectedTxt = fs.readFileSync(txtFile, 'utf8');
      htmlToText.fromFile(htmlFile, { tables: ['#invoice', '.address'] }, function(err, text) {
        expect(err).to.be.a('null');
        expect(text).to.equal(expectedTxt);
        done();
      });
    });
  });

  describe('li', function () {
    it('doesnt wrap li if wordwrap isnt', function () {
      var html = 'Good morning Jacob, \
        <p>Lorem ipsum dolor sit amet</p> \
        <p><strong>Lorem ipsum dolor sit amet.</strong></p> \
        <ul> \
          <li>run in the park <span style="color:#888888;">(in progress)</span></li> \
        </ul> \
      ';
      var resultExpected = 'Good morning Jacob,Lorem ipsum dolor sit amet\n\nLorem ipsum dolor sit amet.\n\n * run in the park (in progress)';
      var result = htmlToText.fromString(html, { wordwrap: false });
      expect(result).to.equal(resultExpected);
    });
  });

  describe('tables', function () {
    it('does not process tables with uppercase tags / does not process tables with center tag', function () {
      var html = 'Good morning Jacob, \
        <TABLE> \
        <CENTER> \
        <TBODY> \
        <TR> \
        <TD>Lorem ipsum dolor sit amet.</TD> \
        </TR> \
        </CENTER> \
        </TBODY> \
        </TABLE> \
      ';
      var resultExpected = 'Good morning Jacob,Lorem ipsum dolor sit amet.';
      var result = htmlToText.fromString(html, { tables: true });
      expect(result).to.equal(resultExpected);
    });
  });

  describe('entities', function () {
    it('does not insert null bytes', function () {
      var html = '<a href="some-url?a=b&amp;b=c">Testing &amp; Done</a>';

      var result = htmlToText.fromString(html);
      expect(result).to.equal('Testing & Done [some-url?a=b&b=c]');
    });

    it('should replace entities inside `alt` attributes of images', function () {
      var html = '<img src="test.png" alt="&quot;Awesome&quot;">';

      var result = htmlToText.fromString(html);
      expect(result).to.equal('"Awesome" [test.png]');
    });
  });

  describe('unicode support', function () {
    it('should decode &#128514; to 😂', function () {
      var result = htmlToText.fromString('&#128514;');
      expect(result).to.equal('😂');
    });
  });

  describe('disable uppercaseHeadings', function () {
    [1, 2, 3, 4, 5, 6].forEach(function (i) {
      it('should return h' + i + ' in lowercase', function () {
        var result = htmlToText.fromString('<h' + i + '>test</h' + i + '>', {
          uppercaseHeadings: false
        });
        expect(result).to.equal('test');
      });
    });
    
  });

  describe('Base element', function () {
    it('should retrieve and convert the entire document under `body` by default', function(done) {
      var htmlFile = path.join(__dirname, 'test.html'),
          txtFile = path.join(__dirname, 'test.txt');

      var expectedTxt = fs.readFileSync(txtFile, 'utf8');
      var options = {
        tables: ['#invoice', '.address']
      };
      htmlToText.fromFile(htmlFile, options, function(err, text) {
        expect(err).to.be.a('null');
        expect(text).to.equal(expectedTxt);
        done();
      });
    });

    it('should only retrieve and convert content under the specified base element if found', function(done) {
      var htmlFile = path.join(__dirname, 'test.html'),
          txtFile = path.join(__dirname, 'test-address.txt');

      var expectedTxt = fs.readFileSync(txtFile, 'utf8');
      var options = {
        tables: ['.address'],
        baseElement: 'table.address'
      };
      htmlToText.fromFile(htmlFile, options, function(err, text) {
        expect(err).to.be.a('null');
        expect(text).to.equal(expectedTxt);
        done();
      });
    });

    it('should retrieve and convert content under multiple base elements', function(done) {
      var htmlFile = path.join(__dirname, 'test.html'),
          txtFile = path.join(__dirname, 'test-address-dup.txt');

      var expectedTxt = fs.readFileSync(txtFile, 'utf8');
      var options = {
        tables: ['.address'],
        baseElement: ['table.address', 'table.address']
      };
      htmlToText.fromFile(htmlFile, options, function(err, text) {
        expect(err).to.be.a('null');
        expect(text).to.equal(expectedTxt);
        done();
      });
    });

    it('should retrieve and convert content under multiple base elements in any order', function(done) {
      var htmlFile = path.join(__dirname, 'test.html'),
          txtFile = path.join(__dirname, 'test-any-order.txt');

      var expectedTxt = fs.readFileSync(txtFile, 'utf8');
      var options = {
        tables: ['.address'],
        baseElement: ['table.address', 'p.normal-space', 'table.address']
      };
      htmlToText.fromFile(htmlFile, options, function(err, text) {
        expect(err).to.be.a('null');
        expect(text).to.equal(expectedTxt);
        done();
      });
    });

    it('should process the first base element found when multiple exist', function(done) {
      var htmlFile = path.join(__dirname, 'test.html'),
          txtFile = path.join(__dirname, 'test-first-element.txt');

      var expectedTxt = fs.readFileSync(txtFile, 'utf8');
      var options = {
        tables: ['.address'],
        baseElement: 'p.normal-space'
      };
      htmlToText.fromFile(htmlFile, options, function(err, text) {
        expect(err).to.be.a('null');
        expect(text).to.equal(expectedTxt);
        done();
      });
    });

    it('should retrieve and convert the entire document by default if no base element is found', function(done) {
      var htmlFile = path.join(__dirname, 'test.html'),
          txtFile = path.join(__dirname, 'test.txt');

      var expectedTxt = fs.readFileSync(txtFile, 'utf8');
      var options = {
        tables: ['#invoice', '.address'],
        baseElement: 'table.notthere'
      };
      htmlToText.fromFile(htmlFile, options, function(err, text) {
        expect(err).to.be.a('null');
        expect(text).to.equal(expectedTxt);
        done();
      });
    });

    it('should return null if the base element isn\'t found and we\'re not returning the DOM by default', function(done) {
      var htmlFile = path.join(__dirname, 'test.html');

      var expectedTxt = '';
      var options = {
        tables: ['#invoice', '.address'],
        baseElement: 'table.notthere',
        returnDomByDefault: false
      };
      htmlToText.fromFile(htmlFile, options, function(err, text) {
        expect(err).to.be.a('null');
        expect(text).to.equal(expectedTxt);
        done();
      });
    });
  });

  describe('Long words', function() {
    it('should split long words if forceWrapOnLimit is set, existing linefeeds converted to space', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['/'], forceWrapOnLimit: true }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlo\nng word_with_following_text.');
    });

    it('should not wrap a string if longWordSplit is not set', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlongword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, {} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlongword_with_following_text.');
    });
 
    it('should not wrap a string if not wrapCharacters are found and forceWrapOnLimit is not set', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['/'], forceWrapOnLimit: false }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.');
    });

    it('should not wrap a string if no wrapCharacters are set and forceWrapOnLimit is not set', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: [], forceWrapOnLimit: false }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.');
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit.', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong word_with_following_text.');
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit. Content of wrapCharacters shouldn\'t matter.', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['/','-', '_'], forceWrapOnLimit: false }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong word_with_following_text.');
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit. Order of wrapCharacters shouldn\'t matter.', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['_', '/'], forceWrapOnLimit: false }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong word_with_following_text.');
    });

    it('should wrap on the last instance of a wrap character before the wordwrap limit. Should preference wrapCharacters in order', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split-properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['-', '_', '/'], forceWrapOnLimit: false }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split-\nproperly_across_anewlineandlong word_with_following_text.');
    });

    it('should not wrap a string that is too short', function() {
      var testString = '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false }} ))
          .to.equal('https://github.com/werk85/node-html-to-text/blob/master/lib/html-to-text.js');
    });

    it('should wrap a url string using \'/\'', function() {
      var testString = '<p>https://github.com/AndrewFinlay/node-html-to-text/commit/64836a5bd97294a672b24c26cb8a3ccdace41001</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false }} ))
          .to.equal('https://github.com/AndrewFinlay/node-html-to-text/commit/\n64836a5bd97294a672b24c26cb8a3ccdace41001');
    });

    it('should wrap very long url strings using \'/\'', function() {
      var testString = '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: ['/', '-'], forceWrapOnLimit: false }} ))
          .to.equal('https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/\nnode-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/\nwerk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/\nlib/html-to-text.js');
    });

    it('should wrap very long url strings using limit', function() {
      var testString = '<p>https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/html-to-text.js</p>';
      expect(htmlToText.fromString(testString, { longWordSplit: { wrapCharacters: [], forceWrapOnLimit: true }} ))
          .to.equal('https://github.com/werk85/node-html-to-text/blob/master/lib/werk85/node-html-to-\ntext/blob/master/lib/werk85/node-html-to-text/blob/master/lib/werk85/node-html-t\no-text/blob/master/lib/werk85/node-html-to-text/blob/master/lib/html-to-text.js');
    });

    it('should honour preserveNewlines and split long words', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { preserveNewlines: true, longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false }} ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_\nanewlineandlong\nword_with_following_text.');
    });

    it('should not put in extra linefeeds if the end of the untouched long string coincides with a preserved line feed', function() {
      var testString = '<p>_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.</p>';
      expect(htmlToText.fromString(testString, { preserveNewlines: true } ))
          .to.equal('_This_string_is_meant_to_test_if_a_string_is_split_properly_across_anewlineandlong\nword_with_following_text.');
    });

    it('should split long strings buried in links and hide the href', function() {
      var testString = '<a href="http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/">http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/</a>';
      expect(htmlToText.fromString(testString, { hideLinkHrefIfSameAsText: true, longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false }} ))
          .to.equal('http://images.fb.com/2015/12/21/\nivete-sangalo-launches-360-music-video-on-facebook/');
    });

    it('should split long strings buried in links and show the href', function() {
      var testString = '<a href="http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/">http://images.fb.com/2015/12/21/ivete-sangalo-launches-360-music-video-on-facebook/</a>';
      expect(htmlToText.fromString(testString, { hideLinkHrefIfSameAsText: false, longWordSplit: { wrapCharacters: ['/', '_'], forceWrapOnLimit: false }} ))
          .to.equal('http://images.fb.com/2015/12/21/\nivete-sangalo-launches-360-music-video-on-facebook/\n[http://images.fb.com/2015/12/21/\nivete-sangalo-launches-360-music-video-on-facebook/]');
    });
  })
});
