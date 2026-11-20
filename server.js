// --- DEPENDANCES ---
const express = require('express');
const http = require('http');
const crypto = require('crypto');
const { Server } = require('socket.io');

// --- CONSTANTES ---
const PORT = process.env.PORT || 3000;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TYPES_OBJETS = ['loupe', 'biere', 'menottes'];
const PV_MAX = 3;
const MANCHES_POUR_GAGNER = 2;
const DELAI_TOUR_MS = 30000;
const DELAI_DECONNEXION_MS = 15000;
const PURGE_MS = 2 * 60 * 60 * 1000;

// --- PAGE ---
const PAGE = String.raw`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Comme sur des roulettes</title>
<style>
* { box-sizing: border-box; } html, body { margin: 0; padding: 0; background: #0B0B0C; color: #EDEAE4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; } body { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 40px 20px 110px 20px; font-size: 15px; }
#barre { position: fixed; top: 0; left: 0; height: 1px; background: #EDEAE4; width: 100%; } #flash { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #EDEAE4; opacity: 0; pointer-events: none; transition: opacity 0.12s; } #btn-son { position: fixed; top: 12px; right: 12px; background: none; border: 0; color: #EDEAE4; font-size: 12px; letter-spacing: 2px; cursor: pointer; padding: 8px; }
.ecran { display: none; width: 100%; max-width: 520px; text-align: center; } .ecran.visible { display: block; } .titre { font-size: 22px; letter-spacing: 3px; margin: 24px 0 32px 0; } .regle { font-size: 12px; letter-spacing: 1px; margin: 10px 0; opacity: 0.85; }
.champ { display: block; width: 100%; max-width: 280px; margin: 12px auto; background: none; border: 0; color: #EDEAE4; font-size: 15px; text-align: center; padding: 12px 8px; outline: none; letter-spacing: 2px; } .champ::placeholder { color: #EDEAE4; opacity: 0.35; } .btn { background: none; border: 0; color: #EDEAE4; font-size: 15px; letter-spacing: 2px; cursor: pointer; padding: 14px 18px; text-transform: uppercase; } .btn:disabled { opacity: 0.25; cursor: default; } .btn-principal { font-size: 22px; margin-top: 8px; }
.lien { font-size: 12px; letter-spacing: 1px; margin: 16px 0; word-break: break-all; opacity: 0.85; } .code { font-size: 22px; letter-spacing: 6px; margin: 16px 0; } #zone-table { display: flex; flex-direction: column; align-items: center; } .pseudo { font-size: 15px; letter-spacing: 2px; margin: 8px 0; } .pv-ligne { margin: 6px 0 10px 0; min-height: 10px; }
.pv { width: 10px; height: 10px; background: #EDEAE4; display: inline-block; margin: 0 3px; } .pv.perdu { opacity: 0.18; } #revolver { width: 200px; height: 200px; max-width: 74vw; display: block; margin: 8px auto; } .grad { stroke: #EDEAE4; stroke-width: 1; transition: opacity 0.3s; } .grad.consommee { opacity: 0.15; }
#chien { stroke: #EDEAE4; stroke-width: 1; transition: transform 0.15s; transform-origin: 100px 100px; } #chien.retombe { transform: rotate(20deg); } #composition { font-size: 15px; letter-spacing: 2px; margin: 6px 0 4px 0; } .reelle { color: #8A2B2B; } #indication { font-size: 12px; letter-spacing: 1px; min-height: 18px; margin: 6px 0; opacity: 0.85; }
#zone-objets { display: flex; justify-content: center; gap: 24px; margin: 20px 0 8px 0; min-height: 72px; } .objet { width: 72px; background: none; border: 0; color: #EDEAE4; cursor: pointer; padding: 4px; text-align: center; } .objet.vide { visibility: hidden; } .objet svg { display: block; margin: 0 auto 6px auto; } .objet span { font-size: 12px; letter-spacing: 1px; }
#zone-actions { position: relative; display: flex; justify-content: center; gap: 32px; margin-top: 12px; min-height: 52px; align-items: center; } #btn-esquive { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); background: #0B0B0C; display: none; } #btn-esquive.visible { display: block; } #chat-btn { position: fixed; right: 16px; bottom: 16px; background: none; border: 0; color: #EDEAE4; cursor: pointer; padding: 8px; z-index: 10; }
#chat-panneau { position: fixed; right: 0; bottom: 0; width: min(360px, 100vw); height: 40vh; background: #0B0B0C; display: none; flex-direction: column; box-shadow: 0 -4px 24px rgba(0,0,0,0.6); z-index: 11; } #chat-panneau.ouvert { display: flex; } #chat-messages { flex: 1; overflow-y: auto; padding: 16px; text-align: left; } .msg { font-size: 12px; margin: 6px 0; letter-spacing: 0.5px; } .msg b { font-weight: normal; letter-spacing: 1px; }
#chat-forme { display: flex; padding: 8px; } #chat-texte { flex: 1; background: none; border: 0; color: #EDEAE4; font-size: 15px; padding: 8px; outline: none; } #chat-texte::placeholder { color: #EDEAE4; opacity: 0.35; } #vainqueur { font-size: 22px; letter-spacing: 3px; margin: 32px 0; }
@media (orientation: landscape) and (min-width: 700px) { body { padding-top: 56px; } .ecran { max-width: 900px; } #zone-table { flex-direction: row; justify-content: center; align-items: center; gap: 56px; } #col-gauche, #col-droite { width: 180px; } }
</style>
</head>
<body>
<div id="barre"></div>
<div id="flash"></div>
<button id="btn-son" type="button">SON</button>
<div id="ecran-accueil" class="ecran visible">
  <div class="titre">COMME SUR DES ROULETTES</div>
  <div class="regle">3 PV. 2 MANCHES GAGNÉES.</div>
  <div class="regle">6 CHAMBRES : 2 RÉELLES, 4 À BLANC.</div>
  <div class="regle">À VOTRE TOUR : SOI OU ADVERSAIRE.</div>
  <div class="regle">OBJETS GRATUITS. TIR = FIN DE TOUR.</div>
  <div class="regle">BLANC SUR SOI = TOUR CONSERVÉ.</div>
  <div class="regle">ESQUIVE : 1 PAR MANCHE, PENDANT L'ARMEMENT.</div>
  <div class="regle">30 S PAR TOUR, SINON ACTION AU SORT.</div>
  <div class="regle">BARILLET VIDE = RECHARGEMENT.</div>
  <input id="pseudo" class="champ" maxlength="20" placeholder="PSEUDO" autocomplete="off">
  <input id="code" class="champ" maxlength="4" placeholder="CODE" autocomplete="off">
  <button id="btn-creer" class="btn btn-principal" type="button">CRÉER</button>
  <button id="btn-rejoindre" class="btn" type="button">REJOINDRE</button>
  <button id="btn-rapide" class="btn" type="button">PARTIE RAPIDE</button>
  <div id="accueil-erreur" class="regle"></div>
</div>
<div id="ecran-attente" class="ecran">
  <div class="titre">EN ATTENTE</div>
  <div class="code" id="attente-code"></div>
  <div class="lien" id="attente-lien"></div>
  <button id="btn-copier" class="btn" type="button">COPIER</button>
  <div class="regle">2 JOUEURS REQUIS.</div>
</div>
<div id="ecran-table" class="ecran">
  <div id="zone-table">
    <div id="col-gauche">
      <div id="pseudo-haut" class="pseudo"></div>
      <div id="pv-haut" class="pv-ligne"></div>
    </div>
    <div id="col-centre">
      <svg id="revolver" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="84" fill="none" stroke="#EDEAE4" stroke-width="1"></circle>
        <line x1="100" y1="16" x2="100" y2="0" stroke="#EDEAE4" stroke-width="1"></line>
        <line id="grad0" class="grad" x1="100" y1="30" x2="100" y2="16"></line>
        <line id="grad1" class="grad" x1="160.6" y1="65" x2="172.7" y2="58"></line>
        <line id="grad2" class="grad" x1="160.6" y1="135" x2="172.7" y2="142"></line>
        <line id="grad3" class="grad" x1="100" y1="170" x2="100" y2="184"></line>
        <line id="grad4" class="grad" x1="39.4" y1="135" x2="27.3" y2="142"></line>
        <line id="grad5" class="grad" x1="39.4" y1="65" x2="27.3" y2="58"></line>
        <line id="chien" x1="100" y1="100" x2="100" y2="52"></line>
      </svg>
      <div id="composition"><span id="nb-reelles" class="reelle">0</span> · <span id="nb-blancs">0</span></div>
      <div id="indication"></div>
    </div>
    <div id="col-droite">
      <div id="pseudo-bas" class="pseudo"></div>
      <div id="pv-bas" class="pv-ligne"></div>
    </div>
  </div>
  <div id="zone-objets">
    <button id="objet0" class="objet vide" type="button"></button>
    <button id="objet1" class="objet vide" type="button"></button>
  </div>
  <div id="zone-actions">
    <button id="btn-soi" class="btn" type="button">SOI</button>
    <button id="btn-adv" class="btn" type="button">ADVERSAIRE</button>
    <button id="btn-esquive" class="btn" type="button">SE BAISSER</button>
  </div>
</div>
<div id="ecran-fin" class="ecran">
  <div class="titre">FIN</div>
  <div id="vainqueur"></div>
  <button id="btn-revanche" class="btn btn-principal" type="button">REVANCHE</button>
</div>
<button id="chat-btn" type="button" aria-label="Chat">
  <svg width="22" height="22" viewBox="0 0 22 22"><rect x="2" y="4" width="18" height="12" fill="none" stroke="#EDEAE4" stroke-width="1"></rect><line x1="6" y1="16" x2="6" y2="20" stroke="#EDEAE4" stroke-width="1"></line><line x1="6" y1="8" x2="16" y2="8" stroke="#EDEAE4" stroke-width="1"></line><line x1="6" y1="12" x2="13" y2="12" stroke="#EDEAE4" stroke-width="1"></line></svg>
</button>
<div id="chat-panneau">
  <div id="chat-messages"></div>
  <form id="chat-forme">
    <input id="chat-texte" maxlength="200" placeholder="MESSAGE" autocomplete="off">
    <button class="btn" type="submit">OK</button>
  </form>
</div>
<script src="/socket.io/socket.io.js"></script>
<script>
var socket = null;
var monCode = '';
var monPseudo = '';
var monJeton = '';
var etat = null;
var premierTourVu = false;
var sonActif = true;
var contexte = null;
var audioCtx = null;
function $(id) { return document.getElementById(id); }
function afficher(id) {
  var ecrans = ['ecran-accueil', 'ecran-attente', 'ecran-table', 'ecran-fin'];
  for (var i = 0; i < ecrans.length; i++) {
    $(ecrans[i]).classList.remove('visible');
  }
  $(id).classList.add('visible');
}
function audio() {
  if (!audioCtx) {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC) { audioCtx = new AC(); }
  }
  if (audioCtx && audioCtx.state === 'suspended') { audioCtx.resume(); }
  return audioCtx;
}
function sonClic() {
  if (!sonActif) { return; }
  var ctx = audio();
  if (!ctx) { return; }
  var o = ctx.createOscillator();
  var g = ctx.createGain();
  o.type = 'square';
  o.frequency.value = 1800;
  g.gain.value = 0.06;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + 0.04);
}
function sonChien() {
  if (!sonActif) { return; }
  var ctx = audio();
  if (!ctx) { return; }
  var o = ctx.createOscillator();
  var g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(600, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);
  g.gain.value = 0.05;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + 0.14);
}
function sonCoup() {
  if (!sonActif) { return; }
  var ctx = audio();
  if (!ctx) { return; }
  var len = Math.floor(ctx.sampleRate * 0.25);
  var buf = ctx.createBuffer(1, len, ctx.sampleRate);
  var data = buf.getChannelData(0);
  for (var i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  var src = ctx.createBufferSource();
  src.buffer = buf;
  var g = ctx.createGain();
  g.gain.value = 0.35;
  var f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 1200;
  src.connect(f);
  f.connect(g);
  g.connect(ctx.destination);
  src.start();
}
function flashBlanc() {
  var f = $('flash');
  f.style.opacity = '1';
  setTimeout(function() { f.style.opacity = '0'; }, 90);
}
function retombeChien() {
  var c = $('chien');
  c.classList.add('retombe');
  setTimeout(function() { c.classList.remove('retombe'); }, 180);
}
function glyphObjet(type) {
  if (type === 'loupe') {
    return '<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="12" cy="12" r="8" fill="none" stroke="#EDEAE4" stroke-width="1"></circle><line x1="18" y1="18" x2="25" y2="25" stroke="#EDEAE4" stroke-width="1"></line></svg><span>LOUPE</span>';
  }
  if (type === 'biere') {
    return '<svg width="28" height="28" viewBox="0 0 28 28"><rect x="8" y="8" width="12" height="12" fill="none" stroke="#EDEAE4" stroke-width="1" transform="rotate(20 14 14)"></rect></svg><span>BIÈRE</span>';
  }
  return '<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="9" cy="14" r="6" fill="none" stroke="#EDEAE4" stroke-width="1"></circle><circle cx="19" cy="14" r="6" fill="none" stroke="#EDEAE4" stroke-width="1"></circle></svg><span>MENOTTES</span>';
}
function rendrePv(el, pv) {
  el.innerHTML = '';
  for (var i = 0; i < 3; i++) {
    var d = document.createElement('span');
    d.className = 'pv' + (i < pv ? '' : ' perdu');
    el.appendChild(d);
  }
}
function rendreObjets(items) {
  var slots = [$('objet0'), $('objet1')];
  for (var i = 0; i < 2; i++) {
    var b = slots[i];
    if (i < items.length) {
      b.className = 'objet';
      b.innerHTML = glyphObjet(items[i]);
      b.setAttribute('data-type', items[i]);
    } else {
      b.className = 'objet vide';
      b.innerHTML = '';
      b.removeAttribute('data-type');
    }
  }
}
function rendre(e) {
  etat = e;
  if (!e) { return; }
  if (e.statut === 'attente') {
    afficher('ecran-attente');
    $('attente-code').textContent = e.code || '';
    var lien = window.location.origin + '/?code=' + (e.code || '');
    $('attente-lien').textContent = lien;
    $('barre').style.width = '100%';
    return;
  }
  if (e.statut === 'termine') {
    afficher('ecran-fin');
    var v = e.vainqueur || '';
    $('vainqueur').textContent = v ? ('VAINQUEUR : ' + v) : '';
    $('barre').style.width = '100%';
    return;
  }
  afficher('ecran-table');
  var joueurs = e.joueurs || [];
  var moi = null;
  var autre = null;
  for (var i = 0; i < joueurs.length; i++) {
    if (joueurs[i].estVous) { moi = joueurs[i]; } else { autre = joueurs[i]; }
  }
  if (!moi || !autre) { return; }
  $('pseudo-haut').textContent = autre.pseudo || '';
  $('pseudo-bas').textContent = moi.pseudo || '';
  rendrePv($('pv-haut'), autre.pv || 0);
  rendrePv($('pv-bas'), moi.pv || 0);
  var restant = e.restant || { reelles: 0, blancs: 0 };
  $('nb-reelles').textContent = String(restant.reelles || 0);
  $('nb-blancs').textContent = String(restant.blancs || 0);
  var consomme = e.consomme || 0;
  for (var g = 0; g < 6; g++) {
    var el = $('grad' + g);
    if (el) {
      if (g < consomme) { el.classList.add('consommee'); } else { el.classList.remove('consommee'); }
    }
  }
  rendreObjets(moi.items || []);
  var monTour = e.tourEstMoi === true;
  var enArme = e.etat === 'arme';
  $('btn-soi').disabled = !(monTour && !enArme);
  $('btn-adv').disabled = !(monTour && !enArme);
  var peutEsquiver = enArme && e.cibleEstMoi === true && (moi.esquives || 0) > 0;
  if (peutEsquiver) { $('btn-esquive').classList.add('visible'); } else { $('btn-esquive').classList.remove('visible'); }
  var ind = $('indication');
  if (contexte) {
    ind.textContent = contexte;
  } else if (!premierTourVu && monTour && e.etat === 'tour') {
    ind.textContent = 'A : SOI — E : ADVERSAIRE';
    premierTourVu = true;
  } else {
    ind.textContent = '';
  }
  var manches = e.manches || [];
  if (manches.length === 2) {
    ind.textContent = ind.textContent || ('MANCHES ' + String(manches[0]) + ' — ' + String(manches[1]));
  }
}
function afficherChat(pseudo, texte) {
  var zone = $('chat-messages');
  var d = document.createElement('div');
  d.className = 'msg';
  var b = document.createElement('b');
  b.textContent = pseudo + ' : ';
  var s = document.createElement('span');
  s.textContent = texte;
  d.appendChild(b);
  d.appendChild(s);
  zone.appendChild(d);
  zone.scrollTop = zone.scrollHeight;
}
function connecter() {
  if (typeof io === 'undefined') { return; }
  socket = io();
  socket.on('connect', function() {
    var stocke = null;
    try { stocke = localStorage.getItem('roulette'); } catch (err) { stocke = null; }
    if (stocke) {
      try {
        var o = JSON.parse(stocke);
        if (o && o.code && o.jeton) {
          socket.emit('reconnect', { code: o.code, jeton: o.jeton });
        }
      } catch (err2) {}
    }
  });
  socket.on('salon', function(d) {
    if (!d) { return; }
    monCode = d.code || '';
    if (d.jeton) {
      monJeton = d.jeton;
      try { localStorage.setItem('roulette', JSON.stringify({ code: monCode, jeton: monJeton })); } catch (err) {}
    }
    if (monCode && monCode !== 'ATTENTE') {
      afficher('ecran-attente');
      $('attente-code').textContent = monCode;
      var lien = window.location.origin + '/?code=' + monCode;
      $('attente-lien').textContent = lien;
    }
  });
  socket.on('etat', function(e) { rendre(e); });
  socket.on('tir', function() { sonClic(); sonChien(); retombeChien(); });
  socket.on('flash', function(d) {
    flashBlanc();
    if (d && d.type === 'loupe') {
      contexte = d.reelle ? 'RÉELLE' : 'BLANC';
      setTimeout(function() { contexte = null; if (etat) { rendre(etat); } }, 2500);
      if (etat) { rendre(etat); }
    } else {
      sonCoup();
    }
  });
  socket.on('esquive', function(d) {
    if (d && d.joueur) {
      contexte = 'ESQUIVE : ' + d.joueur;
      setTimeout(function() { contexte = null; if (etat) { rendre(etat); } }, 2000);
    }
  });
  socket.on('degat', function(d) {
    if (d && d.joueur) {
      contexte = d.joueur + ' : ' + String(d.pv || 0) + ' PV';
      setTimeout(function() { contexte = null; if (etat) { rendre(etat); } }, 2000);
    }
  });
  socket.on('rechargement', function() { sonClic(); });
  socket.on('manche_fin', function(d) {
    if (d && d.vainqueur) {
      contexte = 'MANCHE : ' + d.vainqueur;
      setTimeout(function() { contexte = null; if (etat) { rendre(etat); } }, 2200);
    }
  });
  socket.on('fin', function(d) {
    if (d && d.vainqueur) {
      $('vainqueur').textContent = 'VAINQUEUR : ' + d.vainqueur;
    }
  });
  socket.on('chat', function(d) {
    if (d) { afficherChat(d.pseudo || '', d.texte || ''); }
  });
  socket.on('erreur', function(d) {
    var msg = '';
    if (d && d.message) { msg = d.message; }
    $('accueil-erreur').textContent = msg;
    if (msg) {
      contexte = msg;
      setTimeout(function() { contexte = null; if (etat) { rendre(etat); } }, 2000);
    }
  });
}
function pseudoSaisi() {
  var v = $('pseudo').value || '';
  v = v.trim();
  if (!v) { v = 'JOUEUR'; }
  return v.slice(0, 20);
}
function init() {
  connecter();
  var params = new URLSearchParams(window.location.search);
  var codeParam = params.get('code') || '';
  var solo = params.get('solo') || '';
  if (codeParam) { $('code').value = codeParam.toUpperCase(); }
  $('btn-creer').addEventListener('click', function() {
    monPseudo = pseudoSaisi();
    socket.emit('creer', { pseudo: monPseudo });
  });
  $('btn-rejoindre').addEventListener('click', function() {
    monPseudo = pseudoSaisi();
    var c = ($('code').value || '').trim().toUpperCase();
    socket.emit('rejoindre', { pseudo: monPseudo, code: c });
  });
  $('btn-rapide').addEventListener('click', function() {
    monPseudo = pseudoSaisi();
    socket.emit('rapide', { pseudo: monPseudo });
  });
  $('btn-soi').addEventListener('click', function() { socket.emit('tirer', { cible: 'soi' }); });
  $('btn-adv').addEventListener('click', function() { socket.emit('tirer', { cible: 'adversaire' }); });
  $('btn-esquive').addEventListener('click', function() { socket.emit('esquiver', {}); });
  $('objet0').addEventListener('click', function() {
    var t = this.getAttribute('data-type');
    if (t) { socket.emit('objet', { type: t }); }
  });
  $('objet1').addEventListener('click', function() {
    var t = this.getAttribute('data-type');
    if (t) { socket.emit('objet', { type: t }); }
  });
  $('btn-revanche').addEventListener('click', function() { socket.emit('revanche', {}); });
  $('btn-copier').addEventListener('click', function() {
    var lien = $('attente-lien').textContent || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lien);
    }
  });
  $('btn-son').addEventListener('click', function() {
    sonActif = !sonActif;
    this.textContent = sonActif ? 'SON' : 'MUET';
  });
  $('chat-btn').addEventListener('click', function() {
    $('chat-panneau').classList.toggle('ouvert');
  });
  $('chat-forme').addEventListener('submit', function(ev) {
    ev.preventDefault();
    var t = $('chat-texte').value || '';
    t = t.trim();
    if (t) {
      socket.emit('chat', { texte: t.slice(0, 200) });
      $('chat-texte').value = '';
    }
  });
  document.addEventListener('keydown', function(ev) {
    if (!etat || etat.statut !== 'en_cours') { return; }
    var tag = (ev.target && ev.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') { return; }
    var k = (ev.key || '').toLowerCase();
    if (k === 'a') { socket.emit('tirer', { cible: 'soi' }); }
    if (k === 'e') { socket.emit('tirer', { cible: 'adversaire' }); }
    if (k === 's') { socket.emit('esquiver', {}); }
    if (k === '1') {
      var t0 = $('objet0').getAttribute('data-type');
      if (t0) { socket.emit('objet', { type: t0 }); }
    }
    if (k === '2') {
      var t1 = $('objet1').getAttribute('data-type');
      if (t1) { socket.emit('objet', { type: t1 }); }
    }
  });
  setInterval(function() {
    if (!etat || !etat.delai) { return; }
    var reste = etat.delai - Date.now();
    if (reste < 0) { reste = 0; }
    var pct = (reste / 30000) * 100;
    $('barre').style.width = pct + '%';
  }, 100);
  if (solo === '1') {
    monPseudo = pseudoSaisi();
    setTimeout(function() {
      if (socket) { socket.emit('creer', { pseudo: monPseudo, solo: true }); }
    }, 300);
  }
}
document.addEventListener('DOMContentLoaded', init);
</script>
</body>
</html>`;

// --- OUTILS ---
function genererCode() {
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
  } while (salons.has(code));
  return code;
}
function genererJeton() {
  return crypto.randomBytes(12).toString('hex');
}
function melanger(tableau) {
  const a = tableau.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}
function nouveauBarillet() {
  return melanger([true, true, false, false, false, false]);
}
function objetAleatoire() {
  return TYPES_OBJETS[Math.floor(Math.random() * TYPES_OBJETS.length)];
}
function salonDeSocket(socketId) {
  for (const salon of salons.values()) {
    for (const joueur of salon.joueurs) {
      if (joueur.id === socketId) { return salon; }
    }
  }
  return null;
}
function indexJoueur(salon, socketId) {
  for (let i = 0; i < salon.joueurs.length; i++) {
    if (salon.joueurs[i].id === socketId) { return i; }
  }
  return -1;
}
function autreIndex(idx) {
  return 1 - idx;
}

// --- SALONS ---
const salons = new Map();
const fileAttente = [];
function creerSalon() {
  const code = genererCode();
  const salon = {
    code: code,
    statut: 'attente',
    joueurs: [],
    barillet: nouveauBarillet(),
    index: 0,
    tour: 0,
    etat: 'tour',
    manches: [0, 0],
    messages: [],
    dernier: Date.now(),
    delai: 0,
    vainqueur: null,
    arme: null,
    compteTimer: null,
    botTimer: null,
    resolutionTimer: null,
    mancheTimer: null,
    deconnexionTimers: {}
  };
  salons.set(code, salon);
  return salon;
}
function ajouterJoueur(salon, socket, pseudo, options) {
  const opts = options || {};
  const joueur = {
    id: socket ? socket.id : null,
    pseudo: String(pseudo || 'JOUEUR').trim().slice(0, 20) || 'JOUEUR',
    pv: PV_MAX,
    items: [],
    esquives: 1,
    connecte: true,
    jeton: genererJeton(),
    bot: !!opts.bot,
    skip: false,
    veutRevanche: false
  };
  salon.joueurs.push(joueur);
  salon.dernier = Date.now();
  if (socket) {
    socket.join(salon.code);
    socket.emit('salon', { code: salon.code, lien: '/?code=' + salon.code, jeton: joueur.jeton });
  }
  return joueur;
}
function compositionRestante(salon) {
  let reelles = 0;
  let blancs = 0;
  for (let i = salon.index; i < salon.barillet.length; i++) {
    if (salon.barillet[i]) { reelles++; } else { blancs++; }
  }
  return { reelles: reelles, blancs: blancs };
}
function vuePour(salon, idxJoueur) {
  const joueurs = salon.joueurs.map(function(j, i) {
    return {
      pseudo: j.pseudo,
      pv: j.pv,
      items: j.items.slice(),
      esquives: j.esquives,
      connecte: j.connecte,
      estVous: i === idxJoueur,
      manches: salon.manches[i] || 0
    };
  });
  const cibleIdx = salon.arme ? salon.arme.cibleIdx : -1;
  return {
    code: salon.code,
    statut: salon.statut,
    etat: salon.etat,
    tour: salon.tour,
    tourEstMoi: salon.tour === idxJoueur,
    cibleEstMoi: cibleIdx === idxJoueur,
    joueurs: joueurs,
    restant: compositionRestante(salon),
    consomme: salon.index,
    manches: salon.manches.slice(),
    delai: salon.delai,
    vainqueur: salon.vainqueur,
    messages: salon.messages.slice(-30)
  };
}
function diffuserEtat(salon) {
  salon.dernier = Date.now();
  for (let i = 0; i < salon.joueurs.length; i++) {
    const joueur = salon.joueurs[i];
    if (joueur.bot || !joueur.id) { continue; }
    io.to(joueur.id).emit('etat', vuePour(salon, i));
  }
}
function diffuserTous(salon, event, donnees) {
  io.to(salon.code).emit(event, donnees);
}
function arreterCompte(salon) {
  if (salon.compteTimer) {
    clearTimeout(salon.compteTimer);
    salon.compteTimer = null;
  }
}
function arreterBot(salon) {
  if (salon.botTimer) {
    clearTimeout(salon.botTimer);
    salon.botTimer = null;
  }
}
function demarrerCompte(salon) {
  arreterCompte(salon);
  salon.delai = Date.now() + DELAI_TOUR_MS;
  if (salon.statut !== 'en_cours' || salon.etat !== 'tour') { return; }
  salon.compteTimer = setTimeout(function() {
    actionAutomatique(salon);
  }, DELAI_TOUR_MS);
}
function demarrerManche(salon) {
  salon.statut = 'en_cours';
  salon.etat = 'tour';
  salon.vainqueur = null;
  salon.arme = null;
  salon.barillet = nouveauBarillet();
  salon.index = 0;
  salon.tour = Math.floor(Math.random() * 2);
  for (const joueur of salon.joueurs) {
    joueur.pv = PV_MAX;
    joueur.esquives = 1;
    joueur.skip = false;
    joueur.veutRevanche = false;
    if (joueur.items.length < 2) {
      joueur.items.push(objetAleatoire());
    }
  }
  diffuserEtat(salon);
  demarrerCompte(salon);
  planifierBot(salon);
}
function demarrerPartie(salon) {
  salon.manches = [0, 0];
  demarrerManche(salon);
}
function recharger(salon) {
  salon.barillet = nouveauBarillet();
  salon.index = 0;
  diffuserTous(salon, 'rechargement', {});
}

// --- RESOLUTION ---
function planifierBot(salon) {
  arreterBot(salon);
  if (salon.statut !== 'en_cours') { return; }
  if (salon.etat === 'tour') {
    const joueur = salon.joueurs[salon.tour];
    if (joueur && joueur.bot) {
      salon.botTimer = setTimeout(function() {
        if (salon.statut !== 'en_cours' || salon.etat !== 'tour') { return; }
        if (!salon.joueurs[salon.tour] || !salon.joueurs[salon.tour].bot) { return; }
        const choix = Math.random() < 0.5 ? 'soi' : 'adversaire';
        if (salon.joueurs[salon.tour].items.length > 0 && Math.random() < 0.25) {
          utiliserObjet(salon, salon.tour, salon.joueurs[salon.tour].items[0]);
        } else {
          tirer(salon, salon.tour, choix);
        }
      }, 1200);
    }
  }
  if (salon.etat === 'arme' && salon.arme) {
    const cible = salon.joueurs[salon.arme.cibleIdx];
    if (cible && cible.bot && cible.esquives > 0 && Math.random() < 0.5) {
      salon.botTimer = setTimeout(function() {
        esquiver(salon, salon.arme.cibleIdx);
      }, 200);
    }
  }
}
function actionAutomatique(salon) {
  if (salon.statut !== 'en_cours' || salon.etat !== 'tour') { return; }
  const idx = salon.tour;
  const joueur = salon.joueurs[idx];
  if (!joueur) { return; }
  if (joueur.items.length > 0 && Math.random() < 0.3) {
    utiliserObjet(salon, idx, joueur.items[Math.floor(Math.random() * joueur.items.length)]);
    return;
  }
  const choix = Math.random() < 0.5 ? 'soi' : 'adversaire';
  tirer(salon, idx, choix);
}
function tirer(salon, auteurIdx, cible) {
  if (salon.statut !== 'en_cours') { return false; }
  if (salon.etat !== 'tour') { return false; }
  if (salon.tour !== auteurIdx) { return false; }
  const cibleIdx = cible === 'soi' ? auteurIdx : autreIndex(auteurIdx);
  salon.etat = 'arme';
  salon.arme = { auteurIdx: auteurIdx, cibleIdx: cibleIdx, dodged: false };
  arreterCompte(salon);
  salon.dernier = Date.now();
  diffuserTous(salon, 'tir', {
    auteur: salon.joueurs[auteurIdx].pseudo,
    cible: salon.joueurs[cibleIdx].pseudo
  });
  diffuserEtat(salon);
  planifierBot(salon);
  const delai = 300 + Math.floor(Math.random() * 401);
  salon.resolutionTimer = setTimeout(function() {
    resoudre(salon);
  }, delai);
  return true;
}
function esquiver(salon, joueurIdx) {
  if (salon.statut !== 'en_cours') { return false; }
  if (salon.etat !== 'arme' || !salon.arme) { return false; }
  if (salon.arme.cibleIdx !== joueurIdx) { return false; }
  if (salon.arme.dodged) { return false; }
  const joueur = salon.joueurs[joueurIdx];
  if (!joueur || joueur.esquives <= 0) { return false; }
  joueur.esquives--;
  salon.arme.dodged = true;
  salon.dernier = Date.now();
  diffuserEtat(salon);
  return true;
}
function resoudre(salon) {
  if (!salon.arme) { return; }
  const arme = salon.arme;
  const reelle = salon.barillet[salon.index] === true;
  salon.index++;
  salon.arme = null;
  salon.etat = 'resolution';
  salon.dernier = Date.now();
  diffuserTous(salon, 'flash', { reelle: reelle });
  const auteur = salon.joueurs[arme.auteurIdx];
  const cible = salon.joueurs[arme.cibleIdx];
  let prochainTour = autreIndex(arme.auteurIdx);
  if (arme.dodged) {
    diffuserTous(salon, 'esquive', { joueur: cible.pseudo, reelle: reelle });
    prochainTour = arme.cibleIdx;
  } else if (reelle) {
    cible.pv = Math.max(0, cible.pv - 1);
    diffuserTous(salon, 'degat', { joueur: cible.pseudo, pv: cible.pv });
    prochainTour = autreIndex(arme.auteurIdx);
  } else {
    if (arme.cibleIdx === arme.auteurIdx) {
      prochainTour = arme.auteurIdx;
    } else {
      prochainTour = arme.cibleIdx;
    }
  }
  diffuserEtat(salon);
  salon.resolutionTimer = setTimeout(function() {
    continuerApresResolution(salon, prochainTour);
  }, 900);
}
function continuerApresResolution(salon, prochainTour) {
  if (salon.statut !== 'en_cours') { return; }
  const perdant = salon.joueurs.findIndex(function(j) { return j.pv <= 0; });
  if (perdant !== -1) {
    const gagnant = autreIndex(perdant);
    salon.manches[gagnant]++;
    salon.etat = 'manche_fin';
    salon.dernier = Date.now();
    diffuserTous(salon, 'manche_fin', { vainqueur: salon.joueurs[gagnant].pseudo });
    diffuserEtat(salon);
    salon.mancheTimer = setTimeout(function() {
      if (salon.manches[gagnant] >= MANCHES_POUR_GAGNER) {
        terminerPartie(salon, gagnant);
      } else {
        demarrerManche(salon);
      }
    }, 2500);
    return;
  }
  if (salon.index >= salon.barillet.length) {
    recharger(salon);
  }
  salon.tour = prochainTour;
  const suivant = salon.joueurs[salon.tour];
  if (suivant && suivant.skip) {
    suivant.skip = false;
    salon.tour = autreIndex(salon.tour);
  }
  salon.etat = 'tour';
  diffuserEtat(salon);
  demarrerCompte(salon);
  planifierBot(salon);
}
function terminerPartie(salon, gagnantIdx) {
  salon.statut = 'termine';
  salon.etat = 'fin';
  salon.vainqueur = salon.joueurs[gagnantIdx].pseudo;
  salon.dernier = Date.now();
  arreterCompte(salon);
  arreterBot(salon);
  diffuserTous(salon, 'fin', { vainqueur: salon.vainqueur });
  diffuserEtat(salon);
}
function utiliserObjet(salon, joueurIdx, type) {
  if (salon.statut !== 'en_cours') { return false; }
  if (salon.etat !== 'tour') { return false; }
  if (salon.tour !== joueurIdx) { return false; }
  const joueur = salon.joueurs[joueurIdx];
  const pos = joueur.items.indexOf(type);
  if (pos === -1) { return false; }
  joueur.items.splice(pos, 1);
  salon.dernier = Date.now();
  if (type === 'loupe') {
    const reelle = salon.barillet[salon.index] === true;
    if (!joueur.bot && joueur.id) {
      io.to(joueur.id).emit('flash', { type: 'loupe', reelle: reelle });
    }
  } else if (type === 'biere') {
    salon.index++;
    if (salon.index >= salon.barillet.length) {
      recharger(salon);
    }
  } else if (type === 'menottes') {
    const adversaire = salon.joueurs[autreIndex(joueurIdx)];
    if (adversaire) { adversaire.skip = true; }
  }
  diffuserEtat(salon);
  demarrerCompte(salon);
  planifierBot(salon);
  return true;
}
function forfait(salon, idxPerdant) {
  if (salon.statut === 'termine') { return; }
  if (salon.statut === 'attente') {
    salon.joueurs.splice(idxPerdant, 1);
    if (salon.joueurs.length === 0) {
      salons.delete(salon.code);
    } else {
      diffuserEtat(salon);
    }
    return;
  }
  const gagnant = autreIndex(idxPerdant);
  terminerPartie(salon, gagnant);
}
function programmerForfait(salon, joueur) {
  const jeton = joueur.jeton;
  const timer = setTimeout(function() {
    const idx = salon.joueurs.findIndex(function(j) { return j.jeton === jeton; });
    if (idx === -1) { return; }
    if (salon.joueurs[idx].connecte) { return; }
    forfait(salon, idx);
  }, DELAI_DECONNEXION_MS);
  salon.deconnexionTimers[jeton] = timer;
}

// --- SOCKET ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);
function erreur(socket, code, message) {
  socket.emit('erreur', { code: code, message: message });
}
function pseudoDepuis(donnees) {
  if (typeof donnees === 'string') { return donnees; }
  if (donnees && typeof donnees.pseudo === 'string') { return donnees.pseudo; }
  return '';
}
io.on('connection', function(socket) {
  socket.on('creer', function(donnees) {
    const pseudo = pseudoDepuis(donnees);
    if (!pseudo.trim()) {
      erreur(socket, 'PSEUDO_REQUIS', 'Pseudo requis');
      return;
    }
    const solo = !!(donnees && donnees.solo);
    const salon = creerSalon();
    ajouterJoueur(salon, socket, pseudo, {});
    if (solo) {
      ajouterJoueur(salon, null, 'SIMULÉ', { bot: true });
      demarrerPartie(salon);
    } else {
      diffuserEtat(salon);
    }
  });
  socket.on('rejoindre', function(donnees) {
    const pseudo = pseudoDepuis(donnees);
    const code = donnees && donnees.code ? String(donnees.code).trim().toUpperCase() : '';
    if (!pseudo.trim()) {
      erreur(socket, 'PSEUDO_REQUIS', 'Pseudo requis');
      return;
    }
    if (!code) {
      erreur(socket, 'CODE_REQUIS', 'Code requis');
      return;
    }
    const salon = salons.get(code);
    if (!salon) {
      erreur(socket, 'SALON_INTROUVABLE', 'Salon introuvable');
      return;
    }
    if (salon.joueurs.length >= 2) {
      erreur(socket, 'SALON_PLEIN', 'Salon plein');
      return;
    }
    ajouterJoueur(salon, socket, pseudo, {});
    if (salon.joueurs.length === 2) {
      demarrerPartie(salon);
    } else {
      diffuserEtat(salon);
    }
  });
  socket.on('rapide', function(donnees) {
    const pseudo = pseudoDepuis(donnees);
    if (!pseudo.trim()) {
      erreur(socket, 'PSEUDO_REQUIS', 'Pseudo requis');
      return;
    }
    const attente = fileAttente.find(function(e) { return e.socketId !== socket.id; });
    if (attente) {
      const pos = fileAttente.indexOf(attente);
      if (pos !== -1) { fileAttente.splice(pos, 1); }
      const salon = creerSalon();
      const s1 = io.sockets.sockets.get(attente.socketId);
      if (s1) {
        ajouterJoueur(salon, s1, attente.pseudo, {});
      }
      ajouterJoueur(salon, socket, pseudo, {});
      demarrerPartie(salon);
    } else {
      fileAttente.push({ socketId: socket.id, pseudo: pseudo });
      socket.emit('salon', { code: 'ATTENTE', lien: '' });
    }
  });
  socket.on('reconnect', function(donnees) {
    const code = donnees && donnees.code ? String(donnees.code).trim().toUpperCase() : '';
    const jeton = donnees && donnees.jeton ? String(donnees.jeton) : '';
    const salon = salons.get(code);
    if (!salon || !jeton) { return; }
    const idx = salon.joueurs.findIndex(function(j) { return j.jeton === jeton; });
    if (idx === -1) { return; }
    const joueur = salon.joueurs[idx];
    if (salon.deconnexionTimers[jeton]) {
      clearTimeout(salon.deconnexionTimers[jeton]);
      delete salon.deconnexionTimers[jeton];
    }
    joueur.id = socket.id;
    joueur.connecte = true;
    socket.join(salon.code);
    socket.emit('salon', { code: salon.code, lien: '/?code=' + salon.code, jeton: joueur.jeton });
    diffuserEtat(salon);
    planifierBot(salon);
  });
  socket.on('tirer', function(donnees) {
    const salon = salonDeSocket(socket.id);
    if (!salon) { return; }
    const idx = indexJoueur(salon, socket.id);
    if (idx === -1) { return; }
    let cible = 'adversaire';
    if (typeof donnees === 'string') { cible = donnees; }
    if (donnees && donnees.cible) { cible = donnees.cible; }
    if (cible !== 'soi' && cible !== 'adversaire') { cible = 'adversaire'; }
    const ok = tirer(salon, idx, cible);
    if (!ok) {
      erreur(socket, 'ACTION_REFUSEE', 'Action refusée');
    }
  });
  socket.on('esquiver', function() {
    const salon = salonDeSocket(socket.id);
    if (!salon) { return; }
    const idx = indexJoueur(salon, socket.id);
    if (idx === -1) { return; }
    const ok = esquiver(salon, idx);
    if (!ok) {
      erreur(socket, 'ESQUIVE_REFUSEE', 'Esquive refusée');
    }
  });
  socket.on('objet', function(donnees) {
    const salon = salonDeSocket(socket.id);
    if (!salon) { return; }
    const idx = indexJoueur(salon, socket.id);
    if (idx === -1) { return; }
    let type = '';
    if (typeof donnees === 'string') { type = donnees; }
    if (donnees && donnees.type) { type = donnees.type; }
    if (TYPES_OBJETS.indexOf(type) === -1) {
      erreur(socket, 'OBJET_INCONNU', 'Objet inconnu');
      return;
    }
    const ok = utiliserObjet(salon, idx, type);
    if (!ok) {
      erreur(socket, 'OBJET_REFUSE', 'Objet refusé');
    }
  });
  socket.on('chat', function(donnees) {
    const salon = salonDeSocket(socket.id);
    if (!salon) { return; }
    const idx = indexJoueur(salon, socket.id);
    if (idx === -1) { return; }
    let texte = '';
    if (typeof donnees === 'string') { texte = donnees; }
    if (donnees && donnees.texte) { texte = donnees.texte; }
    texte = String(texte).slice(0, 200);
    if (!texte.trim()) { return; }
    const pseudo = salon.joueurs[idx].pseudo;
    salon.messages.push({ pseudo: pseudo, texte: texte });
    salon.dernier = Date.now();
    diffuserTous(salon, 'chat', { pseudo: pseudo, texte: texte });
  });
  socket.on('revanche', function() {
    const salon = salonDeSocket(socket.id);
    if (!salon) { return; }
    const idx = indexJoueur(salon, socket.id);
    if (idx === -1) { return; }
    if (salon.statut !== 'termine') { return; }
    salon.joueurs[idx].veutRevanche = true;
    const tous = salon.joueurs.every(function(j) { return j.bot || j.veutRevanche; });
    if (tous) {
      demarrerPartie(salon);
    } else {
      diffuserEtat(salon);
    }
  });
  socket.on('disconnect', function() {
    const pos = fileAttente.findIndex(function(e) { return e.socketId === socket.id; });
    if (pos !== -1) { fileAttente.splice(pos, 1); }
    const salon = salonDeSocket(socket.id);
    if (!salon) { return; }
    const idx = indexJoueur(salon, socket.id);
    if (idx === -1) { return; }
    salon.joueurs[idx].connecte = false;
    salon.dernier = Date.now();
    programmerForfait(salon, salon.joueurs[idx]);
    diffuserEtat(salon);
  });
});

// --- SERVEUR ---
app.get('/', function(req, res) {
  res.type('html').send(PAGE);
});
setInterval(function() {
  const maintenant = Date.now();
  for (const salon of Array.from(salons.values())) {
    if (maintenant - salon.dernier > PURGE_MS) {
      arreterCompte(salon);
      arreterBot(salon);
      if (salon.resolutionTimer) { clearTimeout(salon.resolutionTimer); }
      if (salon.mancheTimer) { clearTimeout(salon.mancheTimer); }
      for (const jeton of Object.keys(salon.deconnexionTimers)) {
        clearTimeout(salon.deconnexionTimers[jeton]);
      }
      salons.delete(salon.code);
    }
  }
}, 60000);
server.listen(PORT, '0.0.0.0', function() {
  console.log('Écoute sur le port ' + PORT);
});
