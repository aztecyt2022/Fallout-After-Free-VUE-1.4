(function () {
  if (typeof libc_addr === 'undefined') {
    log('Loading userland.js...');
    include('userland.js');
    log('userland.js loaded');
  } else {
    log('userland.js already loaded (libc_addr defined)');
  }
  log('Loading check-jailbroken.js...');
  include('check-jailbroken.js');
  if (typeof CONFIG !== 'undefined' && CONFIG.music) {
    var audio = new jsmaf.AudioClip();
    audio.volume = 0.5;
    audio.open('file://../download0/sfx/bgm.wav');
  }
  is_jailbroken = checkJailbroken();
  jsmaf.root.children.length = 0;
  
  // Fallout 4 terminal color scheme - Green monochrome CRT style
  new Style({
    name: 'terminal_text',
    color: 'rgb(0, 255, 0)',
    size: 24
  });
  new Style({
    name: 'terminal_text_shadow',
    color: 'rgb(0, 0, 0)',
    size: 24
  });
  new Style({
    name: 'title',
    color: 'rgb(0, 255, 0)',
    size: 30
  });
  new Style({
    name: 'selected',
    color: 'rgb(50, 255, 50)',
    size: 24
  });
  new Style({
    name: 'selected_shadow',
    color: 'rgb(0, 0, 0)',
    size: 24
  });
  new Style({
    name: 'prompt',
    color: 'rgb(0, 200, 0)',
    size: 22
  });
  new Style({
    name: 'help_text',
    color: 'rgb(0, 200, 0)',
    size: 18
  });
  new Style({
    name: 'dim_text',
    color: 'rgb(0, 150, 0)',
    size: 20
  });
  
  var currentButton = 0;
  var buttons = [];
  var buttonTexts = [];
  var buttonShadows = [];
  var buttonMarkers = [];
  var fileList = [];
  var normalButtonImg = 'file:///assets/img/button_over_9.png';
  var selectedButtonImg = 'file:///assets/img/button_over_9.png';
  
  // Background - dimmed but visible
  var background = new Image({
    url: 'file:///../download0/img/PS4ICONBACK.png',
    x: 0,
    y: 0,
    width: 1920,
    height: 1080
  });
  background.alpha = 0.4;
  jsmaf.root.children.push(background);
  
  var centerX = 960;
  
  fn.register(0x05, 'open_sys', ['bigint', 'bigint', 'bigint'], 'bigint');
  fn.register(0x06, 'close_sys', ['bigint'], 'bigint');
  fn.register(0x110, 'getdents', ['bigint', 'bigint', 'bigint'], 'bigint');
  fn.register(0x03, 'read_sys', ['bigint', 'bigint', 'bigint'], 'bigint');
  var scanPaths = ['/download0/payloads'];
  if (is_jailbroken) {
    scanPaths.push('/data/payloads');
    for (var i = 0; i <= 7; i++) {
      scanPaths.push('/mnt/usb' + i + '/payloads');
    }
  }
  log('Scanning paths: ' + scanPaths.join(', '));
  var path_addr = mem.malloc(256);
  var buf = mem.malloc(4096);
  for (var currentPath of scanPaths) {
    log('Scanning ' + currentPath + ' for files...');
    for (var _i = 0; _i < currentPath.length; _i++) {
      mem.view(path_addr).setUint8(_i, currentPath.charCodeAt(_i));
    }
    mem.view(path_addr).setUint8(currentPath.length, 0);
    var fd = fn.open_sys(path_addr, new BigInt(0, 0), new BigInt(0, 0));
    // log('open_sys (' + currentPath + ') returned: ' + fd.toString())

    if (!fd.eq(new BigInt(0xffffffff, 0xffffffff))) {
      var count = fn.getdents(fd, buf, new BigInt(0, 4096));
      // log('getdents returned: ' + count.toString() + ' bytes')

      if (!count.eq(new BigInt(0xffffffff, 0xffffffff)) && count.lo > 0) {
        var offset = 0;
        while (offset < count.lo) {
          var d_reclen = mem.view(buf.add(new BigInt(0, offset + 4))).getUint16(0, true);
          var d_type = mem.view(buf.add(new BigInt(0, offset + 6))).getUint8(0);
          var d_namlen = mem.view(buf.add(new BigInt(0, offset + 7))).getUint8(0);
          var name = '';
          for (var _i2 = 0; _i2 < d_namlen; _i2++) {
            name += String.fromCharCode(mem.view(buf.add(new BigInt(0, offset + 8 + _i2))).getUint8(0));
          }

          // log('Entry: ' + name + ' type=' + d_type)

          if (d_type === 8 && name !== '.' && name !== '..') {
            var lowerName = name.toLowerCase();
            if (lowerName.endsWith('.elf') || lowerName.endsWith('.bin') || lowerName.endsWith('.js')) {
              fileList.push({
                name,
                path: currentPath + '/' + name
              });
              log('Added file: ' + name + ' from ' + currentPath);
            }
          }
          offset += d_reclen;
        }
      }
      fn.close_sys(fd);
    } else {
      log('Failed to open ' + currentPath);
    }
  }
  log('Total files found: ' + fileList.length);
  var startY = 220;
  var buttonSpacing = 90;
  var buttonsPerRow = 5;
  var buttonWidth = 300;
  var buttonHeight = 80;
  var startX = 130;
  var xSpacing = 340;
  for (var _i3 = 0; _i3 < fileList.length; _i3++) {
    var row = Math.floor(_i3 / buttonsPerRow);
    var col = _i3 % buttonsPerRow;
    var displayName = fileList[_i3].name;
    var btnX = startX + col * xSpacing;
    var btnY = startY + row * buttonSpacing;
    
    // Green background panel for each payload button
    var bgPanel = new Image({
      url: 'file:///assets/img/button_over_9.png',
      x: btnX - 10,
      y: btnY - 5,
      width: buttonWidth + 20,
      height: buttonHeight
    });
    bgPanel.alpha = 0.3;
    bgPanel.color = 'rgb(0, 100, 0)';
    jsmaf.root.children.push(bgPanel);
    
    // Invisible button background for hit detection
    var button = new Image({
      url: normalButtonImg,
      x: btnX,
      y: btnY,
      width: buttonWidth,
      height: buttonHeight
    });
    button.alpha = 0;
    buttons.push(button);
    jsmaf.root.children.push(button);
    
    // Selection marker (cursor)
    var marker = new jsmaf.Text();
    marker.text = '>';
    marker.x = btnX - 20;
    marker.y = btnY + 30;
    marker.style = 'selected';
    marker.visible = false;
    buttonMarkers.push(marker);
    jsmaf.root.children.push(marker);
    
    if (displayName.length > 30) {
      displayName = displayName.substring(0, 27) + '...';
    }
    
    // Shadow text
    var shadowText = new jsmaf.Text();
    shadowText.text = displayName;
    shadowText.x = btnX + 23;
    shadowText.y = btnY + 33;
    shadowText.style = 'terminal_text_shadow';
    buttonShadows.push(shadowText);
    jsmaf.root.children.push(shadowText);
    
    // Main text
    var text = new jsmaf.Text();
    text.text = displayName;
    text.x = btnX + 20;
    text.y = btnY + 30;
    text.style = 'terminal_text';
    buttonTexts.push(text);
    jsmaf.root.children.push(text);
  }
  var exitX = 810;
  var exitY = 980;
  
  // Green background panel for exit button
  var exitBgPanel = new Image({
    url: 'file:///assets/img/button_over_9.png',
    x: exitX - 10,
    y: exitY - 5,
    width: buttonWidth + 20,
    height: buttonHeight
  });
  exitBgPanel.alpha = 0.3;
  exitBgPanel.color = 'rgb(0, 100, 0)';
  jsmaf.root.children.push(exitBgPanel);
  
  var exitButton = new Image({
    url: normalButtonImg,
    x: exitX,
    y: exitY,
    width: buttonWidth,
    height: buttonHeight
  });
  exitButton.alpha = 0;
  buttons.push(exitButton);
  jsmaf.root.children.push(exitButton);
  
  var exitMarker = new jsmaf.Text();
  exitMarker.text = '>';
  exitMarker.x = exitX - 20;
  exitMarker.y = exitY + buttonHeight / 2 - 12;
  exitMarker.style = 'selected';
  exitMarker.visible = false;
  buttonMarkers.push(exitMarker);
  jsmaf.root.children.push(exitMarker);
  
  // Exit shadow text
  var exitShadow = new jsmaf.Text();
  exitShadow.text = 'Back';
  exitShadow.x = exitX + buttonWidth / 2 - 17;
  exitShadow.y = exitY + buttonHeight / 2 - 9;
  exitShadow.style = 'terminal_text_shadow';
  buttonShadows.push(exitShadow);
  jsmaf.root.children.push(exitShadow);
  
  var exitText = new jsmaf.Text();
  exitText.text = 'Back';
  exitText.x = exitX + buttonWidth / 2 - 20;
  exitText.y = exitY + buttonHeight / 2 - 12;
  exitText.style = 'terminal_text';
  buttonTexts.push(exitText);
  jsmaf.root.children.push(exitText);
  
  // Terminal header - Fallout style (moved back to bottom, left side)
  var headerLine1 = new jsmaf.Text();
  headerLine1.text = '________________________________________________________________________________';
  headerLine1.x = 100;
  headerLine1.y = 700;
  headerLine1.style = 'terminal_text';
  jsmaf.root.children.push(headerLine1);
  
  if (typeof useImageText !== 'undefined' && useImageText) {
    var title = new Image({
      url: textImageBase + 'payloadMenu.png',
      x: 300,
      y: 735,
      width: 250,
      height: 60
    });
    jsmaf.root.children.push(title);
  } else {
    var _title = new jsmaf.Text();
    _title.text = 'PAYLOAD EXECUTION TERMINAL';
    _title.x = 300;
    _title.y = 735;
    _title.style = 'title';
    jsmaf.root.children.push(_title);
  }
  
  var headerLine2 = new jsmaf.Text();
  headerLine2.text = '________________________________________________________________________________';
  headerLine2.x = 100;
  headerLine2.y = 770;
  headerLine2.style = 'terminal_text';
  jsmaf.root.children.push(headerLine2);
  
  // Help text in Fallout terminal style - right side box
  var helpBoxX = 1100;
  var helpBoxY = 450;
  
  var helpBorder1 = new jsmaf.Text();
  helpBorder1.text = '____________________';
  helpBorder1.x = helpBoxX;
  helpBorder1.y = helpBoxY;
  helpBorder1.style = 'terminal_text';
  jsmaf.root.children.push(helpBorder1);
  
  var helpTitle = new jsmaf.Text();
  helpTitle.text = '   TERMINAL ACCESS';
  helpTitle.x = helpBoxX;
  helpTitle.y = helpBoxY + 30;
  helpTitle.style = 'terminal_text';
  jsmaf.root.children.push(helpTitle);
  
  var helpBorder2 = new jsmaf.Text();
  helpBorder2.text = '____________________';
  helpBorder2.x = helpBoxX;
  helpBorder2.y = helpBoxY + 55;
  helpBorder2.style = 'terminal_text';
  jsmaf.root.children.push(helpBorder2);

  var helpDpad = new jsmaf.Text();
  helpDpad.text = 'D-PAD UP/DOWN';
  helpDpad.x = helpBoxX;
  helpDpad.y = helpBoxY + 85;
  helpDpad.style = 'help_text';
  jsmaf.root.children.push(helpDpad);
  var helpX = new jsmaf.Text();
  helpX.text = ' X: Select Option';
  helpX.x = helpBoxX;
  helpX.y = helpBoxY + 100;
  helpX.style = 'help_text';
  jsmaf.root.children.push(helpX);
  
  var helpO = new jsmaf.Text();
  helpO.text = ' O: Go Back';
  helpO.x = helpBoxX;
  helpO.y = helpBoxY + 115;
  helpO.style = 'help_text';
  jsmaf.root.children.push(helpO);
  
  var helpBorder3 = new jsmaf.Text();
  helpBorder3.text = '____________________';
  helpBorder3.x = helpBoxX;
  helpBorder3.y = helpBoxY + 125;
  helpBorder3.style = 'terminal_text';
  jsmaf.root.children.push(helpBorder3);
  var prevButton = -1;
  
  function updateHighlight() {
    // Hide all markers first and reset text styles
    for (var i = 0; i < buttonMarkers.length; i++) {
      if (buttonMarkers[i]) {
        buttonMarkers[i].visible = false;
      }
      if (buttonTexts[i] && buttonTexts[i].style) {
        buttonTexts[i].style = 'terminal_text';
      }
      if (buttonShadows[i] && buttonShadows[i].style) {
        buttonShadows[i].style = 'terminal_text_shadow';
      }
    }
    
    // Show current marker and highlight text
    if (buttonMarkers[currentButton]) {
      buttonMarkers[currentButton].visible = true;
    }
    if (buttonTexts[currentButton] && buttonTexts[currentButton].style) {
      buttonTexts[currentButton].style = 'selected';
    }
    if (buttonShadows[currentButton] && buttonShadows[currentButton].style) {
      buttonShadows[currentButton].style = 'selected_shadow';
    }
    
    prevButton = currentButton;
  }
  
  jsmaf.onKeyDown = function (keyCode) {
    log('Key pressed: ' + keyCode);
    var fileButtonCount = fileList.length;
    var exitButtonIndex = buttons.length - 1;
    if (keyCode === 6) {
      if (currentButton === exitButtonIndex) {
        return;
      }
      var nextButton = currentButton + buttonsPerRow;
      if (nextButton >= fileButtonCount) {
        currentButton = exitButtonIndex;
      } else {
        currentButton = nextButton;
      }
      updateHighlight();
    } else if (keyCode === 4) {
      if (currentButton === exitButtonIndex) {
        var lastRow = Math.floor((fileButtonCount - 1) / buttonsPerRow);
        var firstInLastRow = lastRow * buttonsPerRow;
        var _col = 0;
        if (fileButtonCount > 0) {
          _col = Math.min(buttonsPerRow - 1, (fileButtonCount - 1) % buttonsPerRow);
        }
        currentButton = Math.min(firstInLastRow + _col, fileButtonCount - 1);
      } else {
        var _nextButton = currentButton - buttonsPerRow;
        if (_nextButton >= 0) {
          currentButton = _nextButton;
        }
      }
      updateHighlight();
    } else if (keyCode === 5) {
      if (currentButton === exitButtonIndex) {
        return;
      }
      var _row = Math.floor(currentButton / buttonsPerRow);
      var _col2 = currentButton % buttonsPerRow;
      if (_col2 < buttonsPerRow - 1) {
        var _nextButton2 = currentButton + 1;
        if (_nextButton2 < fileButtonCount) {
          currentButton = _nextButton2;
        }
      }
      updateHighlight();
    } else if (keyCode === 7) {
      if (currentButton === exitButtonIndex) {
        currentButton = fileButtonCount - 1;
      } else {
        var _col3 = currentButton % buttonsPerRow;
        if (_col3 > 0) {
          currentButton = currentButton - 1;
        }
      }
      updateHighlight();
    } else if (keyCode === 14) {
      handleButtonPress();
    } else if (keyCode === 13) {
      log('Going back to main menu...');
      try {
        include('main-menu.js');
      } catch (e) {
        var err = e;
        log('ERROR loading main-menu.js: ' + err.message);
        if (err.stack) log(err.stack);
      }
    }
  };
  function handleButtonPress() {
    if (currentButton === buttons.length - 1) {
      log('Going back to main menu...');
      try {
        include('main-menu.js');
      } catch (e) {
        var err = e;
        log('ERROR loading main-menu.js: ' + err.message);
        if (err.stack) log(err.stack);
      }
    } else if (currentButton < fileList.length) {
      var selectedEntry = fileList[currentButton];
      if (!selectedEntry) {
        log('No file selected!');
        return;
      }
      var filePath = selectedEntry.path;
      var fileName = selectedEntry.name;
      log('Selected: ' + fileName + ' from ' + filePath);
      try {
        if (fileName.toLowerCase().endsWith('.js')) {
          // Local JavaScript file case (from /download0/payloads)
          if (filePath.startsWith('/download0/')) {
            log('Including JavaScript file: ' + fileName);
            include('payloads/' + fileName);
          } else {
            // External JavaScript file case (from /data/payloads or /mnt/usbX/payloads)
            log('Reading external JavaScript file: ' + filePath);
            var p_addr = mem.malloc(256);
            for (var _i5 = 0; _i5 < filePath.length; _i5++) {
              mem.view(p_addr).setUint8(_i5, filePath.charCodeAt(_i5));
            }
            mem.view(p_addr).setUint8(filePath.length, 0);
            var _fd = fn.open_sys(p_addr, new BigInt(0, 0), new BigInt(0, 0));
            if (!_fd.eq(new BigInt(0xffffffff, 0xffffffff))) {
              var buf_size = 1024 * 1024 * 1; // 1 MiB
              var _buf = mem.malloc(buf_size);
              var read_len = fn.read_sys(_fd, _buf, new BigInt(0, buf_size));
              fn.close_sys(_fd);
              var scriptContent = '';
              var len = read_len instanceof BigInt ? read_len.lo : read_len;
              log('File read size: ' + len + ' bytes');
              for (var _i6 = 0; _i6 < len; _i6++) {
                scriptContent += String.fromCharCode(mem.view(_buf).getUint8(_i6));
              }
              log('Executing via eval()...');
              // eslint-disable-next-line no-eval
              eval(scriptContent);
            } else {
              log('ERROR: Could not open file for reading!');
            }
          }
        } else {
          log('Loading binloader.js...');
          include('binloader.js');
          log('binloader.js loaded successfully');
          log('Initializing binloader...');
          var {
            bl_load_from_file
          } = binloader_init();
          log('Loading payload from: ' + filePath);
          bl_load_from_file(filePath);
        }
      } catch (e) {
        var _err = e;
        log('ERROR: ' + _err.message);
        if (_err.stack) log(_err.stack);
      }
    }
  }
  updateHighlight();
  log('Interactive UI loaded!');
  log('Total elements: ' + jsmaf.root.children.length);
  log('Buttons: ' + buttons.length);
  log('Use arrow keys to navigate, Enter/X to select');
})();