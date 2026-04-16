#!/usr/bin/env node
// ============================================================
// GÉNÉRATEUR D'ICÔNES PWA — Ben-Couture
// Usage : node generate-icons.js
// Prérequis : npm install canvas (ou utiliser la version navigateur ci-dessous)
// ============================================================

// ── VERSION NAVIGATEUR (Console Chrome/Firefox) ─────────────
// Collez ce code dans la console DevTools pour générer et télécharger les icônes

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const PRIMARY = '#8B4513';
const SECONDARY = '#D4A843';
const EMOJI = '✂️';

function generateIcon(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Fond dégradé
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, PRIMARY);
  grad.addColorStop(1, '#A0522D');
  ctx.fillStyle = grad;

  // Fond arrondi (maskable = padding 10%)
  const r = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Cercle blanc central
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Emoji ciseaux
  ctx.font = `${size * 0.38}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(EMOJI, size / 2, size / 2 + size * 0.02);

  // Bandeau doré en bas (pour les grandes icônes)
  if (size >= 128) {
    ctx.fillStyle = SECONDARY;
    ctx.fillRect(0, size * 0.82, size, size * 0.18);
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.085}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BEN-COUTURE', size / 2, size * 0.915);
  }

  return canvas;
}

// Télécharger toutes les icônes
SIZES.forEach(size => {
  const canvas = generateIcon(size);
  const link = document.createElement('a');
  link.download = `icon-${size}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  console.log(`✅ icon-${size}.png généré`);
});

console.log('\n📁 Placez les fichiers téléchargés dans un dossier "icons/" à côté de index.html');
