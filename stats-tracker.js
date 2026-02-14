// Statistics tracker using syscalls for direct file I/O

// Register read syscall if not already registered
include('check-jailbroken.js');
log('check-jailbroken.js loaded');
var stats = {
  total: 0,
  success: 0,
  filepath: '/download0/stats.json',
  // Load stats from file using syscalls
  load: function () {
    try {
      fn.register(0x3, 'read', ['bigint', 'bigint', 'number'], 'bigint');
      fn.register(0x4, 'write', ['bigint', 'bigint', 'number'], 'bigint');
      fn.register(0x5, 'open', ['string', 'number', 'number'], 'bigint');
      fn.register(0x6, 'close', ['bigint'], 'bigint');
      var fd = fn.open(this.filepath, 0, 0); // O_RDONLY
      if (fd.lt(0)) {
        log('[STATS] No stats file found, starting fresh');
        this.total = 0;
        this.success = 0;
        return;
      }

      // Read file content
      var buf = mem.malloc(1024);
      var bytesRead = fn.read(fd, buf, 1024);
      fn.close(fd);
      if (bytesRead.neq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
        // Convert buffer to string
        var str = '';
        for (var i = 0; i < Number(bytesRead); i++) {
          str += String.fromCharCode(mem.view(buf.add(i)).getUint8(0));
        }
        try {
          var parsed = JSON.parse(str);
          this.total = parsed.total || 0;
          this.success = parsed.success || 0;
          
          // Ensure success never exceeds total
          if (this.success > this.total) {
            log('[STATS] Warning: success > total, correcting...');
            this.success = this.total;
          }
          
          log('[STATS] Loaded: total=' + this.total + ', success=' + this.success);
        } catch (e) {
          log('[STATS] Failed to parse stats file: ' + e);
          this.total = 0;
          this.success = 0;
        }
      }
    } catch (e) {
      var _stack;
      log('[STATS] Error loading stats: ' + e);
      log((_stack = e.stack) !== null && _stack !== void 0 ? _stack : '');
      this.total = 0;
      this.success = 0;
    }
  },
  // Save stats to file using syscalls
  save: function () {
    try {
      fn.register(0x3, 'read', ['bigint', 'bigint', 'number'], 'bigint');
      fn.register(0x4, 'write', ['bigint', 'bigint', 'number'], 'bigint');
      fn.register(0x5, 'open', ['string', 'number', 'number'], 'bigint');
      fn.register(0x6, 'close', ['bigint'], 'bigint');
      this.filepath = checkJailbroken() ? '/mnt/sandbox/download/CUSA00960/stats.json' : '/download0/stats.json';
      
      // Ensure success never exceeds total before saving
      if (this.success > this.total) {
        log('[STATS] Warning: success > total, correcting before save...');
        this.success = this.total;
      }
      
      var data = JSON.stringify({
        total: this.total,
        success: this.success
      });

      // Open file for writing (O_WRONLY | O_CREAT | O_TRUNC)
      // O_WRONLY = 1, O_CREAT = 0x200, O_TRUNC = 0x400
      var fd = fn.open(this.filepath, 0x601, 0x1FF); // 0x1FF = 0777 permissions

      if (fd.lt(0)) {
        log('[STATS] Failed to open file for writing');
        return false;
      }

      // Write data to file
      var buf = mem.malloc(data.length);
      for (var i = 0; i < data.length; i++) {
        mem.view(buf.add(i)).setUint8(0, data.charCodeAt(i));
      }
      var bytesWritten = fn.write(fd, buf, data.length);
      fn.close(fd);
      if (bytesWritten.eq(data.length)) {
        log('[STATS] Saved: total=' + this.total + ', success=' + this.success);
        return true;
      } else {
        log('[STATS] Failed to write all data');
        return false;
      }
    } catch (e) {
      log('[STATS] Error saving stats: ' + e);
      return false;
    }
  },
  // Increment total counter
  incrementTotal: function () {
    this.total++;
    log('[STATS] Total incremented to: ' + this.total);
    this.save();
  },
  // Increment success counter
  incrementSuccess: function () {
    this.success++;
    // Ensure success doesn't exceed total
    if (this.success > this.total) {
      this.success = this.total;
    }
    log('[STATS] Success incremented to: ' + this.success);
    this.save();
  },
  // Get current stats
  get: function () {
    // Ensure values are non-negative
    var safeTotal = Math.max(0, this.total);
    var safeSuccess = Math.max(0, Math.min(this.success, safeTotal));
    var safeFailures = Math.max(0, safeTotal - safeSuccess);
    
    return {
      total: safeTotal,
      success: safeSuccess,
      failures: safeFailures,
      failureRate: safeTotal > 0 ? (safeFailures / safeTotal * 100).toFixed(2) + '%' : '0.00%',
      successRate: safeTotal > 0 ? (safeSuccess / safeTotal * 100).toFixed(2) + '%' : '0.00%'
    };
  },
  // Print current stats
  print: function () {
    var current = this.get();
    log('[STATS] ====== Statistics ======');
    log('[STATS] Total:        ' + current.total);
    log('[STATS] Success:      ' + current.success);
    log('[STATS] Failures:     ' + current.failures);
    log('[STATS] Success Rate: ' + current.successRate);
    log('[STATS] Failure Rate: ' + current.failureRate);
    log('[STATS] =======================');
  },
  // Reset stats
  reset: function () {
    this.total = 0;
    this.success = 0;
    log('[STATS] Stats reset');
    this.save();
  }
};

// Example usage:
// stats.load()
// stats.incrementTotal()
// stats.incrementSuccess()
// stats.print()