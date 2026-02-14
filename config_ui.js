if (typeof libc_addr === 'undefined') {
  include('userland.js');
}
if (typeof lang === 'undefined') {
  include('languages.js');
}
(function () {
  log(lang.loadingConfig);
  var fs = {
    write: function (filename, content, callback) {
      var xhr = new jsmaf.XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && callback) {
          callback(xhr.status === 0 || xhr.status === 200 ? null : new Error('failed'));
        }
      };
      xhr.open('POST', 'file://../download0/' + filename, true);
      xhr.send(content);
    },
    read: function (filename, callback) {
      var xhr = new jsmaf.XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && callback) {
          callback(xhr.status === 0 || xhr.status === 200 ? null : new Error('failed'), xhr.responseText);
        }
      };
      xhr.open('GET', 'file://../download0/' + filename, true);
      xhr.send();
    }
  };
  var currentConfig = {
    autolapse: false,
    autopoop: false,
    autoclose: false,
    music: true,
    jb_behavior: 0
  };

  // Store user's payloads so we don't overwrite them
  var userPayloads = [];
  var configLoaded = false;
  var jbBehaviorLabels = [lang.jbBehaviorAuto, lang.jbBehaviorNetctrl, lang.jbBehaviorLapse];
  var jbBehaviorImgKeys = ['jbBehaviorAuto', 'jbBehaviorNetctrl', 'jbBehaviorLapse'];
  var currentButton = 0;
  var buttons = [];
  var buttonTexts = [];
  var buttonShadows = [];
  var buttonMarkers = [];
  var valueTexts = [];
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
    size: 40
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
    name: 'stats',
    color: 'rgb(0, 200, 0)',
    size: 20
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

  // Background image
  var background = new Image({
    url: 'file:///../download0/img/PS4ICONBACK.png',
    x: 0,
    y: 0,
    width: 1920,
    height: 1080
  });
  background.alpha = 0.1;
  jsmaf.root.children.push(background);
  
  var centerX = 960;

  // Include the stats tracker
  include('stats-tracker.js');

  // Load and display stats
  stats.load();
  var statsData = stats.get();

  // Create text elements for each stat - terminal style
  var statsImgKeys = ['totalAttempts', 'successes', 'failures', 'successRate', 'failureRate'];
  var statsValues = [statsData.total, statsData.success, statsData.failures, statsData.successRate, statsData.failureRate];
  var statsLabels = [lang.totalAttempts, lang.successes, lang.failures, lang.successRate, lang.failureRate];

  var statsHeaderText = new jsmaf.Text();
  statsHeaderText.text = '>SYSTEM STATISTICS';
  statsHeaderText.x = 50;
  statsHeaderText.y = 180;
  statsHeaderText.style = 'terminal_text';
  jsmaf.root.children.push(statsHeaderText);

  // Display each stat line
  for (var i = 0; i < statsImgKeys.length; i++) {
    var yPos = 220 + i * 30;
    if (typeof useImageText !== 'undefined' && useImageText) {
      var labelImg = new Image({
        url: textImageBase + statsImgKeys[i] + '.png',
        x: 70,
        y: yPos,
        width: 180,
        height: 25
      });
      jsmaf.root.children.push(labelImg);
      var valueText = new jsmaf.Text();
      valueText.text = String(statsValues[i]);
      valueText.x = 260;
      valueText.y = yPos;
      valueText.style = 'stats';
      jsmaf.root.children.push(valueText);
    } else {
      var lineText = new jsmaf.Text();
      lineText.text = ' ' + statsLabels[i] + ': ' + statsValues[i];
      lineText.x = 70;
      lineText.y = yPos;
      lineText.style = 'stats';
      jsmaf.root.children.push(lineText);
    }
  }
  
  var configOptions = [{
    key: 'autolapse',
    label: lang.autoLapse,
    imgKey: 'autoLapse',
    type: 'toggle'
  }, {
    key: 'autopoop',
    label: lang.autoPoop,
    imgKey: 'autoPoop',
    type: 'toggle'
  }, {
    key: 'autoclose',
    label: lang.autoClose,
    imgKey: 'autoClose',
    type: 'toggle'
  }, {
    key: 'music',
    label: lang.music,
    imgKey: 'music',
    type: 'toggle'
  }, {
    key: 'jb_behavior',
    label: lang.jbBehavior,
    imgKey: 'jbBehavior',
    type: 'cycle'
  }];
  
  var startY = 430;
  var buttonSpacing = 80;
  var leftMargin = 400;
  
  // Create menu items with terminal-style prompts and shadows
  for (var _i = 0; _i < configOptions.length; _i++) {
    var configOption = configOptions[_i];
    var yPos = startY + _i * buttonSpacing;
    
    // Green background panel - Fallout style
    var bgPanel = new Image({
      url: 'file:///assets/img/button_over_9.png',
      x: leftMargin - 40,
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
    
    // Selection marker (cursor)
    var marker = new jsmaf.Text();
    marker.text = '>';
    marker.x = leftMargin - 30;
    marker.y = yPos;
    marker.style = 'selected';
    marker.visible = false;
    buttonMarkers.push(marker);
    jsmaf.root.children.push(marker);
    
    // Shadow text (drawn first, behind main text)
    var shadowText = new jsmaf.Text();
    shadowText.text = configOption.label;
    shadowText.x = leftMargin + 3;
    shadowText.y = yPos + 3;
    shadowText.style = 'terminal_text_shadow';
    buttonShadows.push(shadowText);
    jsmaf.root.children.push(shadowText);
    
    // Menu item text
    var btnText;
    if (typeof useImageText !== 'undefined' && useImageText) {
      btnText = new Image({
        url: textImageBase + configOption.imgKey + '.png',
        x: leftMargin + 20,
        y: yPos - 5,
        width: 200,
        height: 50
      });
    } else {
      btnText = new jsmaf.Text();
      btnText.text = configOption.label;
      btnText.x = leftMargin;
      btnText.y = yPos;
      btnText.style = 'terminal_text';
    }
    buttonTexts.push(btnText);
    jsmaf.root.children.push(btnText);
    
    // Value display (toggle or cycle)
    if (configOption.type === 'toggle') {
      var checkmark = new Image({
        url: currentConfig[configOption.key] ? 'file:///assets/img/check_small_on.png' : 'file:///assets/img/check_small_off.png',
        x: leftMargin + 550,
        y: yPos - 5,
        width: 40,
        height: 40
      });
      valueTexts.push(checkmark);
      jsmaf.root.children.push(checkmark);
    } else {
      var valueLabel;
      if (typeof useImageText !== 'undefined' && useImageText) {
        valueLabel = new Image({
          url: textImageBase + jbBehaviorImgKeys[currentConfig.jb_behavior] + '.png',
          x: leftMargin + 400,
          y: yPos - 5,
          width: 150,
          height: 50
        });
      } else {
        valueLabel = new jsmaf.Text();
        valueLabel.text = jbBehaviorLabels[currentConfig.jb_behavior] || jbBehaviorLabels[0];
        valueLabel.x = leftMargin + 400;
        valueLabel.y = yPos;
        valueLabel.style = 'terminal_text';
      }
      valueTexts.push(valueLabel);
      jsmaf.root.children.push(valueLabel);
    }
  }
  
  // Back button
  var backY = startY + configOptions.length * buttonSpacing + 60;
  
  // Green background panel for back button
  var backBgPanel = new Image({
    url: 'file:///assets/img/button_over_9.png',
    x: leftMargin - 40,
    y: backY - 12,
    width: 600,
    height: 50
  });
  backBgPanel.alpha = 0.3;
  backBgPanel.color = 'rgb(0, 100, 0)';
  jsmaf.root.children.push(backBgPanel);
  
  var backButton = new Image({
    url: normalButtonImg,
    x: leftMargin - 50,
    y: backY - 10,
    width: 1100,
    height: 60
  });
  backButton.alpha = 0;
  buttons.push(backButton);
  jsmaf.root.children.push(backButton);
  
  var backMarker = new jsmaf.Text();
  backMarker.text = '>';
  backMarker.x = leftMargin - 30;
  backMarker.y = backY;
  backMarker.style = 'selected';
  backMarker.visible = false;
  buttonMarkers.push(backMarker);
  jsmaf.root.children.push(backMarker);
  
  // Back shadow text
  var backShadow = new jsmaf.Text();
  backShadow.text = lang.back;
  backShadow.x = leftMargin + 3;
  backShadow.y = backY + 3;
  backShadow.style = 'terminal_text_shadow';
  buttonShadows.push(backShadow);
  jsmaf.root.children.push(backShadow);
  
  var backText;
  if (typeof useImageText !== 'undefined' && useImageText) {
    backText = new Image({
      url: textImageBase + 'back.png',
      x: leftMargin + 20,
      y: backY - 5,
      width: 200,
      height: 50
    });
  } else {
    backText = new jsmaf.Text();
    backText.text = lang.back;
    backText.x = leftMargin;
    backText.y = backY;
    backText.style = 'terminal_text';
  }
  buttonTexts.push(backText);
  jsmaf.root.children.push(backText);
  
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
  
  function updateValueText(index) {
    var options = configOptions[index];
    var valueText = valueTexts[index];
    if (!options || !valueText) return;
    var key = options.key;
    if (options.type === 'toggle') {
      var value = currentConfig[key];
      valueText.url = value ? 'file:///assets/img/check_small_on.png' : 'file:///assets/img/check_small_off.png';
    } else {
      if (typeof useImageText !== 'undefined' && useImageText) {
        valueText.url = textImageBase + jbBehaviorImgKeys[currentConfig.jb_behavior] + '.png';
      } else {
        valueText.text = jbBehaviorLabels[currentConfig.jb_behavior] || jbBehaviorLabels[0];
      }
    }
  }
  
  function saveConfig() {
    if (!configLoaded) {
      log('Config not loaded yet, skipping save');
      return;
    }
    var configContent = 'const CONFIG = {\n';
    configContent += '    autolapse: ' + currentConfig.autolapse + ',\n';
    configContent += '    autopoop: ' + currentConfig.autopoop + ',\n';
    configContent += '    autoclose: ' + currentConfig.autoclose + ',\n';
    configContent += '    music: ' + currentConfig.music + ',\n';
    configContent += '    jb_behavior: ' + currentConfig.jb_behavior + '\n';
    configContent += '};\n\n';
    configContent += 'const payloads = [ //to be ran after jailbroken\n';
    for (var _i3 = 0; _i3 < userPayloads.length; _i3++) {
      configContent += '    "' + userPayloads[_i3] + '"';
      if (_i3 < userPayloads.length - 1) {
        configContent += ',';
      }
      configContent += '\n';
    }
    configContent += '];\n';
    fs.write('config.js', configContent, function (err) {
      if (err) {
        log('ERROR: Failed to save config: ' + err.message);
      } else {
        log('>> Config saved successfully');
      }
    });
  }
  
  function loadConfig() {
    fs.read('config.js', function (err, data) {
      if (err) {
        log('ERROR: Failed to read config: ' + err.message);
        return;
      }
      try {
        eval(data || ''); // eslint-disable-line no-eval
        if (typeof CONFIG !== 'undefined') {
          currentConfig.autolapse = CONFIG.autolapse || false;
          currentConfig.autopoop = CONFIG.autopoop || false;
          currentConfig.autoclose = CONFIG.autoclose || false;
          currentConfig.music = CONFIG.music !== false;
          currentConfig.jb_behavior = CONFIG.jb_behavior || 0;

          // Preserve user's payloads
          if (typeof payloads !== 'undefined' && Array.isArray(payloads)) {
            userPayloads = payloads.slice();
          }
          for (var _i4 = 0; _i4 < configOptions.length; _i4++) {
            updateValueText(_i4);
          }
          configLoaded = true;
          log('>> Config loaded successfully');
        }
      } catch (e) {
        log('ERROR: Failed to parse config: ' + e.message);
        configLoaded = true; // Allow saving even on error
      }
    });
  }
  
  function handleButtonPress() {
    if (currentButton === buttons.length - 1) {
      log('>> Restarting...');
      debugging.restart();
    } else if (currentButton < configOptions.length) {
      var option = configOptions[currentButton];
      var key = option.key;
      if (option.type === 'cycle') {
        currentConfig.jb_behavior = (currentConfig.jb_behavior + 1) % jbBehaviorLabels.length;
        log('>> ' + key + ' = ' + jbBehaviorLabels[currentConfig.jb_behavior]);
      } else {
        var boolKey = key;
        currentConfig[boolKey] = !currentConfig[boolKey];
        if (key === 'autolapse' && currentConfig.autolapse === true) {
          currentConfig.autopoop = false;
          for (var _i5 = 0; _i5 < configOptions.length; _i5++) {
            if (configOptions[_i5].key === 'autopoop') {
              updateValueText(_i5);
              break;
            }
          }
          log('>> autopoop disabled (autolapse enabled)');
        } else if (key === 'autopoop' && currentConfig.autopoop === true) {
          currentConfig.autolapse = false;
          for (var _i6 = 0; _i6 < configOptions.length; _i6++) {
            if (configOptions[_i6].key === 'autolapse') {
              updateValueText(_i6);
              break;
            }
          }
          log('>> autolapse disabled (autopoop enabled)');
        }
        log('>> ' + key + ' = ' + currentConfig[boolKey]);
      }
      updateValueText(currentButton);
      saveConfig();
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
    } else if (keyCode === 13) {
      log('>> Restarting...');
      debugging.restart();
    }
  };
  
  updateHighlight();
  loadConfig();
  log('>> ' + lang.configLoaded);
})();