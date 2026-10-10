// build.js — يبني ملف index.html واحد مكتفي بذاته (كل الصور والصوت مدمجة Base64)
// التشغيل:  node build.js
const fs = require('fs');
const path = require('path');

const SRC_DIR = 'C:\\Users\\Ismai\\gift';
const HERE = __dirname;
const TEMPLATE = path.join(HERE, 'template.html');
const OUTPUT = path.join(HERE, 'index.html');

function dataURI(file, mime) {
  const p = path.join(SRC_DIR, file);
  if (!fs.existsSync(p)) throw new Error('ملف مفقود: ' + p);
  const b64 = fs.readFileSync(p).toString('base64');
  return 'data:' + mime + ';base64,' + b64;
}

// إيجاد ملف الصوت مهما كان اسمه العربي
function findAudio() {
  const files = fs.readdirSync(SRC_DIR);
  const audio = files.find(f => /\.(mp3|m4a|mpeg|wav|ogg)$/i.test(f) && !f.endsWith('.b64'));
  if (!audio) throw new Error('لم يتم إيجاد ملف صوتي في ' + SRC_DIR);
  return audio;
}

const jpg = (f) => dataURI(f, 'image/jpeg');

// قراءة أبعاد صورة JPEG (بدون مكتبات)
function jpegSize(file) {
  const b = fs.readFileSync(path.join(SRC_DIR, file));
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1];
    if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
    const len = b.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
      return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    }
    i += 2 + len;
  }
  return null;
}

const puzzleSize = jpegSize('1.jpeg');
const puzzleRatio = puzzleSize ? (puzzleSize.w + ' / ' + puzzleSize.h) : '1';

const assets = {
  eye: jpg('2.jpeg'),
  puzzle: jpg('1.jpeg'),
  music: ['11.jpeg', '111.jpeg', '1111.jpeg', '12.jpeg', '121212.jpeg'].map(jpg),
  roses: [
    '12133.jpeg', '212.jpeg', '21212.jpeg', '2121222.jpeg',
    '33.jpeg', 'WhatsApp Image 2026-10-10 at 7.15.23 PM.jpeg', '1.jpeg'
  ].map(jpg)
};

const audioFile = findAudio();
const audioURI = dataURI(audioFile, 'audio/mpeg');

let html = fs.readFileSync(TEMPLATE, 'utf8');
html = html.replace('__ASSETS_JSON__', () => JSON.stringify(assets));
html = html.replace('__AUDIO_SRC__', () => audioURI);
html = html.replace('__PUZZLE_RATIO__', () => puzzleRatio);

if (html.includes('__ASSETS_JSON__') || html.includes('__AUDIO_SRC__') || html.includes('__PUZZLE_RATIO__')) {
  throw new Error('فشل الاستبدال: توجد علامات متبقية');
}
if (html.includes('C:/Users/Ismai') || html.includes('C:\\Users\\Ismai')) {
  throw new Error('تحذير: يوجد مسار محلي متبقٍ في الملف');
}

fs.writeFileSync(OUTPUT, html, 'utf8');

const sizeMB = (Buffer.byteLength(html) / 1024 / 1024).toFixed(2);
console.log('تم بناء الملف بنجاح: ' + OUTPUT);
console.log('حجم الملف: ' + sizeMB + ' ميجابايت');
console.log('ملف الصوت المستخدم: ' + audioFile);
