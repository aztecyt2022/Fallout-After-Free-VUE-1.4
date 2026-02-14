function checkJailbroken() {
  fn.register(24, 'getuid', [], 'bigint');
  fn.register(23, 'setuid', ['number'], 'bigint');
  var uidBefore = fn.getuid();
  var uidBeforeVal = uidBefore instanceof BigInt ? uidBefore.lo : uidBefore;
  log('UID before setuid: ' + uidBeforeVal);
  log('Attempting setuid(0)...');
  try {
    var setuidResult = fn.setuid(0);
    var setuidRet = setuidResult instanceof BigInt ? setuidResult.lo : setuidResult;
    log('setuid returned: ' + setuidRet);
  } catch (e) {
    log('setuid threw exception: ' + e.toString());
  }
  var uidAfter = fn.getuid();
  var uidAfterVal = uidAfter instanceof BigInt ? uidAfter.lo : uidAfter;
  log('UID after setuid: ' + uidAfterVal);
  var jailbroken = uidAfterVal === 0;
  log(jailbroken ? 'Already jailbroken' : 'Not jailbroken');
  return jailbroken;
}