(function () {
  include('languages.js');
  log(lang.loadingMainMenu);
  var currentButton = 0;
  var buttons = [];
  var buttonTexts = [];
  var buttonShadows = [];
  var buttonMarkers = [];
  var normalButtonImg = 'file:///assets/img/button_over_9.png';
  var selectedButtonImg = 'file:///assets/img/button_over_9.png';
  jsmaf.root.children.length = 0;
  
  // Fallout 4 terminal color scheme - Green monochrome CRT style
  new Style({
    name: 'terminal_text',
    color: 'rgb(0, 255, 0)',
    size: 26
  });
  new Style({
    name: 'terminal_text_shadow',
    color: 'rgb(0, 0, 0)',
    size: 26
  });
  new Style({
    name: 'title',
    color: 'rgb(0, 255, 0)',
    size: 52
  });
  new Style({
    name: 'subtitle',
    color: 'rgb(0, 200, 0)',
    size: 18
  });
  new Style({
    name: 'selected',
    color: 'rgb(50, 255, 50)',
    size: 26
  });
  new Style({
    name: 'selected_shadow',
    color: 'rgb(0, 0, 0)',
    size: 26
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
  
  if (typeof CONFIG !== 'undefined' && CONFIG.music) {
    var audio = new jsmaf.AudioClip();
    audio.volume = 0.5;
    audio.open('file://../download0/sfx/bgm.wav');
  }
  
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
  
  // Terminal header section - Fallout style
  var headerLine1 = new jsmaf.Text();
  headerLine1.text = '>SET TERMINAL/INQUIRE';
  headerLine1.x = 100;
  headerLine1.y = 60;
  headerLine1.style = 'dim_text';
  jsmaf.root.children.push(headerLine1);
  
  var headerLine2 = new jsmaf.Text();
  headerLine2.text = '>SET FILE/PROTECTION=OWNER:RWED ACCOUNTS.F';
  headerLine2.x = 100;
  headerLine2.y = 85;
  headerLine2.style = 'dim_text';
  jsmaf.root.children.push(headerLine2);
  
  var headerLine3 = new jsmaf.Text();
  headerLine3.text = '>SET HALT RESTART/MAINT';
  headerLine3.x = 100;
  headerLine3.y = 110;
  headerLine3.style = 'dim_text';
  jsmaf.root.children.push(headerLine3);


  // Subtitle text
  var subtitleText = new jsmaf.Text();
  subtitleText.text = '- Fallout After Free Vue 1.4 -';
  subtitleText.x = 720;
  subtitleText.y = 280;
  subtitleText.style = 'subtitle';
  jsmaf.root.children.push(subtitleText);
  
  var creditText = new jsmaf.Text();
  creditText.text = 'by Earthonion and contributors';
  creditText.x = 620;
  creditText.y = 310;
  creditText.style = 'prompt';
  jsmaf.root.children.push(creditText);
  
  var creditText2 = new jsmaf.Text();
  creditText2.text = 'Theme by aztec YT';
  creditText2.x = 720;
  creditText2.y = 335;
  creditText2.style = 'prompt';
  jsmaf.root.children.push(creditText2);

  // System status display
  var statusText = new jsmaf.Text();
  statusText.text = '>RUN VUE_AFTER_FREE.EXE';
  statusText.x = 100;
  statusText.y = 370;
  statusText.style = 'terminal_text';
  jsmaf.root.children.push(statusText);
  
  var dividerLine = new jsmaf.Text();
  dividerLine.text = '________________________________________________________________________________';
  dividerLine.x = 100;
  dividerLine.y = 400;
  dividerLine.style = 'terminal_text';
  jsmaf.root.children.push(dividerLine);
  
  var menuOptions = [{
    label: lang.jailbreak,
    script: 'loader.js',
    imgKey: 'jailbreak',
    prompt: '[1]'
  }, {
    label: lang.payloadMenu,
    script: 'payload_host.js',
    imgKey: 'payloadMenu',
    prompt: '[2]'
  }, {
    label: 'Vue Options',
    script: 'config_ui.js',
    imgKey: 'config',
    prompt: '[3]'
  }];
  
  var startY = 470;
  var buttonSpacing = 70;
  var leftMargin = 150;
  
  // Create menu items with Fallout terminal style
  for (var i = 0; i < menuOptions.length; i++) {
    var yPos = startY + i * buttonSpacing;
    
    // Green background panel - Fallout terminal selection box style
    var bgPanel = new Image({
      url: 'file:///assets/img/button_over_9.png',
      x: leftMargin - 20,
      y: yPos - 12,
      width: 700,
      height: 50
    });
    bgPanel.alpha = 0.3;
    bgPanel.color = 'rgb(0, 100, 0)';
    jsmaf.root.children.push(bgPanel);
    
    // Invisible button background for hit detection
    var button = new Image({
      url: normalButtonImg,
      x: leftMargin - 50,
      y: yPos - 10,
      width: 1100,
      height: 60
    });
    button.alpha = 0;
    buttons.push(button);
    jsmaf.root.children.push(button);
    
    // Selection marker (cursor) - Fallout style bracket
    var marker = new jsmaf.Text();
    marker.text = '>';
    marker.x = leftMargin - 30;
    marker.y = yPos;
    marker.style = 'selected';
    marker.visible = false;
    buttonMarkers.push(marker);
    jsmaf.root.children.push(marker);
    
    // Shadow text
    var shadowText = new jsmaf.Text();
    shadowText.text = menuOptions[i].prompt + ' ' + menuOptions[i].label;
    shadowText.x = leftMargin + 3;
    shadowText.y = yPos + 3;
    shadowText.style = 'terminal_text_shadow';
    buttonShadows.push(shadowText);
    jsmaf.root.children.push(shadowText);
    
    // Menu item text
    var btnText;
    if (typeof useImageText !== 'undefined' && useImageText) {
      btnText = new Image({
        url: textImageBase + menuOptions[i].imgKey + '.png',
        x: leftMargin + 20,
        y: yPos - 5,
        width: 300,
        height: 50
      });
    } else {
      btnText = new jsmaf.Text();
      btnText.text = menuOptions[i].prompt + ' ' + menuOptions[i].label;
      btnText.x = leftMargin;
      btnText.y = yPos;
      btnText.style = 'terminal_text';
    }
    buttonTexts.push(btnText);
    jsmaf.root.children.push(btnText);
  }
  
  // Exit option
  var exitY = startY + menuOptions.length * buttonSpacing + 40;
  
  var exitBgPanel = new Image({
    url: 'file:///assets/img/button_over_9.png',
    x: leftMargin - 20,
    y: exitY - 12,
    width: 700,
    height: 50
  });
  exitBgPanel.alpha = 0.3;
  exitBgPanel.color = 'rgb(0, 100, 0)';
  jsmaf.root.children.push(exitBgPanel);
  
  var exitButton = new Image({
    url: normalButtonImg,
    x: leftMargin - 50,
    y: exitY - 10,
    width: 1100,
    height: 60
  });
  exitButton.alpha = 0;
  buttons.push(exitButton);
  jsmaf.root.children.push(exitButton);
  
  var exitMarker = new jsmaf.Text();
  exitMarker.text = '>';
  exitMarker.x = leftMargin - 30;
  exitMarker.y = exitY;
  exitMarker.style = 'selected';
  exitMarker.visible = false;
  buttonMarkers.push(exitMarker);
  jsmaf.root.children.push(exitMarker);
  
  // Exit shadow text
  var exitShadow = new jsmaf.Text();
  exitShadow.text = '[0] ' + lang.exit;
  exitShadow.x = leftMargin + 3;
  exitShadow.y = exitY + 3;
  exitShadow.style = 'terminal_text_shadow';
  buttonShadows.push(exitShadow);
  jsmaf.root.children.push(exitShadow);
  
  // Exit main text
  var exitText;
  if (typeof useImageText !== 'undefined' && useImageText) {
    exitText = new Image({
      url: textImageBase + 'exit.png',
      x: leftMargin + 20,
      y: exitY - 5,
      width: 300,
      height: 50
    });
  } else {
    exitText = new jsmaf.Text();
    exitText.text = '[0] ' + lang.exit;
    exitText.x = leftMargin;
    exitText.y = exitY;
    exitText.style = 'terminal_text';
  }
  buttonTexts.push(exitText);
  jsmaf.root.children.push(exitText);
  
  // Bottom terminal info - Fallout style
  var bottomLine1 = new jsmaf.Text();
  bottomLine1.text = '________________________________________________________________________________';
  bottomLine1.x = 100;
  bottomLine1.y = 880;
  bottomLine1.style = 'terminal_text';
  jsmaf.root.children.push(bottomLine1);
  
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
  
  // Bottom status line
  var statusLine = new jsmaf.Text();
  statusLine.text = '>AWAITING INPUT...';
  statusLine.x = 100;
  statusLine.y = 920;
  statusLine.style = 'prompt';
  jsmaf.root.children.push(statusLine);
  
  var cursorBlink = new jsmaf.Text();
  cursorBlink.text = String.fromCharCode(9608);
  cursorBlink.x = 320;
  cursorBlink.y = 920;
  cursorBlink.style = 'terminal_text';
  jsmaf.root.children.push(cursorBlink);
  
  var prevButton = -1;
  
  function updateHighlight() {
    for (var i = 0; i < buttonMarkers.length; i++) {
      buttonMarkers[i].visible = false;
      if (buttonTexts[i].style) {
        buttonTexts[i].style = 'terminal_text';
      }
      if (buttonShadows[i] && buttonShadows[i].style) {
        buttonShadows[i].style = 'terminal_text_shadow';
      }
    }
    
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
  
  function handleButtonPress() {
    if (currentButton === buttons.length - 1) {
      log('>> TERMINATING PROCESS...');
      try {
        if (typeof libc_addr === 'undefined') {
          log('>> Loading userland.js...');
          include('userland.js');
        }
        fn.register(0x14, 'getpid', [], 'bigint');
        fn.register(0x25, 'kill', ['bigint', 'bigint'], 'bigint');
        var pid = fn.getpid();
        var pid_num = pid instanceof BigInt ? pid.lo : pid;
        log('>> Current PID: ' + pid_num);
        log('>> Sending SIGKILL to PID ' + pid_num);
        fn.kill(pid, new BigInt(0, 9));
      } catch (e) {
        log('>> ERROR during exit: ' + e.message);
        if (e.stack) log(e.stack);
      }
      jsmaf.exit();
    } else if (currentButton < menuOptions.length) {
      var selectedOption = menuOptions[currentButton];
      if (!selectedOption) return;
      if (selectedOption.script === 'loader.js') {
        jsmaf.onKeyDown = function () {};
      }
      log('>> LOADING MODULE: ' + selectedOption.script);
      try {
        include(selectedOption.script);
      } catch (e) {
        log('>> ERROR loading ' + selectedOption.script + ': ' + e.message);
        if (e.stack) log(e.stack);
      }
    }
  }
  
  jsmaf.onKeyDown = function (keyCode) {
    if (keyCode === 6 || keyCode === 5) {
      currentButton = (currentButton + 1) % buttons.length;
      updateHighlight();
    } else if (keyCode === 4 || keyCode === 7) {
      currentButton = (currentButton - 1 + buttons.length) % buttons.length;
      updateHighlight();
    } else if (keyCode === 14) {
      handleButtonPress();
    }
  };
  
  updateHighlight();
  log('>> TERMINAL INTERFACE LOADED');
})();