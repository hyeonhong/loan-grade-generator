/*
* @author  31
* @date   2018-05-29
*/

const crypto = require('crypto');

function encrypt(text, key) {
  const iv = String.fromCharCode(0).repeat(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return Buffer.from(encrypted).toString('base64');  // buffer to base64
}

function decrypt(encrypted, key) {
  const iv = String.fromCharCode(0).repeat(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

function getKey(div) {
  let key;

  // 웹서비스와 통신용
  if (div === 'WEB') {
    key = 'eidkfk3kd93ji3920dsioj39eijfi932';
  }
  // 솔루션 암호화
  else if (div === 'SOL') {
    key = 'asiren30dkj3k9dksaalkdkfjk2fio33';
  }
  // 쿠키 사용
  else if (div === 'COK') {
    key = 'kdjf39dkjf20dsikfj3kj49dfklswjd1';
  }
  // report API 용
  else if (div === 'REPORT') {
    key = 'MIIBOQIBAAJAVY6quuzCwyOWzymJ7C4z';
  }

  return key;
}

module.exports = {
  encrypt,
  decrypt,
  getKey
}
