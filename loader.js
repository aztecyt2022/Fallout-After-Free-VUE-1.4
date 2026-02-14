// Load binloader first (just defines the function, doesn't execute)

// Now load userland and lapse
// Check if libc_addr is defined
if (typeof libc_addr === 'undefined') {
  include('userland.js');
}
include('stats-tracker.js');
include('binloader.js');
include('lapse.js');
include('kernel.js');
include('check-jailbroken.js');
include('stats-tracker.js');
log('All scripts loaded');

// Increment total attempts
stats.load();

// Terminal color scheme - Red hacker theme
new Style({
  name: 'terminal_text',
  color: 'rgb(255, 50, 50)',
  size: 32
});
new Style({
  name: 'success_text',
  color: 'rgb(0, 255, 65)',
  size: 40
});
new Style({
  name: 'prompt',
  color: 'rgb(200, 200, 200)',
  size: 24
});

function show_success() {
  setTimeout(() => {
    jsmaf.root.children.length = 0;
    
    // Background video from vid folder
    try {
      var bgVideo = new jsmaf.Video();
      bgVideo.x = 0;
      bgVideo.y = 0;
      bgVideo.width = 1920;
      bgVideo.height = 1080;
      bgVideo.alpha = 0.15;
      bgVideo.loop = true;
      try {
        bgVideo.open('file:///../vid/vid.m3u8');
      } catch (e1) {
        try {
          bgVideo.open('file:///../vid/vid.mp4');
        } catch (e2) {
          bgVideo.open('file:///../vid/vid.ts');
        }
      }
      bgVideo.play();
      jsmaf.root.children.push(bgVideo);
    } catch (e) {
      log('>> Background video not loaded: ' + e.message);
    }
    
    // Solid black background for terminal look (fallback)
    var background = new Image({
      url: 'file:///../download0/img/multiview_bg_VAF.png',
      x: 0,
      y: 0,
      width: 1920,
      height: 1080
    });
    background.alpha = 0.05;
    jsmaf.root.children.push(background);
    
    // Success message with terminal styling
    var successBox1 = new jsmaf.Text();
    successBox1.text = '╔═══════════════════════════════════════════════════════════╗';
    successBox1.x = 300;
    successBox1.y = 400;
    successBox1.style = 'success_text';
    jsmaf.root.children.push(successBox1);
    
    var successText = new jsmaf.Text();
    successText.text = '█ JAILBREAK SUCCESSFUL █';
    successText.x = 560;
    successText.y = 460;
    successText.style = 'success_text';
    jsmaf.root.children.push(successText);
    
    var successBox2 = new jsmaf.Text();
    successBox2.text = '╚═══════════════════════════════════════════════════════════╝';
    successBox2.x = 300;
    successBox2.y = 520;
    successBox2.style = 'success_text';
    jsmaf.root.children.push(successBox2);
    
    var statusText = new jsmaf.Text();
    statusText.text = '>> SYSTEM EXPLOITATION COMPLETE';
    statusText.x = 620;
    statusText.y = 580;
    statusText.style = 'prompt';
    jsmaf.root.children.push(statusText);
    
    log('Logging Success...');
    stats.incrementSuccess();
  }, 2000);
}

var audio = new jsmaf.AudioClip();
audio.volume = 0.5; // 50% volume
audio.open('file://../download0/sfx/bgm.wav');
var is_jailbroken = checkJailbroken();

// Check if exploit has completed successfully
function is_exploit_complete() {
  // Check if we're actually jailbroken
  fn.register(24, 'getuid', [], 'bigint');
  fn.register(585, 'is_in_sandbox', [], 'bigint');
  try {
    var uid = fn.getuid();
    var sandbox = fn.is_in_sandbox();
    // Should be root (uid=0) and not sandboxed (0)
    if (!uid.eq(0) || !sandbox.eq(0)) {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
}
function write64(addr, val) {
  mem.view(addr).setBigInt(0, new BigInt(val), true);
}
function read8(addr) {
  return mem.view(addr).getUint8(0);
}
function malloc(size) {
  return mem.malloc(size);
}
function get_fwversion() {
  var buf = malloc(0x8);
  var size = malloc(0x8);
  write64(size, 0x8);
  if (sysctlbyname('kern.sdk_version', buf, size, 0, 0)) {
    var byte1 = Number(read8(buf.add(2))); // Minor version (first byte)
    var byte2 = Number(read8(buf.add(3))); // Major version (second byte)

    var version = byte2.toString(16) + '.' + byte1.toString(16).padStart(2, '0');
    return version;
  }
  return null;
}
var FW_VERSION = get_fwversion();
if (FW_VERSION === null) {
  log('ERROR: Failed to determine FW version');
  throw new Error('Failed to determine FW version');
}
var compare_version = (a, b) => {
  var a_arr = a.split('.');
  var amaj = Number(a_arr[0]);
  var amin = Number(a_arr[1]);
  var b_arr = b.split('.');
  var bmaj = Number(b_arr[0]);
  var bmin = Number(b_arr[1]);
  return amaj === bmaj ? amin - bmin : amaj - bmaj;
};
if (!is_jailbroken) {
  var jb_behavior = typeof CONFIG !== 'undefined' && typeof CONFIG.jb_behavior === 'number' ? CONFIG.jb_behavior : 0;
  stats.incrementTotal();
  utils.notify(FW_VERSION + ' Detected!');
  var use_lapse = false;
  if (jb_behavior === 1) {
    log('JB Behavior: NetControl (forced)');
    include('netctrl_c0w_twins.js');
  } else if (jb_behavior === 2) {
    log('JB Behavior: Lapse (forced)');
    use_lapse = true;
    lapse();
  } else {
    log('JB Behavior: Auto Detect');
    if (compare_version(FW_VERSION, '7.00') >= 0 && compare_version(FW_VERSION, '12.02') <= 0) {
      use_lapse = true;
      lapse();
    } else if (compare_version(FW_VERSION, '12.50') >= 0 && compare_version(FW_VERSION, '13.00') <= 0) {
      include('netctrl_c0w_twins.js');
    }
  }

  // Only wait for lapse - netctrl handles its own completion
  if (use_lapse) {
    var start_time = Date.now();
    var max_wait_seconds = 5;
    var max_wait_ms = max_wait_seconds * 1000;
    while (!is_exploit_complete()) {
      var elapsed = Date.now() - start_time;
      if (elapsed > max_wait_ms) {
        log('ERROR: Timeout waiting for exploit to complete (' + max_wait_seconds + ' seconds)');
        throw new Error('Lapse timeout');
      }

      // Poll every 500ms
      var poll_start = Date.now();
      while (Date.now() - poll_start < 500) {
        // Busy wait
      }
    }
    show_success();
    var total_wait = ((Date.now() - start_time) / 1000).toFixed(1);
    log('Exploit completed successfully after ' + total_wait + ' seconds');
  }
  // Only run binloader for lapse - netctrl handles its own
  if (use_lapse) {
    log('Initializing binloader...');
    try {
      binloader_init();
      log('Binloader initialized and running!');
    } catch (e) {
      log('ERROR: Failed to initialize binloader');
      log('Error message: ' + e.message);
      log('Error name: ' + e.name);
      if (e.stack) {
        log('Stack trace: ' + e.stack);
      }
      throw e;
    }
  }
} else {
  utils.notify('Already Jailbroken!');
  include('main-menu.js');
}
function run_binloader() {
  log('Initializing binloader...');
  try {
    binloader_init();
    log('Binloader initialized and running!');
  } catch (e) {
    log('ERROR: Failed to initialize binloader');
    log('Error message: ' + e.message);
    log('Error name: ' + e.name);
    if (e.stack) {
      log('Stack trace: ' + e.stack);
    }
    throw e;
  }
}